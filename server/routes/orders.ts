import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkoutRateLimiter } from '../middleware/rateLimit';
import { NotificationService } from '../services/NotificationService';
import { EmailService } from '../services/EmailService';
import { StockService } from '../services/StockService';
import { AuditService } from '../services/AuditService';
import { optionalRecaptcha } from '../middleware/recaptcha';

const router = express.Router();
const prisma = new PrismaClient();

// Create order - com rate limiting
router.post('/', authenticate, checkoutRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, shippingAddressId, shippingCost, shippingMethod, paymentMethod, couponCode } = req.body;
    const userId = req.userId!;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
    }

    // Calculate total - otimizado: busca todos os produtos de uma vez
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validação: verificar se todos os produtos existem
    const productsMap = new Map(products.map((p) => [p.id, p]));
    const missingProducts = items.filter((item) => !productsMap.has(item.productId));
    
    if (missingProducts.length > 0) {
      return res.status(404).json({
        error: `Produtos não encontrados: ${missingProducts.map((i) => i.productId).join(', ')}`,
      });
    }

    // Validação de estoque e cálculo do subtotal (v2.0 - usando variações)
    let subtotal = 0;
    const orderItems = [];
    const variantReservations: Array<{ variantId: number; quantity: number }> = [];
    const fallbackStockUpdates: Array<{ id: number; stock: number }> = [];

    for (const item of items) {
      const product = productsMap.get(item.productId)!;
      const productPrice = Number(product.price);
      
      // Tentar encontrar variação para este produto/tamanho/cor (v2.0)
      let variant = null;
      try {
        variant = await StockService.getVariantByProductSizeColor(
          product.id,
          item.size || undefined,
          item.color || undefined
        );
      } catch (error) {
        console.error('Error finding variant:', error);
      }

      if (variant) {
        // Usar sistema de variações (v2.0)
        const availableStock = variant.stock - variant.reservedStock;
        
        if (availableStock < item.quantity) {
          return res.status(400).json({ 
            error: `Estoque insuficiente para ${product.name} (${item.size || 'N/A'}, ${item.color || 'N/A'}). Disponível: ${availableStock}, Solicitado: ${item.quantity}` 
          });
        }

        variantReservations.push({
          variantId: variant.id,
          quantity: item.quantity,
        });
      } else {
        // Fallback: usar sistema antigo (sem variações)
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Estoque insuficiente para ${product.name}` });
        }

        fallbackStockUpdates.push({
          id: product.id,
          stock: product.stock - item.quantity,
        });
      }

      subtotal += productPrice * item.quantity;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: productPrice,
      });
    }

    // Validate and apply coupon if provided
    let couponId: number | null = null;
    let discountAmount = 0;
    let total = subtotal;

    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      
      // Find coupon
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (!coupon) {
        return res.status(400).json({ error: 'Cupom não encontrado' });
      }

      // Validate coupon
      const now = new Date();

      if (!coupon.isActive) {
        return res.status(400).json({ error: 'Cupom não está ativo' });
      }

      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({ error: 'Cupom fora do período de validade' });
      }

      if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        return res.status(400).json({ error: 'Cupom atingiu o limite de usos' });
      }

      if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
        return res.status(400).json({ 
          error: `Valor mínimo de compra para este cupom: R$ ${Number(coupon.minPurchase).toFixed(2)}` 
        });
      }

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
        
        // Apply max discount if specified
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      // Ensure discount doesn't exceed subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      // Round to 2 decimal places
      discountAmount = Math.round(discountAmount * 100) / 100;
      total = subtotal - discountAmount;
      couponId = coupon.id;
    }

    // Criar pedido primeiro (sem confirmar estoque ainda)
    // Nota: A reserva de estoque será feita após criar o pedido para garantir que temos o orderId
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        shippingAddress: shippingAddress || '',
        paymentMethod: paymentMethod || 'credit_card',
        status: 'pending',
        couponId: couponId || null,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        coupon: true,
      },
    });

    // Reservar estoque usando variações (v2.0)
    // IMPORTANTE: Fazer após criar o pedido para ter o orderId
    try {
      for (const reservation of variantReservations) {
        await StockService.reserveStock(
          reservation.variantId,
          reservation.quantity,
          order.id,
          15 // Timeout de 15 minutos
        );
      }
    } catch (error: any) {
      // Se falhar a reserva, deletar o pedido criado
      await prisma.order.delete({ where: { id: order.id } });
      console.error('Error reserving stock:', error);
      return res.status(400).json({ 
        error: error.message || 'Erro ao reservar estoque. Tente novamente.' 
      });
    }

    // Atualizar estoque usando sistema antigo (fallback para produtos sem variações)
    if (fallbackStockUpdates.length > 0) {
      await Promise.all(
        fallbackStockUpdates.map((update) =>
          prisma.product.update({
            where: { id: update.id },
            data: { stock: update.stock },
          })
        )
      );
    }

    // Update coupon usage if coupon was used
    if (couponId) {
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });

      // Notify admins about coupon usage
      try {
        await NotificationService.notifyCouponUsed(
          couponId,
          coupon.code,
          order.id,
          discountAmount
        );
      } catch (error) {
        console.error('Error sending coupon notification:', error);
        // Don't fail the order creation if notification fails
      }
    }

    // Get user info for notification and email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Notify admins about new order
    try {
      await NotificationService.notifyNewOrder(
        order.id,
        total,
        user?.name || 'Cliente'
      );
    } catch (error) {
      console.error('Error sending order notification:', error);
      // Don't fail the order creation if notification fails
    }

    // Send order confirmation email to customer
    if (user?.email) {
      try {
        await EmailService.sendOrderConfirmation(
          user.email,
          user.name,
          order.id,
          total
        );
      } catch (error) {
        console.error('Error sending order confirmation email:', error);
        // Don't fail the order creation if email fails
      }
    }

    // Convert Decimal to number
    const formattedOrder = {
      ...order,
      total: Number(order.total),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      coupon: order.coupon ? {
        ...order.coupon,
        discountValue: Number(order.coupon.discountValue),
        minPurchase: order.coupon.minPurchase ? Number(order.coupon.minPurchase) : undefined,
        maxDiscount: order.coupon.maxDiscount ? Number(order.coupon.maxDiscount) : undefined,
      } : undefined,
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

    // Registrar criação de pedido na auditoria
    await AuditService.log({
      userId: userId,
      userEmail: user?.email,
      action: 'order_created',
      resourceType: 'order',
      resourceId: order.id,
      details: {
        total: Number(order.total),
        itemsCount: orderItems.length,
        paymentMethod: order.paymentMethod,
        couponUsed: !!couponId,
      },
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json(formattedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Get user orders
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
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

    // Convert Decimal to number
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      coupon: order.coupon ? {
        ...order.coupon,
        discountValue: Number(order.coupon.discountValue),
        minPurchase: order.coupon.minPurchase ? Number(order.coupon.minPurchase) : undefined,
        maxDiscount: order.coupon.maxDiscount ? Number(order.coupon.maxDiscount) : undefined,
      } : undefined,
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

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const orderId = parseInt(req.params.id);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        coupon: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Convert Decimal to number
    const formattedOrder = {
      ...order,
      total: Number(order.total),
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      coupon: order.coupon ? {
        ...order.coupon,
        discountValue: Number(order.coupon.discountValue),
        minPurchase: order.coupon.minPurchase ? Number(order.coupon.minPurchase) : undefined,
        maxDiscount: order.coupon.maxDiscount ? Number(order.coupon.maxDiscount) : undefined,
      } : undefined,
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

    res.json(formattedOrder);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

export default router;

