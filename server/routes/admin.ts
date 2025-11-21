import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { requireAdminSecure, AdminRequest } from '../middleware/adminAuth'; // Novo middleware v2.0
import { NotificationService } from '../services/NotificationService';
import { EmailService } from '../services/EmailService';
import { StockService } from '../services/StockService';
import { ShippingService } from '../services/ShippingService';
import { adminRateLimiter } from '../middleware/rateLimit';
import { AuditService } from '../services/AuditService';
import { auditAdminAction } from '../middleware/adminAuth';

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication and admin role
// Versão 2.0: Usar requireAdminSecure para maior segurança
// Admin separado agora está totalmente funcional
router.use(requireAdminSecure); // Middleware de segurança adicional para admin
router.use(adminRateLimiter); // Rate limiting para rotas admin

// Dashboard stats
router.get('/dashboard', async (req: AdminRequest, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 10,
        include: {
          user: {
            select: { name: true, email: true },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }).then((orders) =>
        orders.map((order) => ({
          ...order,
          total: Number(order.total),
          items: order.items.map((item) => ({
            ...item,
            price: Number(item.price),
            product: {
              ...item.product,
              price: Number(item.product.price),
              originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : undefined,
            },
          })),
        }))
      ),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get product details for top products (otimizado - busca todos de uma vez)
    const productIds = topProducts.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Create map for quick lookup
    const productsMap = new Map(products.map((p) => [p.id, p]));

    // Combine with top products data
    const topProductsWithDetails = topProducts.map((item) => {
      const product = productsMap.get(item.productId);
      return {
        ...product,
        price: product ? Number(product.price) : 0,
        originalPrice: product?.originalPrice ? Number(product.originalPrice) : undefined,
        totalSold: item._sum.quantity || 0,
        sizes: product ? JSON.parse(product.sizes) : [],
        colors: product ? JSON.parse(product.colors) : [],
      };
    }).filter(p => p.id); // Remove produtos não encontrados

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// Get all orders (admin)
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limite para evitar queries muito grandes
    });

    // Convert Decimal to number
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : undefined,
        },
      })),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Update order status
router.patch('/orders/:id', async (req: AdminRequest, res) => {
  try {
    const { status } = req.body;
    const orderId = parseInt(req.params.id);

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Get old order to compare status
    const oldOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, userId: true },
    });

    if (!oldOrder) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Gerenciar estoque quando status mudar (v2.0)
    if (oldOrder.status !== status) {
      try {
        // Buscar movimentações de estoque relacionadas a este pedido
        const stockMovements = await prisma.stockMovement.findMany({
          where: { orderId: orderId },
          include: { variant: true },
        });

        // Se status mudar para "processing", "shipped" ou "delivered" → converter reserva em venda
        if ((status === 'processing' || status === 'shipped' || status === 'delivered') &&
            (oldOrder.status === 'pending')) {
          for (const movement of stockMovements) {
            if (movement.type === 'reserve' && movement.variant) {
              try {
                await StockService.confirmSale(
                  movement.variantId!,
                  movement.quantity,
                  orderId
                );
              } catch (error) {
                console.error(`Error confirming sale for variant ${movement.variantId}:`, error);
                // Continuar mesmo se falhar para uma variação
              }
            }
          }
        }

        // Se status mudar para "cancelled" → liberar estoque reservado
        if (status === 'cancelled' && oldOrder.status !== 'cancelled') {
          for (const movement of stockMovements) {
            if ((movement.type === 'reserve' || movement.type === 'adjust') && movement.variant) {
              try {
                await StockService.releaseStock(
                  movement.variantId!,
                  movement.quantity,
                  orderId
                );
              } catch (error) {
                console.error(`Error releasing stock for variant ${movement.variantId}:`, error);
                // Continuar mesmo se falhar para uma variação
              }
            }
          }
        }
      } catch (error) {
        console.error('Error managing stock on status update:', error);
        // Não falhar a atualização de status se o gerenciamento de estoque falhar
      }
    }

    // Notify user about status update if status changed
    if (oldOrder.status !== status) {
      try {
        await NotificationService.notifyOrderStatusUpdate(
          oldOrder.userId,
          orderId,
          oldOrder.status,
          status
        );
      } catch (error) {
        console.error('Error sending order status notification:', error);
        // Don't fail the status update if notification fails
      }

      // Send status update email to customer
      if (order.user.email) {
        try {
          await EmailService.sendOrderStatusUpdate(
            order.user.email,
            order.user.name,
            orderId,
            oldOrder.status,
            status
          );
        } catch (error) {
          console.error('Error sending status update email:', error);
          // Don't fail the status update if email fails
        }
      }
    }

    // Convert Decimal to number
    const formattedOrder = {
      ...order,
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : undefined,
        },
      })),
    };

    // Registrar ação na auditoria
    if (oldOrder.status !== status) {
      await AuditService.log({
        userId: req.adminUserId,
        userEmail: req.adminUser?.email,
        action: 'update',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          oldStatus: oldOrder.status,
          newStatus: status,
          orderTotal: Number(order.total),
        },
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      });
    }

    res.json(formattedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// Get all products (admin)
router.get('/products', async (req: AdminRequest, res) => {
  try {
    const { page = '1', limit = '100', search, categoryId, featured } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      // MySQL não suporta mode: 'insensitive', então usamos busca case-sensitive
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }
    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]'),
      gender: product.gender || null,
      stock: product.stock || 0,
    }));

    // Retornar array direto para compatibilidade com frontend
    res.json(formattedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Create product
router.post('/products', async (req: AdminRequest, res) => {
  try {
    const { name, description, detailedDescription, price, originalPrice, image, categoryId, sizes, colors, gender, featured, stock } = req.body;

    if (!name || !description || !price || !image || !categoryId) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        detailedDescription: detailedDescription || null,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        categoryId: parseInt(categoryId),
        sizes: JSON.stringify(sizes || []),
        colors: JSON.stringify(colors || []),
        gender: gender || null, // Opcional: 'menino', 'menina', 'outros' ou null
        featured: featured || false,
        stock: parseInt(stock) || 0,
      },
      include: {
        category: true,
      },
    });

    // Se o produto tem estoque, criar uma variação padrão automaticamente
    const stockAmount = parseInt(stock) || 0;
    if (stockAmount > 0) {
      try {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: null, // Variação padrão sem tamanho específico
            color: null, // Variação padrão sem cor específica
            stock: stockAmount,
            minStock: 5, // Estoque mínimo padrão
            price: null, // Usa o preço do produto
            isActive: true,
          },
        });
        console.log(`✅ Variação padrão criada automaticamente para o produto ${product.id} com estoque ${stockAmount}`);
      } catch (error: any) {
        // Se já existe uma variação padrão (size=null, color=null), atualizar o estoque
        if (error.code === 'P2002') {
          await prisma.productVariant.updateMany({
            where: {
              productId: product.id,
              size: null,
              color: null,
            },
            data: {
              stock: stockAmount,
            },
          });
          console.log(`✅ Estoque da variação padrão atualizado para o produto ${product.id}`);
        } else {
          console.error('Erro ao criar variação padrão:', error);
          // Não falhar a criação do produto se a variação falhar
        }
      }
    }

    // Registrar ação na auditoria
    await AuditService.log({
      userId: req.adminUserId,
      userEmail: req.adminUser?.email,
      action: 'create',
      resourceType: 'product',
      resourceId: product.id,
      details: { name, price: parseFloat(price) },
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    const formattedProduct = {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      sizes: JSON.parse(product.sizes),
      colors: JSON.parse(product.colors),
      gender: product.gender || null,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Update product
router.put('/products/:id', async (req: AdminRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, detailedDescription, price, originalPrice, image, categoryId, sizes, colors, gender, featured, stock } = req.body;

    // Get old product to check stock level
    const oldProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true },
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        detailedDescription: detailedDescription !== undefined ? (detailedDescription || null) : undefined,
        price: price ? parseFloat(price) : undefined,
        originalPrice: originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : undefined,
        image,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        sizes: sizes ? JSON.stringify(sizes) : undefined,
        colors: colors ? JSON.stringify(colors) : undefined,
        gender: gender !== undefined ? (gender || null) : undefined, // Opcional: 'menino', 'menina', 'outros' ou null
        featured,
        stock: stock !== undefined ? parseInt(stock) : undefined,
      },
      include: {
        category: true,
      },
    });

    // Sincronizar Product.stock com ProductVariant padrão (sem tamanho/cor)
    if (stock !== undefined) {
      const stockAmount = parseInt(stock) || 0;
      try {
        // Verificar se já existe uma variação padrão
        const defaultVariant = await prisma.productVariant.findFirst({
          where: {
            productId: productId,
            size: null,
            color: null,
          },
        });

        if (defaultVariant) {
          // Atualizar a variação padrão existente
          await prisma.productVariant.update({
            where: { id: defaultVariant.id },
            data: { stock: stockAmount },
          });
          console.log(`✅ Estoque da variação padrão sincronizado para o produto ${productId}`);
        } else if (stockAmount > 0) {
          // Criar nova variação padrão se não existir e houver estoque
          await prisma.productVariant.create({
            data: {
              productId: productId,
              size: null,
              color: null,
              stock: stockAmount,
              minStock: 5,
              price: null,
              isActive: true,
            },
          });
          console.log(`✅ Variação padrão criada automaticamente para o produto ${productId} com estoque ${stockAmount}`);
        }
      } catch (error: any) {
        console.error('Erro ao sincronizar variação padrão:', error);
        // Não falhar a atualização do produto se a variação falhar
      }
    }

    // Check if stock is low (below 10) and notify admins
    const currentStock = product.stock;
    if (currentStock < 10 && (!oldProduct || oldProduct.stock >= 10)) {
      try {
        await NotificationService.notifyLowStock(
          productId,
          product.name,
          currentStock
        );
      } catch (error) {
        console.error('Error sending low stock notification:', error);
        // Don't fail the product update if notification fails
      }
    }

    // Registrar ação na auditoria (assíncrono para não bloquear a resposta)
    AuditService.log({
      userId: req.adminUserId,
      userEmail: req.adminUser?.email,
      action: 'update',
      resourceType: 'product',
      resourceId: productId,
      details: { 
        name: product.name, 
        price: Number(product.price),
        changes: {
          name: name !== oldProduct?.name,
          price: price !== undefined,
          stock: stock !== undefined,
        }
      },
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    const formattedProduct = {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      sizes: JSON.parse(product.sizes),
      colors: JSON.parse(product.colors),
      gender: product.gender || null,
    };

    res.json(formattedProduct);
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(500).json({ 
      error: 'Erro ao atualizar produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete product
router.delete('/products/:id', async (req: AdminRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Buscar produto antes de deletar para auditoria
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Registrar ação na auditoria
    await AuditService.log({
      userId: req.adminUserId,
      userEmail: req.adminUser?.email,
      action: 'delete',
      resourceType: 'product',
      resourceId: productId,
      details: { name: product.name },
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// Create category
router.post('/categories', async (req: AuthRequest, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nome e slug são obrigatórios' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Update category
router.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, slug, description } = req.body;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        description,
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Delete category
router.delete('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    await prisma.category.delete({
      where: { id: categoryId },
    });

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// Get all users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users.map((user) => ({
      ...user,
      ordersCount: user._count.orders,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Update user
router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, password, isAdmin } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
        name,
        email,
        isAdmin: isAdmin !== undefined ? isAdmin : existingUser.isAdmin,
    };

    // Se uma nova senha foi fornecida, fazer hash
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    res.json({
      ...user,
      ordersCount: user._count.orders,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Delete user
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting self
    if (req.userId === userId) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Get sales report data
router.get('/reports/sales', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5000, // Limite maior para relatórios, mas ainda controlado
    });

    // Format data for report
    const reportData = orders.map((order) => ({
      id: order.id,
      date: order.createdAt,
      customerName: order.user.name,
      customerEmail: order.user.email,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: Number(item.price),
        subtotal: Number(item.price) * item.quantity,
      })),
    }));

    // Calculate summary
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
      totalItems: orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
      byStatus: {
        pending: orders.filter((o) => o.status === 'pending').length,
        processing: orders.filter((o) => o.status === 'processing').length,
        shipped: orders.filter((o) => o.status === 'shipped').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
      },
    };

    res.json({
      summary,
      orders: reportData,
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
  }
});

// Export sales report as CSV
router.get('/reports/sales/export', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const csvRows = [];
    
    // Header
    csvRows.push([
      'ID Pedido',
      'Data',
      'Cliente',
      'Email',
      'Produto',
      'Quantidade',
      'Tamanho',
      'Cor',
      'Preço Unitário',
      'Subtotal',
      'Total Pedido',
      'Status',
      'Método de Pagamento',
    ].join(','));

    // Data rows
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
      const orderTotal = Number(order.total).toFixed(2);
      const statusMap: Record<string, string> = {
        pending: 'Pendente',
        processing: 'Processando',
        shipped: 'Enviado',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
      };

      if (order.items.length === 0) {
        csvRows.push([
          order.id,
          orderDate,
          `"${order.user.name}"`,
          order.user.email,
          '',
          '',
          '',
          '',
          '',
          '',
          orderTotal,
          statusMap[order.status] || order.status,
          order.paymentMethod,
        ].join(','));
      } else {
        order.items.forEach((item, index) => {
          const price = Number(item.price).toFixed(2);
          const subtotal = (Number(item.price) * item.quantity).toFixed(2);
          
          csvRows.push([
            index === 0 ? order.id : '',
            index === 0 ? orderDate : '',
            index === 0 ? `"${order.user.name}"` : '',
            index === 0 ? order.user.email : '',
            `"${item.product.name}"`,
            item.quantity,
            item.size,
            item.color,
            price,
            subtotal,
            index === 0 ? orderTotal : '',
            index === 0 ? (statusMap[order.status] || order.status) : '',
            index === 0 ? order.paymentMethod : '',
          ].join(','));
        });
      }
    });

    const csv = csvRows.join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf-8'));
    
    res.send('\ufeff' + csv); // BOM for Excel compatibility
  } catch (error) {
    console.error('Export sales report error:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório de vendas' });
  }
});

// Analytics Overview - Métricas avançadas
router.get('/analytics/overview', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default: últimos 30 dias
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Buscar dados básicos
    const [
      orders,
      totalUsers,
      totalVisitors,
      totalProducts,
    ] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: true,
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          coupon: true,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      // Total de visitantes (aproximação: total de usuários + visitantes não autenticados)
      // Por enquanto, usamos total de usuários como proxy
      prisma.user.count(),
      prisma.product.count(),
    ]);

    // Calcular métricas
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // Ticket médio
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Taxa de conversão (estimativa: pedidos / visitantes * 100)
    // Usando totalUsers como proxy de visitantes
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

    // Clientes novos vs recorrentes
    const uniqueCustomers = new Set(orders.map(order => order.userId));
    const newCustomers = await prisma.user.count({
      where: {
        id: { in: Array.from(uniqueCustomers) },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
    const returningCustomers = uniqueCustomers.size - newCustomers;

    // Produtos mais vendidos
    const productSales = new Map<number, { productId: number; name: string; category: string; totalSold: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId;
        const existing = productSales.get(productId);
        if (existing) {
          existing.totalSold += item.quantity;
          existing.revenue += Number(item.price) * item.quantity;
        } else {
          productSales.set(productId, {
            productId,
            name: item.product.name,
            category: item.product.category?.name || 'Sem categoria',
            totalSold: item.quantity,
            revenue: Number(item.price) * item.quantity,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Ticket médio por categoria
    const categoryRevenue = new Map<string, { category: string; orders: number; revenue: number; averageTicket: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const categoryName = item.product.category?.name || 'Sem categoria';
        const existing = categoryRevenue.get(categoryName);
        if (existing) {
          existing.orders += 1;
          existing.revenue += Number(item.price) * item.quantity;
        } else {
          categoryRevenue.set(categoryName, {
            category: categoryName,
            orders: 1,
            revenue: Number(item.price) * item.quantity,
            averageTicket: 0,
          });
        }
      });
    });

    const categoryMetrics = Array.from(categoryRevenue.values()).map(cat => ({
      ...cat,
      averageTicket: cat.orders > 0 ? cat.revenue / cat.orders : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Horários de pico (agrupar por hora do dia)
    const hourlyOrders = new Map<number, number>();
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyOrders.set(hour, (hourlyOrders.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourlyOrders.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Taxa de abandono (estimativa: pedidos cancelados / total)
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const abandonmentRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Cupons utilizados
    const ordersWithCoupons = orders.filter(o => o.couponId !== null).length;
    const couponUsageRate = totalOrders > 0 ? (ordersWithCoupons / totalOrders) * 100 : 0;
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discountAmount ? Number(order.discountAmount) : 0), 0);

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        totalOrders,
        totalRevenue,
        totalItems,
        averageTicket,
        conversionRate,
        abandonmentRate,
        couponUsageRate,
        totalDiscount,
      },
      customers: {
        total: uniqueCustomers.size,
        new: newCustomers,
        returning: returningCustomers,
        newVsReturning: {
          new: uniqueCustomers.size > 0 ? (newCustomers / uniqueCustomers.size) * 100 : 0,
          returning: uniqueCustomers.size > 0 ? (returningCustomers / uniqueCustomers.size) * 100 : 0,
        },
      },
      topProducts,
      categoryMetrics,
      peakHours,
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics overview' });
  }
});

// Analytics Trends - Análise de tendências e comparação
router.get('/analytics/trends', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, comparePeriod } = req.query;

    // Período atual
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

    // Período anterior para comparação (se solicitado)
    let previousPeriodStart: Date | null = null;
    let previousPeriodEnd: Date | null = null;
    
    if (comparePeriod === 'true') {
      previousPeriodEnd = new Date(start.getTime() - 1);
      previousPeriodStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    }

    // Buscar dados do período atual
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        coupon: true,
      },
    });

    // Buscar dados do período anterior (se solicitado)
    let previousOrders: any[] = [];
    if (previousPeriodStart && previousPeriodEnd) {
      previousOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          coupon: true,
        },
      });
    }

    // Calcular métricas do período atual
    const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const currentOrderCount = currentOrders.length;
    const currentAverageTicket = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const currentUniqueCustomers = new Set(currentOrders.map(o => o.userId)).size;

    // Calcular métricas do período anterior
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousOrderCount = previousOrders.length;
    const previousAverageTicket = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
    const previousUniqueCustomers = new Set(previousOrders.map(o => o.userId)).size;

    // Calcular variação percentual
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersChange = previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0;
    const ticketChange = previousAverageTicket > 0 ? ((currentAverageTicket - previousAverageTicket) / previousAverageTicket) * 100 : 0;
    const customersChange = previousUniqueCustomers > 0 ? ((currentUniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 : 0;

    // Agrupar por dia (para gráfico de tendência)
    const dailyData = new Map<string, { date: string; revenue: number; orders: number; customers: Set<number> }>();
    
    currentOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey);
      if (existing) {
        existing.revenue += Number(order.total);
        existing.orders += 1;
        existing.customers.add(order.userId);
      } else {
        dailyData.set(dateKey, {
          date: dateKey,
          revenue: Number(order.total),
          orders: 1,
          customers: new Set([order.userId]),
        });
      }
    });

    const trendData = Array.from(dailyData.values())
      .map(d => ({
        date: d.date,
        revenue: d.revenue,
        orders: d.orders,
        customers: d.customers.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Análise por categoria (período atual)
    const categoryAnalysis = new Map<string, { category: string; orders: number; revenue: number; items: number }>();
    currentOrders.forEach(order => {
      order.items.forEach(item => {
        const categoryName = item.product.category?.name || 'Sem categoria';
        const existing = categoryAnalysis.get(categoryName);
        if (existing) {
          existing.orders += 1;
          existing.revenue += Number(item.price) * item.quantity;
          existing.items += item.quantity;
        } else {
          categoryAnalysis.set(categoryName, {
            category: categoryName,
            orders: 1,
            revenue: Number(item.price) * item.quantity,
            items: item.quantity,
          });
        }
      });
    });

    res.json({
      current: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        metrics: {
          revenue: currentRevenue,
          orders: currentOrderCount,
          averageTicket: currentAverageTicket,
          uniqueCustomers: currentUniqueCustomers,
        },
      },
      previous: previousPeriodStart && previousPeriodEnd ? {
        period: {
          start: previousPeriodStart.toISOString(),
          end: previousPeriodEnd.toISOString(),
        },
        metrics: {
          revenue: previousRevenue,
          orders: previousOrderCount,
          averageTicket: previousAverageTicket,
          uniqueCustomers: previousUniqueCustomers,
        },
      } : null,
      changes: {
        revenue: revenueChange,
        orders: ordersChange,
        averageTicket: ticketChange,
        customers: customersChange,
      },
      trendData,
      categoryAnalysis: Array.from(categoryAnalysis.values()),
    });
  } catch (error) {
    console.error('Get analytics trends error:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics trends' });
  }
});

// Analytics Funnel - Funil de conversão detalhado (v2.0 - Módulo 7)
router.get('/analytics/funnel', async (req: AdminRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default: últimos 30 dias
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // 1. Visitantes (aproximação: usuários únicos que fizeram alguma ação)
    const uniqueUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
      },
    });
    const visitors = uniqueUsers.length;

    // 2. Visualizações de produto (aproximação: produtos únicos visualizados em pedidos)
    // Como não temos rastreamento direto de visualizações, vamos usar produtos únicos em pedidos iniciados
    const ordersWithItems = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const uniqueProductViews = new Set<number>();
    ordersWithItems.forEach(order => {
      order.items.forEach(item => {
        uniqueProductViews.add(item.productId);
      });
    });
    const productViews = uniqueProductViews.size;

    // 3. Adições ao carrinho (aproximação: itens únicos em pedidos)
    // Vamos contar produtos únicos que foram adicionados ao carrinho (via pedidos)
    const uniqueCartItems = new Set<string>(); // productId-size-color
    ordersWithItems.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`;
        uniqueCartItems.add(key);
      });
    });
    const addToCarts = uniqueCartItems.size;

    // 4. Início do checkout (aproximação: pedidos criados)
    const checkoutStarts = await prisma.order.count({
      where,
    });

    // 5. Compra concluída (pedidos com status completed ou delivered)
    const completedPurchases = await prisma.order.count({
      where: {
        ...where,
        status: {
          in: ['completed', 'delivered'],
        },
      },
    });

    // Calcular taxas de conversão
    const conversionRates = {
      visitorsToProductViews: visitors > 0 ? (productViews / visitors) * 100 : 0,
      productViewsToCart: productViews > 0 ? (addToCarts / productViews) * 100 : 0,
      cartToCheckout: addToCarts > 0 ? (checkoutStarts / addToCarts) * 100 : 0,
      checkoutToPurchase: checkoutStarts > 0 ? (completedPurchases / checkoutStarts) * 100 : 0,
      overallConversion: visitors > 0 ? (completedPurchases / visitors) * 100 : 0,
    };

    // Calcular perdas (drop-off) em cada etapa
    const dropOffs = {
      visitorsToProductViews: visitors - productViews,
      productViewsToCart: productViews - addToCarts,
      cartToCheckout: addToCarts - checkoutStarts,
      checkoutToPurchase: checkoutStarts - completedPurchases,
    };

    // Análise de abandono de carrinho
    const abandonedCarts = checkoutStarts - completedPurchases;
    const cartAbandonmentRate = checkoutStarts > 0 ? (abandonedCarts / checkoutStarts) * 100 : 0;

    // Detalhamento por status de pedido
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const statusBreakdown = ordersByStatus.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: checkoutStarts > 0 ? (item._count.id / checkoutStarts) * 100 : 0,
    }));

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      funnel: {
        visitors,
        productViews,
        addToCarts,
        checkoutStarts,
        completedPurchases,
      },
      conversionRates,
      dropOffs,
      cartAbandonment: {
        abandonedCarts,
        cartAbandonmentRate,
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error('Get analytics funnel error:', error);
    res.status(500).json({ error: 'Erro ao buscar funil de conversão' });
  }
});

// Analytics Behavior - Análise de comportamento do usuário (v2.0 - Módulo 7)
router.get('/analytics/behavior', async (req: AdminRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default: últimos 30 dias
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Buscar pedidos com detalhes
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        coupon: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 1. Tempo médio entre etapas (aproximação)
    // Calcular tempo médio entre criação do pedido e conclusão
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const timeToComplete = completedOrders.map(order => {
      const createdAt = new Date(order.createdAt);
      const updatedAt = new Date(order.updatedAt);
      return (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // horas
    });
    const averageTimeToComplete = timeToComplete.length > 0
      ? timeToComplete.reduce((sum, time) => sum + time, 0) / timeToComplete.length
      : 0;

    // 2. Padrão de compra por horário do dia
    const hourlyPattern = new Map<number, { count: number; revenue: number }>();
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const existing = hourlyPattern.get(hour) || { count: 0, revenue: 0 };
      hourlyPattern.set(hour, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(order.total),
      });
    });

    const hourlyBehavior = Array.from(hourlyPattern.entries())
      .map(([hour, data]) => ({
        hour,
        count: data.count,
        revenue: data.revenue,
        averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => a.hour - b.hour);

    // 3. Padrão de compra por dia da semana
    const dayOfWeekPattern = new Map<number, { count: number; revenue: number }>();
    orders.forEach(order => {
      const dayOfWeek = new Date(order.createdAt).getDay(); // 0 = domingo, 6 = sábado
      const existing = dayOfWeekPattern.get(dayOfWeek) || { count: 0, revenue: 0 };
      dayOfWeekPattern.set(dayOfWeek, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(order.total),
      });
    });

    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weeklyBehavior = Array.from(dayOfWeekPattern.entries())
      .map(([day, data]) => ({
        day,
        dayName: daysOfWeek[day],
        count: data.count,
        revenue: data.revenue,
        averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => a.day - b.day);

    // 4. Tamanho médio do carrinho
    const cartSizes = orders.map(order => order.items.length);
    const averageCartSize = cartSizes.length > 0
      ? cartSizes.reduce((sum, size) => sum + size, 0) / cartSizes.length
      : 0;

    // 5. Produtos mais visualizados (aproximação: produtos mais comprados)
    const productViewsCount = new Map<number, { productId: number; name: string; views: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productViewsCount.get(item.productId) || {
          productId: item.productId,
          name: item.product.name,
          views: 0,
        };
        productViewsCount.set(item.productId, {
          ...existing,
          views: existing.views + item.quantity,
        });
      });
    });

    const topViewedProducts = Array.from(productViewsCount.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 6. Taxa de retorno de clientes
    const customerOrders = new Map<number, number>();
    orders.forEach(order => {
      const count = customerOrders.get(order.userId) || 0;
      customerOrders.set(order.userId, count + 1);
    });

    const returningCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length;
    const repeatPurchaseRate = customerOrders.size > 0
      ? (returningCustomers / customerOrders.size) * 100
      : 0;

    // 7. Categorias mais populares
    const categoryPopularity = new Map<string, { category: string; orders: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const categoryName = item.product.category?.name || 'Sem categoria';
        const existing = categoryPopularity.get(categoryName) || {
          category: categoryName,
          orders: 0,
          revenue: 0,
        };
        categoryPopularity.set(categoryName, {
          ...existing,
          orders: existing.orders + 1,
          revenue: existing.revenue + Number(item.price) * item.quantity,
        });
      });
    });

    const topCategories = Array.from(categoryPopularity.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      behavior: {
        averageTimeToComplete,
        averageCartSize,
        repeatPurchaseRate,
        returningCustomers,
      },
      hourlyPattern: hourlyBehavior,
      weeklyPattern: weeklyBehavior,
      topViewedProducts,
      topCategories,
    });
  } catch (error) {
    console.error('Get analytics behavior error:', error);
    res.status(500).json({ error: 'Erro ao buscar análise de comportamento' });
  }
});

// Analytics Export - Exportação de dados (v2.0 - Módulo 7)
router.get('/analytics/export', async (req: AdminRequest, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    // Default: últimos 30 dias
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Buscar pedidos
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        coupon: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Preparar dados CSV
      const csvRows = [
        // Cabeçalho
        ['ID', 'Data', 'Cliente', 'Email', 'Total', 'Status', 'Produtos', 'Categoria', 'Cupom'].join(','),
      ];

      // Linhas de dados
      orders.forEach(order => {
        order.items.forEach(item => {
          csvRows.push([
            order.id.toString(),
            new Date(order.createdAt).toISOString(),
            `"${order.user.name}"`,
            `"${order.user.email}"`,
            order.total.toString(),
            order.status,
            `"${item.product.name}"`,
            `"${item.product.category?.name || 'Sem categoria'}"`,
            order.coupon?.code || '',
          ].join(','));
        });
      });

      const csv = csvRows.join('\n');
      const filename = `analytics-export-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\ufeff' + csv); // BOM para UTF-8 (Excel)
    } else {
      // JSON format
      res.json({
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        orders: orders.map(order => ({
          id: order.id,
          date: order.createdAt,
          customer: {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          },
          total: order.total,
          status: order.status,
          items: order.items.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            category: item.product.category?.name || 'Sem categoria',
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
          })),
          coupon: order.coupon ? {
            code: order.coupon.code,
            discount: order.discountAmount,
          } : null,
        })),
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// ============================================
// ADMIN - ROTAS DE PAGAMENTOS (v2.0)
// ============================================

// GET /api/admin/payments - Listar todos os pagamentos (admin)
router.get('/payments', async (req: AuthRequest, res) => {
  try {
    const { status, gateway, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (gateway) {
      where.gateway = gateway;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.payment.count({ where })
    ]);

    // Converter Decimal para number
    const formattedPayments = payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      fees: payment.fees ? Number(payment.fees) : null,
      netAmount: payment.netAmount ? Number(payment.netAmount) : null
    }));

    res.json({
      payments: formattedPayments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

// GET /api/admin/payments/:id - Detalhes de um pagamento (admin)
router.get('/payments/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Converter Decimal para number
    const formattedPayment = {
      ...payment,
      amount: Number(payment.amount),
      fees: payment.fees ? Number(payment.fees) : null,
      netAmount: payment.netAmount ? Number(payment.netAmount) : null
    };

    res.json(formattedPayment);
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamento' });
  }
});

// GET /api/admin/payments/stats - Estatísticas de pagamentos (admin)
router.get('/payments/stats', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [
      totalPayments,
      approvedPayments,
      pendingPayments,
      rejectedPayments,
      totalAmount,
      approvedAmount,
      paymentsByGateway,
      paymentsByMethod
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: 'approved' } }),
      prisma.payment.count({ where: { ...where, status: 'pending' } }),
      prisma.payment.count({ where: { ...where, status: 'rejected' } }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'approved' },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['gateway'],
        where,
        _count: true
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true
      })
    ]);

    res.json({
      total: totalPayments,
      byStatus: {
        approved: approvedPayments,
        pending: pendingPayments,
        rejected: rejectedPayments
      },
      totalAmount: Number(totalAmount._sum.amount || 0),
      approvedAmount: Number(approvedAmount._sum.amount || 0),
      byGateway: paymentsByGateway.map(g => ({
        gateway: g.gateway,
        count: g._count
      })),
      byMethod: paymentsByMethod.map(m => ({
        method: m.paymentMethod,
        count: m._count
      }))
    });
  } catch (error: any) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de pagamentos' });
  }
});

// POST /api/admin/payments/:id/sync - Sincronizar pagamento com gateway (admin)
router.post('/payments/:id/sync', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Se for Asaas, buscar status atualizado
    if (payment.gateway === 'asaas' && payment.gatewayPaymentId) {
      const { AsaasService } = await import('../services/AsaasService');
      const asaasResult = await AsaasService.getPayment(payment.gatewayPaymentId);

      if (asaasResult.success && asaasResult.payment) {
        // Atualizar status usando PaymentService
        const { PaymentService } = await import('../services/PaymentService');
        const updateResult = await PaymentService.updatePaymentStatus(
          payment.id,
          asaasResult.payment.status,
          `Status sincronizado do Asaas: ${asaasResult.payment.statusDetail}`,
          { synced: true, syncedAt: new Date().toISOString() }
        );

        if (updateResult.success) {
          // Buscar pagamento atualizado
          const updatedPayment = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: {
              order: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          });

          res.json({
            ...updatedPayment,
            amount: Number(updatedPayment!.amount),
            fees: updatedPayment!.fees ? Number(updatedPayment!.fees) : null,
            netAmount: updatedPayment!.netAmount ? Number(updatedPayment!.netAmount) : null,
          });
        } else {
          return res.status(400).json({ error: updateResult.error });
        }
      } else {
        return res.status(400).json({ error: asaasResult.error || 'Erro ao sincronizar com Asaas' });
      }
    } else {
      return res.status(400).json({ error: 'Sincronização disponível apenas para pagamentos Asaas' });
    }
  } catch (error: any) {
    console.error('Error syncing payment:', error);
    res.status(500).json({ error: 'Erro ao sincronizar pagamento' });
  }
});

// PATCH /api/admin/payments/:id/refund - Reembolsar pagamento (admin)
router.patch('/payments/:id/refund', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const { PaymentService } = await import('../services/PaymentService');
    const result = await PaymentService.refundPayment(parseInt(id), amount);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.payment);
  } catch (error: any) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Erro ao processar reembolso' });
  }
});

// ============================================
// Rotas Admin - Sistema de Estoque (v2.0)
// ============================================

// POST /api/admin/stock/sync - Sincronizar produtos existentes com estoque
router.post('/stock/sync', async (req: AdminRequest, res) => {
  try {
    console.log('🔄 Iniciando sincronização de produtos para estoque...');

    // Buscar todos os produtos com estoque > 0
    const productsWithStock = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      include: {
        variants: true,
      },
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of productsWithStock) {
      // Verificar se já existe uma variação padrão (sem tamanho/cor)
      const defaultVariant = product.variants.find(
        (v) => v.size === null && v.color === null
      );

      if (defaultVariant) {
        // Se existe mas o estoque está diferente, atualizar
        if (defaultVariant.stock !== product.stock) {
          await prisma.productVariant.update({
            where: { id: defaultVariant.id },
            data: { stock: product.stock },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Criar variação padrão
        try {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              size: null,
              color: null,
              stock: product.stock,
              minStock: 5,
              price: null,
              isActive: true,
            },
          });
          created++;
        } catch (error: any) {
          console.error(`Erro ao criar variação para produto #${product.id}:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Sincronização concluída',
      stats: {
        total: productsWithStock.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (error: any) {
    console.error('Erro durante sincronização:', error);
    res.status(500).json({ 
      error: 'Erro ao sincronizar produtos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/admin/stock/variants - Listar todas as variações (com paginação)
router.get('/stock/variants', async (req: AuthRequest, res) => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = (page - 1) * limit;

    let result;
    if (productId) {
      const variants = await StockService.getVariantsByProduct(productId);
      result = {
        variants: variants.slice(offset, offset + limit),
        total: variants.length,
      };
    } else {
      // Buscar todas as variações com paginação
      const allVariants = await prisma.productVariant.findMany({
        take: limit,
        skip: offset,
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
      const totalVariants = await prisma.productVariant.count();
      result = {
        variants: allVariants,
        total: totalVariants,
      };
    }

    // Retornar array direto para compatibilidade com frontend
    res.json(Array.isArray(result.variants) ? result.variants : result.variants || []);
  } catch (error: any) {
    console.error('Error getting variants:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar variações' });
  }
});

// GET /api/admin/stock/variants/:id - Obter detalhes de uma variação
router.get('/stock/variants/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const variant = await StockService.getVariantById(id);
    
    if (!variant) {
      return res.status(404).json({ error: 'Variação não encontrada' });
    }
    
    res.json(variant);
  } catch (error: any) {
    console.error('Error getting variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar variação' });
  }
});

// POST /api/admin/stock/variants - Criar nova variação
router.post('/stock/variants', async (req: AuthRequest, res) => {
  try {
    const variant = await StockService.createVariant(req.body);
    res.status(201).json(variant);
  } catch (error: any) {
    console.error('Error creating variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar variação' });
  }
});

// PUT /api/admin/stock/variants/:id - Atualizar variação
router.put('/stock/variants/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const variant = await StockService.updateVariant(id, req.body);
    res.json(variant);
  } catch (error: any) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar variação' });
  }
});

// DELETE /api/admin/stock/variants/:id - Deletar variação
router.delete('/stock/variants/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await StockService.deleteVariant(id);
    res.json({ message: 'Variação deletada com sucesso' });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao deletar variação' });
  }
});

// POST /api/admin/stock/adjust - Ajuste manual de estoque
router.post('/stock/adjust', async (req: AuthRequest, res) => {
  try {
    const { variantId, quantity, reason, description } = req.body;
    
    if (!variantId || quantity === undefined) {
      return res.status(400).json({ error: 'variantId e quantity são obrigatórios' });
    }

    const user = (req as any).user;
    const result = await StockService.updateStock({
      variantId,
      quantity,
      type: 'adjustment',
      reason: reason || 'Ajuste manual',
      description: description || `Ajuste realizado por admin`,
      userId: user?.id,
    });

    res.json({ message: 'Estoque ajustado com sucesso', variant: result.variant, movement: result.movement });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: error.message || 'Erro ao ajustar estoque' });
  }
});

// GET /api/admin/stock/movements - Histórico de movimentações
router.get('/stock/movements', async (req: AuthRequest, res) => {
  try {
    const variantId = req.query.variantId ? parseInt(req.query.variantId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const movements = await StockService.getMovementHistory(variantId, limit, offset);
    res.json(movements);
  } catch (error: any) {
    console.error('Error getting movements:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar movimentações' });
  }
});

// GET /api/admin/stock/low-stock - Variações com estoque baixo
router.get('/stock/low-stock', async (req: AuthRequest, res) => {
  try {
    const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : undefined;
    const variants = await StockService.getLowStockVariants(minStock);
    res.json(variants);
  } catch (error: any) {
    console.error('Error getting low stock:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estoque baixo' });
  }
});

// GET /api/admin/stock/stats - Estatísticas de estoque
router.get('/stock/stats', async (req: AuthRequest, res) => {
  try {
    const stats = await StockService.getStockStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
  }
});

// ============================================
// ADMIN - ROTAS DE FRETE E RASTREAMENTO (v2.0)
// ============================================

// GET /api/admin/shipping/trackings - Listar todos os rastreamentos (admin)
router.get('/shipping/trackings', async (req: AuthRequest, res) => {
  try {
    const { status, carrier, limit, offset } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status;
    if (carrier) filters.carrier = carrier;
    
    const result = await ShippingService.listTrackings({
      status: filters.status,
      carrier: filters.carrier,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Error getting trackings:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar rastreamentos' });
  }
});

// GET /api/admin/shipping/trackings/:id - Detalhes de um rastreamento (admin)
router.get('/shipping/trackings/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Buscar tracking usando raw query (temporário até regenerar Prisma client)
    const trackingRaw = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT * FROM shipping_trackings WHERE id = ${parseInt(id)} LIMIT 1`
    );
    
    if (!trackingRaw || trackingRaw.length === 0) {
      return res.status(404).json({ error: 'Rastreamento não encontrado' });
    }
    
    const trackingData = trackingRaw[0];
    
    // Buscar order relacionado
    const orderId = trackingData.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Parse eventos JSON se existir
    const tracking = {
      ...trackingData,
      events: trackingData.events ? JSON.parse(trackingData.events) : null,
      order,
    };
    
    res.json({ tracking });
  } catch (error: any) {
    console.error('Error getting tracking:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar rastreamento' });
  }
});

// POST /api/admin/shipping/trackings - Criar rastreamento (admin)
router.post('/shipping/trackings', async (req: AuthRequest, res) => {
  try {
    const { orderId, carrier, trackingCode, address, city, state, zipCode } = req.body;
    
    if (!orderId || !carrier || !trackingCode || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        error: 'Campos obrigatórios: orderId, carrier, trackingCode, address, city, state, zipCode',
      });
    }
    
    const tracking = await ShippingService.createTracking({
      orderId,
      carrier,
      trackingCode,
      address,
      city,
      state,
      zipCode,
    });
    
    res.status(201).json({ tracking });
  } catch (error: any) {
    console.error('Error creating tracking:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar rastreamento' });
  }
});

// PATCH /api/admin/shipping/trackings/:id/status - Atualizar status de rastreamento (admin)
router.patch('/shipping/trackings/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, statusDetail, events } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const tracking = await ShippingService.updateTrackingStatus(
      parseInt(id),
      status,
      statusDetail,
      events
    );
    
    res.json({ tracking });
  } catch (error: any) {
    console.error('Error updating tracking status:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar status de rastreamento' });
  }
});

// POST /api/admin/shipping/trackings/:code/sync - Sincronizar rastreamento com API externa (admin)
router.post('/shipping/trackings/:code/sync', async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Código de rastreamento é obrigatório' });
    }
    
    const syncResult = await ShippingService.syncTrackingFromAPI(code);
    
    // Atualizar tracking se existir
    const tracking = await ShippingService.getTrackingByCode(code);
    if (tracking) {
      await ShippingService.updateTrackingStatus(
        tracking.id,
        syncResult.status,
        syncResult.statusDetail,
        syncResult.events
      );
    }
    
    res.json({ message: 'Rastreamento sincronizado', result: syncResult });
  } catch (error: any) {
    console.error('Error syncing tracking:', error);
    res.status(500).json({ error: error.message || 'Erro ao sincronizar rastreamento' });
  }
});

// GET /api/admin/shipping/stats - Estatísticas de entregas (admin)
router.get('/shipping/stats', async (req: AuthRequest, res) => {
  try {
    // Buscar estatísticas usando raw query (temporário até regenerar Prisma client)
    const statsRaw = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as inTransit,
        SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) as outForDelivery,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception
       FROM shipping_trackings`
    );

    const stats = statsRaw[0] || {
      total: 0,
      pending: 0,
      inTransit: 0,
      outForDelivery: 0,
      delivered: 0,
      exception: 0,
    };

    res.json({
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      inTransit: Number(stats.inTransit || 0),
      outForDelivery: Number(stats.outForDelivery || 0),
      delivered: Number(stats.delivered || 0),
      exception: Number(stats.exception || 0),
    });
  } catch (error: any) {
    console.error('Error getting shipping stats:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas de entregas' });
  }
});

// ============================================
// Rotas Admin - Sistema de Auditoria (v2.0 - Módulo 8)
// ============================================

// GET /api/admin/audit/logs - Listar logs de auditoria
router.get('/audit/logs', async (req: AdminRequest, res) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
    };

    if (userId) filters.userId = parseInt(userId as string);
    if (action) filters.action = action as string;
    if (resourceType) filters.resourceType = resourceType as string;
    if (resourceId) filters.resourceId = parseInt(resourceId as string);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await AuditService.getLogs(filters);

    res.json(result);
  } catch (error: any) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar logs de auditoria' });
  }
});

// GET /api/admin/audit/stats - Estatísticas de auditoria
router.get('/audit/stats', async (req: AdminRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AuditService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas de auditoria' });
  }
});

// ============================================
// ROTAS PARA GERENCIAR CARROSSEL (HERO SLIDES)
// ============================================

// GET /api/admin/hero-slides - Lista todos os slides
router.get('/hero-slides', async (req: AdminRequest, res) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(slides);
  } catch (error: any) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ error: 'Erro ao buscar slides do carrossel' });
  }
});

// POST /api/admin/hero-slides - Cria um novo slide
router.post('/hero-slides', async (req: AdminRequest, res) => {
  try {
    const { title, subtitle, description, price, originalPrice, buttonText, buttonLink, mediaUrl, mediaType, order, isActive } = req.body;

    if (!buttonText || !buttonLink) {
      return res.status(400).json({ error: 'Texto do botão e link são obrigatórios' });
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        price: price || null,
        originalPrice: originalPrice || null,
        buttonText,
        buttonLink,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'hero_slide_created',
      resourceType: 'hero_slide',
      resourceId: slide.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.status(201).json(slide);
  } catch (error: any) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ error: 'Erro ao criar slide do carrossel' });
  }
});

// PUT /api/admin/hero-slides/:id - Atualiza um slide
router.put('/hero-slides/:id', async (req: AdminRequest, res) => {
  try {
    const slideId = parseInt(req.params.id);
    const { title, subtitle, description, price, originalPrice, buttonText, buttonLink, mediaUrl, mediaType, order, isActive } = req.body;

    const slide = await prisma.heroSlide.update({
      where: { id: slideId },
      data: {
        title: title !== undefined ? (title || null) : undefined,
        subtitle: subtitle !== undefined ? (subtitle || null) : undefined,
        description: description !== undefined ? (description || null) : undefined,
        price: price !== undefined ? (price || null) : undefined,
        originalPrice: originalPrice !== undefined ? (originalPrice || null) : undefined,
        buttonText,
        buttonLink,
        mediaUrl: mediaUrl !== undefined ? (mediaUrl || null) : undefined,
        mediaType: mediaType !== undefined ? (mediaType || null) : undefined,
        order,
        isActive,
      },
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'hero_slide_updated',
      resourceType: 'hero_slide',
      resourceId: slide.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json(slide);
  } catch (error: any) {
    console.error('Error updating hero slide:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Slide não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar slide do carrossel' });
  }
});

// DELETE /api/admin/hero-slides/:id - Remove um slide
router.delete('/hero-slides/:id', async (req: AdminRequest, res) => {
  try {
    const slideId = parseInt(req.params.id);

    await prisma.heroSlide.delete({
      where: { id: slideId },
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'hero_slide_deleted',
      resourceType: 'hero_slide',
      resourceId: slideId,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json({ message: 'Slide removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting hero slide:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Slide não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover slide do carrossel' });
  }
});

// ============================================
// ROTAS PARA GERENCIAR CARDS DE BENEFÍCIOS
// ============================================

// GET /api/admin/benefit-cards - Lista todos os cards de benefícios
router.get('/benefit-cards', async (req: AdminRequest, res) => {
  try {
    const cards = await prisma.benefitCard.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(cards);
  } catch (error: any) {
    console.error('Error fetching benefit cards:', error);
    res.status(500).json({ error: 'Erro ao buscar cards de benefícios' });
  }
});

// POST /api/admin/benefit-cards - Cria um novo card
router.post('/benefit-cards', async (req: AdminRequest, res) => {
  try {
    const { iconName, imageUrl, mainText, subText, color, link, order, isActive } = req.body;

    // Validar que tem ícone OU imagem
    if ((!iconName && !imageUrl) || !mainText || !subText) {
      return res.status(400).json({ error: 'Ícone ou imagem, texto principal e texto secundário são obrigatórios' });
    }

    const card = await prisma.benefitCard.create({
      data: {
        iconName: iconName || null,
        imageUrl: imageUrl || null,
        mainText,
        subText,
        color: color || null,
        link: link || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'benefit_card_created',
      resourceType: 'benefit_card',
      resourceId: card.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.status(201).json(card);
  } catch (error: any) {
    console.error('Error creating benefit card:', error);
    res.status(500).json({ error: 'Erro ao criar card de benefício' });
  }
});

// PUT /api/admin/benefit-cards/:id - Atualiza um card
router.put('/benefit-cards/:id', async (req: AdminRequest, res) => {
  try {
    const cardId = parseInt(req.params.id);
    const { iconName, imageUrl, mainText, subText, color, link, order, isActive } = req.body;

    // Verificar se o card existe
    const existingCard = await prisma.benefitCard.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card não encontrado' });
    }

    // Validar que tem ícone OU imagem (se ambos estiverem sendo atualizados)
    const finalIconName = iconName !== undefined ? (iconName || null) : existingCard.iconName;
    const finalImageUrl = imageUrl !== undefined ? (imageUrl || null) : (existingCard as any).imageUrl || null;
    
    if (!finalIconName && !finalImageUrl) {
      return res.status(400).json({ error: 'Ícone ou imagem é obrigatório' });
    }

    const updateData: any = {};
    if (iconName !== undefined) updateData.iconName = iconName || null;
    if (mainText !== undefined) updateData.mainText = mainText;
    if (subText !== undefined) updateData.subText = subText;
    if (color !== undefined) updateData.color = color || null;
    if (link !== undefined) updateData.link = link || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Tentar adicionar imageUrl apenas se estiver presente na requisição
    // O Prisma vai ignorar se o campo não existir no schema
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    const card = await prisma.benefitCard.update({
      where: { id: cardId },
      data: updateData,
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'benefit_card_updated',
      resourceType: 'benefit_card',
      resourceId: card.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json(card);
  } catch (error: any) {
    console.error('Error updating benefit card:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Card não encontrado' });
    }
    
    // Erro específico para campo desconhecido ou schema desatualizado
    if (error.code === 'P2009' || error.message?.includes('Unknown field') || error.message?.includes('imageUrl')) {
      // Tentar atualizar sem o campo imageUrl (caso o campo ainda não exista no banco)
      try {
        const updateDataWithoutImage: any = {};
        if (iconName !== undefined) updateDataWithoutImage.iconName = iconName || null;
        if (mainText !== undefined) updateDataWithoutImage.mainText = mainText;
        if (subText !== undefined) updateDataWithoutImage.subText = subText;
        if (color !== undefined) updateDataWithoutImage.color = color || null;
        if (order !== undefined) updateDataWithoutImage.order = order;
        if (isActive !== undefined) updateDataWithoutImage.isActive = isActive;

        const card = await prisma.benefitCard.update({
          where: { id: cardId },
          data: updateDataWithoutImage,
        });

        console.warn('Card atualizado sem imageUrl (campo pode não existir no banco ainda)');
        return res.json(card);
      } catch (retryError: any) {
        console.error('Error on retry without imageUrl:', retryError);
      }
    }
    
    // Log completo do erro para debug
    const errorMessage = error.message || 'Erro desconhecido';
    const errorCode = error.code || 'UNKNOWN';
    
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      error: 'Erro ao atualizar card de benefício',
      details: process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        code: errorCode,
        hint: errorCode === 'P2009' || errorMessage?.includes('imageUrl') 
          ? 'O campo imageUrl pode não existir no banco de dados. Execute: ALTER TABLE benefit_cards ADD COLUMN imageUrl TEXT NULL;'
          : undefined
      } : undefined
    });
  }
});

// DELETE /api/admin/benefit-cards/:id - Remove um card
router.delete('/benefit-cards/:id', async (req: AdminRequest, res) => {
  try {
    const cardId = parseInt(req.params.id);

    await prisma.benefitCard.delete({
      where: { id: cardId },
    });

    // Audit logging assíncrono (não bloqueia a resposta)
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'benefit_card_deleted',
      resourceType: 'benefit_card',
      resourceId: cardId,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json({ message: 'Card removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting benefit card:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Card não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover card de benefício' });
  }
});

// ============================================
// ROTAS DE MENUS (NAVBAR)
// ============================================

// GET /api/admin/menus - Lista todos os menus
router.get('/menus', async (req: AdminRequest, res) => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        items: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json(menus);
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: 'Erro ao buscar menus' });
  }
});

// POST /api/admin/menus - Cria um novo menu
router.post('/menus', async (req: AdminRequest, res) => {
  try {
    const { label, href, order, isActive } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Label é obrigatório' });
    }

    const menu = await prisma.menu.create({
      data: {
        label,
        href: href || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        items: true,
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'menu_created',
      resourceType: 'menu',
      resourceId: menu.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.status(201).json(menu);
  } catch (error: any) {
    console.error('Error creating menu:', error);
    res.status(500).json({ error: 'Erro ao criar menu' });
  }
});

// PUT /api/admin/menus/:id - Atualiza um menu
router.put('/menus/:id', async (req: AdminRequest, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const { label, href, order, isActive } = req.body;

    const menu = await prisma.menu.update({
      where: { id: menuId },
      data: {
        label,
        href: href !== undefined ? (href || null) : undefined,
        order: order !== undefined ? order : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'menu_updated',
      resourceType: 'menu',
      resourceId: menu.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json(menu);
  } catch (error: any) {
    console.error('Error updating menu:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar menu' });
  }
});

// DELETE /api/admin/menus/:id - Remove um menu
router.delete('/menus/:id', async (req: AdminRequest, res) => {
  try {
    const menuId = parseInt(req.params.id);

    // Audit logging antes de deletar
    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (menu) {
      AuditService.log({
        userId: req.adminUser?.id,
        userEmail: req.adminUser?.email,
        action: 'menu_deleted',
        resourceType: 'menu',
        resourceId: menu.id,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      }).catch((auditError) => {
        console.warn('Failed to log audit (continuing):', auditError);
      });
    }

    await prisma.menu.delete({
      where: { id: menuId },
    });

    res.json({ message: 'Menu removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover menu' });
  }
});

// POST /api/admin/menus/:id/items - Adiciona um item ao submenu
router.post('/menus/:id/items', async (req: AdminRequest, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const { label, href, order, isActive } = req.body;

    if (!label || !href) {
      return res.status(400).json({ error: 'Label e href são obrigatórios' });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        menuId,
        label,
        href,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'menu_item_created',
      resourceType: 'menu_item',
      resourceId: menuItem.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.status(201).json(menuItem);
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Erro ao criar item do menu' });
  }
});

// PUT /api/admin/menu-items/:id - Atualiza um item do submenu
router.put('/menu-items/:id', async (req: AdminRequest, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { label, href, order, isActive } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        label,
        href,
        order: order !== undefined ? order : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'menu_item_updated',
      resourceType: 'menu_item',
      resourceId: menuItem.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json(menuItem);
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item do menu não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar item do menu' });
  }
});

// DELETE /api/admin/menu-items/:id - Remove um item do submenu
router.delete('/menu-items/:id', async (req: AdminRequest, res) => {
  try {
    const itemId = parseInt(req.params.id);

    // Audit logging antes de deletar
    const menuItem = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (menuItem) {
      AuditService.log({
        userId: req.adminUser?.id,
        userEmail: req.adminUser?.email,
        action: 'menu_item_deleted',
        resourceType: 'menu_item',
        resourceId: menuItem.id,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      }).catch((auditError) => {
        console.warn('Failed to log audit (continuing):', auditError);
      });
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item do menu removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item do menu não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover item do menu' });
  }
});

// ============================================
// ROTAS PARA GERENCIAR AVISOS/PROMOÇÕES
// ============================================

// GET /api/admin/announcements - Lista todos os avisos
router.get('/announcements', async (req: AdminRequest, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    res.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Erro ao buscar avisos' });
  }
});

// GET /api/admin/announcements/:id - Detalhes de um aviso
router.get('/announcements/:id', async (req: AdminRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }
    
    res.json(announcement);
  } catch (error: any) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Erro ao buscar aviso' });
  }
});

// POST /api/admin/announcements - Cria um novo aviso
router.post('/announcements', async (req: AdminRequest, res) => {
  try {
    const { title, description, imageUrl, link, type, isActive, order, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        link: link || null,
        type: type || 'info',
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'announcement_created',
      resourceType: 'announcement',
      resourceId: announcement.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.status(201).json(announcement);
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Erro ao criar aviso' });
  }
});

// PUT /api/admin/announcements/:id - Atualiza um aviso
router.put('/announcements/:id', async (req: AdminRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, imageUrl, link, type, isActive, order, startDate, endDate } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        description: description !== undefined ? (description || null) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
        link: link !== undefined ? (link || null) : undefined,
        type,
        isActive,
        order,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      },
    });

    // Audit logging
    AuditService.log({
      userId: req.adminUser?.id,
      userEmail: req.adminUser?.email,
      action: 'announcement_updated',
      resourceType: 'announcement',
      resourceId: announcement.id,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    }).catch((auditError) => {
      console.warn('Failed to log audit (continuing):', auditError);
    });

    res.json(announcement);
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar aviso' });
  }
});

// DELETE /api/admin/announcements/:id - Remove um aviso
router.delete('/announcements/:id', async (req: AdminRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    // Audit logging antes de deletar
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (announcement) {
      AuditService.log({
        userId: req.adminUser?.id,
        userEmail: req.adminUser?.email,
        action: 'announcement_deleted',
        resourceType: 'announcement',
        resourceId: announcement.id,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      }).catch((auditError) => {
        console.warn('Failed to log audit (continuing):', auditError);
      });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    res.json({ message: 'Aviso removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover aviso' });
  }
});

export default router;

