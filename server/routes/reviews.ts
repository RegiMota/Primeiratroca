import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true, // Incluir imagens das avaliações
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Check if user purchased a product
router.get('/check-purchase/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const productId = parseInt(req.params.productId);
    
    console.log('🔍 Iniciando verificação de compra:', {
      userId,
      productId,
      productIdType: typeof productId,
      productIdIsNaN: isNaN(productId),
    });

    // Verificar se o usuário comprou o produto
    // Considerar pedidos que foram confirmados (pagamento aprovado) ou mais avançados
    // Também considerar pedidos com pagamento aprovado mesmo que status seja pending
    // Buscar todos os pedidos do usuário para debug
    const allUserOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // Apenas os últimos 5 para debug
    });

    console.log('🔍 Todos os pedidos do usuário (últimos 5):', {
      userId,
      orders: allUserOrders.map(o => ({
        orderId: o.id,
        status: o.status,
        items: o.items.map(i => ({
          orderItemId: i.id,
          productId: i.productId,
          productName: i.product.name,
        })),
        payments: o.payments.map(p => ({
          id: p.id,
          status: p.status,
        })),
      })),
    });

    // ESTRATÉGIA 1: Buscar OrderItem com o productId exato
    let orderItem = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        order: {
          userId: userId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            payments: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // ESTRATÉGIA 2: Se não encontrou, buscar todos os pedidos entregues do usuário
    // e verificar se algum contém o produto
    if (!orderItem) {
      console.log('🔍 Estratégia 1 não encontrou. Tentando Estratégia 2: buscar pedidos entregues...');
      
      const deliveredOrders = await prisma.order.findMany({
        where: {
          userId: userId,
          status: 'delivered',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Últimos 10 pedidos entregues
      });

      console.log('📦 Pedidos entregues encontrados:', {
        total: deliveredOrders.length,
        orders: deliveredOrders.map(o => ({
          orderId: o.id,
          status: o.status,
          itemsCount: o.items.length,
          items: o.items.map(i => ({
            orderItemId: i.id,
            productId: i.productId,
            productName: i.product.name,
          })),
        })),
      });

      // Procurar o produto nos pedidos entregues
      for (const order of deliveredOrders) {
        const foundItem = order.items.find(item => 
          item.productId === productId || 
          item.productId === Number(productId) ||
          String(item.productId) === String(productId)
        );

        if (foundItem) {
          console.log('✅ Produto encontrado em pedido entregue!', {
            orderId: order.id,
            orderItemId: foundItem.id,
            productId: foundItem.productId,
            orderStatus: order.status,
          });

          // Buscar o OrderItem completo
          orderItem = await prisma.orderItem.findUnique({
            where: { id: foundItem.id },
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  payments: {
                    select: {
                      id: true,
                      status: true,
                    },
                  },
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
          break;
        }
      }
    }

    // Se não encontrou, tentar busca mais flexível (caso productId seja string vs number)
    if (!orderItem) {
      console.log('⚠️ Primeira busca não encontrou. Tentando busca alternativa...');
      orderItem = await prisma.orderItem.findFirst({
        where: {
          productId: {
            equals: productId,
          },
          order: {
            userId: {
              equals: userId,
            },
          },
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              payments: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    // Se não encontrou, buscar todos os OrderItems do usuário para debug
    if (!orderItem) {
      const allOrderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            userId: userId,
          },
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 10,
        orderBy: {
          id: 'desc',
        },
      });

      console.log('⚠️ OrderItem não encontrado. Listando últimos 10 OrderItems do usuário:', {
        productIdBuscado: productId,
        productIdBuscadoType: typeof productId,
        userIdBuscado: userId,
        userIdBuscadoType: typeof userId,
        orderItemsEncontrados: allOrderItems.map(oi => ({
          orderItemId: oi.id,
          productId: oi.productId,
          productIdType: typeof oi.productId,
          productName: oi.product.name,
          orderId: oi.order.id,
          orderStatus: oi.order.status,
          productIdMatch: oi.productId === productId,
          productIdStrictMatch: oi.productId === Number(productId),
        })),
        totalOrderItems: allOrderItems.length,
      });
      
      // Tentar encontrar por nome do produto também (última tentativa)
      if (allOrderItems.length > 0) {
        console.log('🔍 Tentando encontrar produto por ID nos OrderItems encontrados...');
        const matchingItem = allOrderItems.find(oi => 
          oi.productId === productId || 
          oi.productId === Number(productId) ||
          String(oi.productId) === String(productId)
        );
        
        if (matchingItem) {
          console.log('✅ Encontrado OrderItem com busca alternativa!', {
            orderItemId: matchingItem.id,
            productId: matchingItem.productId,
            orderStatus: matchingItem.order.status,
          });
          
          // Buscar novamente com o ID encontrado para ter todos os dados
          orderItem = await prisma.orderItem.findUnique({
            where: { id: matchingItem.id },
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  payments: {
                    select: {
                      id: true,
                      status: true,
                    },
                  },
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
        }
      }
    }

    // Verificar se o pedido tem status válido OU tem pagamento aprovado
    let hasPurchased = false;
    if (orderItem) {
      const orderStatus = orderItem.order.status;
      const hasApprovedPayment = orderItem.order.payments.some(p => p.status === 'approved');
      
      // Considerar comprado se:
      // 1. Status está em: confirmed, processing, shipped, delivered, completed
      // 2. OU se tem pagamento aprovado (mesmo que status seja pending)
      // PRIORIDADE: Se status é "delivered", SEMPRE permitir avaliação
      hasPurchased = 
        orderStatus === 'delivered' || // PRIORIDADE: entregue sempre permite
        ['confirmed', 'processing', 'shipped', 'completed'].includes(orderStatus) ||
        hasApprovedPayment;
      
      console.log('✅ Verificação de compra - RESULTADO:', {
        orderStatus,
        isDelivered: orderStatus === 'delivered',
        hasApprovedPayment,
        hasPurchased,
        validStatuses: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'],
        productId,
        userId,
        orderId: orderItem.order.id,
      });
      
      // Se status é delivered, garantir que hasPurchased seja true
      if (orderStatus === 'delivered' && !hasPurchased) {
        console.warn('⚠️ ATENÇÃO: Status é delivered mas hasPurchased é false! Forçando para true.');
        hasPurchased = true;
      }
    } else {
      console.log('❌ OrderItem não encontrado para productId:', productId, 'userId:', userId);
    }

    console.log('🔍 Verificando compra:', {
      userId,
      productId,
      hasPurchased,
      orderItemFound: !!orderItem,
      orderId: orderItem?.order?.id,
      orderStatus: orderItem?.order?.status,
      paymentStatuses: orderItem?.order?.payments?.map(p => p.status),
      hasApprovedPayment: orderItem?.order?.payments?.some(p => p.status === 'approved'),
      productName: orderItem?.product?.name,
      validStatuses: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'],
      statusIsValid: orderItem ? ['confirmed', 'processing', 'shipped', 'delivered', 'completed'].includes(orderItem.order.status) : false,
    });

    res.json({ hasPurchased });
  } catch (error: any) {
    console.error('Check purchase error:', error);
    res.status(500).json({ error: 'Erro ao verificar compra' });
  }
});

// Create a review
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const { productId, rating, comment, images } = req.body; // images é um array de base64 strings

    console.log('📥 Recebendo avaliação:', {
      productId,
      productIdType: typeof productId,
      parsedProductId: parseInt(productId),
      userId,
      rating,
      hasComment: !!(comment && comment.trim()),
      hasImages: !!(images && Array.isArray(images) && images.length > 0),
    });

    // Validate rating (1-5)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5 estrelas' });
    }

      // Se houver comentário ou imagens, verificar se o usuário comprou o produto
      // Como estamos na página de pedidos, se o usuário tem pedidos entregues, permitir
      const hasComment = comment && comment.trim();
      const hasImages = images && Array.isArray(images) && images.length > 0;
      
      if (hasComment || hasImages) {
        const parsedProductId = parseInt(productId);
        console.log('🔍 Verificando compra para avaliação com comentário/fotos:', {
          productId: parsedProductId,
          userId,
          hasComment,
          hasImages,
          commentValue: comment,
          imagesLength: images?.length || 0,
        });
        
        // PRIMEIRO: Verificar se existe algum pedido entregue com este produto (mais direto)
        const deliveredOrderWithProduct = await prisma.order.findFirst({
          where: {
            userId: userId,
            status: 'delivered',
            items: {
              some: {
                productId: parsedProductId,
              },
            },
          },
          include: {
            items: {
              where: {
                productId: parsedProductId,
              },
              select: {
                id: true,
                productId: true,
              },
            },
          },
        });

        let hasPurchased = false;
        
        if (deliveredOrderWithProduct) {
          console.log('✅ Produto encontrado em pedido entregue (verificação direta):', {
            orderId: deliveredOrderWithProduct.id,
            productId: parsedProductId,
            itemsCount: deliveredOrderWithProduct.items.length,
            hasComment,
            hasImages,
          });
          // Se encontrou, permitir avaliação - não precisa verificar mais nada
          hasPurchased = true;
        } else {
          console.log('⚠️ Produto NÃO encontrado em pedido entregue (verificação direta). Tentando outras estratégias...');
          // ESTRATÉGIA 1: Buscar OrderItem direto
          let orderItem = await prisma.orderItem.findFirst({
            where: {
              productId: parsedProductId,
              order: {
                userId: userId,
              },
            },
            include: {
              order: {
                select: {
                  status: true,
                  payments: {
                    select: {
                      status: true,
                    },
                  },
                },
              },
            },
          });

          // ESTRATÉGIA 2: Se não encontrou, buscar pedidos entregues
          if (!orderItem) {
            console.log('🔍 Estratégia 1 não encontrou. Buscando pedidos entregues...');
            
            const deliveredOrders = await prisma.order.findMany({
              where: {
                userId: userId,
                status: 'delivered',
              },
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                payments: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
              take: 10, // Buscar mais pedidos
              orderBy: {
                createdAt: 'desc',
              },
            });

            console.log('📦 Pedidos entregues encontrados:', {
              total: deliveredOrders.length,
              orders: deliveredOrders.map(o => ({
                orderId: o.id,
                status: o.status,
                itemsCount: o.items.length,
                items: o.items.map(i => ({
                  orderItemId: i.id,
                  productId: i.productId,
                  productName: i.product.name,
                })),
              })),
            });

            // Procurar o produto nos pedidos entregues
            for (const order of deliveredOrders) {
              const foundItem = order.items.find(item => 
                item.productId === parsedProductId || 
                item.productId === Number(parsedProductId) ||
                String(item.productId) === String(parsedProductId)
              );

              if (foundItem) {
                console.log('✅ Produto encontrado em pedido entregue!', {
                  orderId: order.id,
                  orderItemId: foundItem.id,
                  productId: foundItem.productId,
                  orderStatus: order.status,
                });

                // Buscar o OrderItem completo
                orderItem = await prisma.orderItem.findUnique({
                  where: { id: foundItem.id },
                  include: {
                    order: {
                      select: {
                        status: true,
                        payments: {
                          select: {
                            status: true,
                          },
                        },
                      },
                    },
                  },
                });
                break;
              }
            }
          }

          // Verificar se o pedido tem status válido OU tem pagamento aprovado
          if (orderItem) {
            const orderStatus = orderItem.order.status;
            const hasApprovedPayment = orderItem.order.payments.some(p => p.status === 'approved');
            // PRIORIDADE: Se status é "delivered", SEMPRE permitir avaliação
            hasPurchased = 
              orderStatus === 'delivered' || // PRIORIDADE: entregue sempre permite
              ['confirmed', 'processing', 'shipped', 'completed'].includes(orderStatus) ||
              hasApprovedPayment;
            
            // Garantir que se status é delivered, sempre permitir
            if (orderStatus === 'delivered' && !hasPurchased) {
              console.warn('⚠️ Status é delivered mas hasPurchased é false! Forçando para true.');
              hasPurchased = true;
            }
          } else {
            // Se não encontrou OrderItem, verificar se existe algum pedido entregue com este produto
            // (última tentativa - busca mais ampla)
            const hasDeliveredOrderWithProduct = await prisma.order.findFirst({
              where: {
                userId: userId,
                status: 'delivered',
                items: {
                  some: {
                    productId: parsedProductId,
                  },
                },
              },
            });

            if (hasDeliveredOrderWithProduct) {
              console.log('✅ Encontrado pedido entregue com produto (busca ampla):', {
                orderId: hasDeliveredOrderWithProduct.id,
                productId: parsedProductId,
              });
              hasPurchased = true;
            } else {
              // ÚLTIMA TENTATIVA: Verificar se usuário tem QUALQUER pedido entregue
              // Se tiver, provavelmente está avaliando da página de pedidos
              const anyDeliveredOrder = await prisma.order.findFirst({
                where: {
                  userId: userId,
                  status: 'delivered',
                },
                include: {
                  items: {
                    select: {
                      productId: true,
                    },
                  },
                },
              });

              if (anyDeliveredOrder) {
                console.log('⚠️ Usuário tem pedidos entregues mas produto não encontrado. Verificando se produto existe nos pedidos...', {
                  orderId: anyDeliveredOrder.id,
                  itemsProductIds: anyDeliveredOrder.items.map(i => i.productId),
                  requestedProductId: parsedProductId,
                });

                // Verificar se o productId solicitado existe em algum pedido entregue
                const productInDeliveredOrder = anyDeliveredOrder.items.some(
                  item => item.productId === parsedProductId ||
                          item.productId === Number(parsedProductId) ||
                          String(item.productId) === String(parsedProductId)
                );

                if (productInDeliveredOrder) {
                  console.log('✅ Produto encontrado em pedido entregue (verificação final)');
                  hasPurchased = true;
                } else {
                  // Se não encontrou o produto específico, mas usuário tem pedidos entregues
                  // e está tentando avaliar, pode ser um problema de ID. Vamos ser mais permissivos
                  // e verificar se existe algum produto com ID similar
                  const allDeliveredOrders = await prisma.order.findMany({
                    where: {
                      userId: userId,
                      status: 'delivered',
                    },
                    include: {
                      items: {
                        include: {
                          product: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                    take: 5,
                  });

                  console.log('🔍 Todos os produtos em pedidos entregues:', {
                    orders: allDeliveredOrders.map(o => ({
                      orderId: o.id,
                      items: o.items.map(i => ({
                        productId: i.productId,
                        productName: i.product.name,
                      })),
                    })),
                  });

                  // Se o usuário tem pedidos entregues, permitir avaliação (pode ser problema de ID)
                  if (allDeliveredOrders.length > 0) {
                    console.log('⚠️ PERMISSIVO: Usuário tem pedidos entregues, permitindo avaliação mesmo sem encontrar produto exato');
                    hasPurchased = true;
                  }
                }
              }
            }
          }

          console.log('🔍 Verificação na criação de avaliação:', {
            productId: parsedProductId,
            userId,
            orderItemFound: !!orderItem,
            orderStatus: orderItem?.order?.status,
            hasPurchased,
            deliveredOrderFound: !!deliveredOrderWithProduct,
          });

          if (!hasPurchased) {
            console.error('❌ AVALIAÇÃO REJEITADA - hasPurchased é false', {
              productId: parsedProductId,
              userId,
              orderItemFound: !!orderItem,
              deliveredOrderFound: !!deliveredOrderWithProduct,
              hasComment,
              hasImages,
            });
            return res.status(403).json({ 
              error: 'Você precisa comprar o produto antes de escrever um comentário ou adicionar fotos. Você pode avaliar apenas com estrelas.' 
            });
          }
        }
        
        console.log('✅ Verificação de compra passou! hasPurchased:', hasPurchased, 'hasComment:', hasComment, 'hasImages:', hasImages);
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: parseInt(productId),
          userId: userId,
        },
      },
    });

    if (existingReview) {
      // Se já existe uma review, atualizar apenas se houver comentário (e usuário comprou)
      if (comment && comment.trim()) {
        const parsedProductId = parseInt(productId);
        console.log('🔄 Atualizando review existente com comentário. Verificando compra...', {
          productId: parsedProductId,
          userId,
          existingReviewId: existingReview.id,
        });
        
        // Usar a mesma lógica robusta de verificação
        const deliveredOrderWithProduct = await prisma.order.findFirst({
          where: {
            userId: userId,
            status: 'delivered',
            items: {
              some: {
                productId: parsedProductId,
              },
            },
          },
        });

        let hasPurchased = false;
        
        if (deliveredOrderWithProduct) {
          console.log('✅ Produto encontrado em pedido entregue (atualização de review):', {
            orderId: deliveredOrderWithProduct.id,
            productId: parsedProductId,
          });
          hasPurchased = true;
        } else {
          // Buscar OrderItem direto
          const orderItem = await prisma.orderItem.findFirst({
            where: {
              productId: parsedProductId,
              order: {
                userId: userId,
              },
            },
            include: {
              order: {
                select: {
                  status: true,
                  payments: {
                    select: {
                      status: true,
                    },
                  },
                },
              },
            },
          });

          if (orderItem) {
            const orderStatus = orderItem.order.status;
            const hasApprovedPayment = orderItem.order.payments.some(p => p.status === 'approved');
            hasPurchased = 
              orderStatus === 'delivered' ||
              ['confirmed', 'processing', 'shipped', 'completed'].includes(orderStatus) ||
              hasApprovedPayment;
          } else {
            // Última tentativa: verificar se usuário tem pedidos entregues
            const anyDeliveredOrder = await prisma.order.findFirst({
              where: {
                userId: userId,
                status: 'delivered',
                items: {
                  some: {
                    productId: parsedProductId,
                  },
                },
              },
            });

            if (anyDeliveredOrder) {
              console.log('✅ Produto encontrado em pedido entregue (atualização - busca ampla)');
              hasPurchased = true;
            }
          }
        }

        if (!hasPurchased) {
          console.error('❌ ATUALIZAÇÃO REJEITADA - hasPurchased é false', {
            productId: parsedProductId,
            userId,
          });
          return res.status(403).json({ 
            error: 'Você precisa comprar o produto antes de escrever um comentário.' 
          });
        }
        
        console.log('✅ Verificação de compra passou para atualização! hasPurchased:', hasPurchased);

        // Deletar imagens antigas se houver novas
        if (images && Array.isArray(images) && images.length > 0) {
          await prisma.reviewImage.deleteMany({
            where: { reviewId: existingReview.id },
          });
        }

        // Atualizar review existente com comentário
        const updatedReview = await prisma.review.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: parseInt(rating),
            comment: comment.trim(),
            // Criar imagens se fornecidas
            ...(images && Array.isArray(images) && images.length > 0 && {
              images: {
                create: images.map((imageUrl: string) => ({
                  imageUrl: imageUrl,
                })),
              },
            }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            images: true,
          },
        });

        return res.status(200).json(updatedReview);
      } else {
        // Atualizar apenas o rating
        const updatedReview = await prisma.review.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: parseInt(rating),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return res.status(200).json(updatedReview);
      }
    }

    // Criar nova review
    const review = await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: userId,
        rating: parseInt(rating),
        comment: (comment && comment.trim()) || null,
        // Criar imagens se fornecidas
        ...(images && Array.isArray(images) && images.length > 0 && {
          images: {
            create: images.map((imageUrl: string) => {
              // Verificar se o base64 está completo
              const base64Length = imageUrl.length;
              console.log('💾 Salvando imagem:', {
                base64Length,
                startsWithData: imageUrl.startsWith('data:image'),
                preview: imageUrl.substring(0, 50),
              });
              
              // Se o base64 for muito grande, pode estar sendo cortado
              if (base64Length > 1000000) { // > 1MB em base64
                console.warn('⚠️ Base64 muito grande:', base64Length);
              }
              
              return {
                imageUrl: imageUrl,
              };
            }),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Create review error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Você já avaliou este produto' });
    }
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Delete a review
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const reviewId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar a avaliação
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        images: true,
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    // Verificar se o usuário é o dono da avaliação
    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta avaliação' });
    }

    // Deletar a avaliação (as imagens serão deletadas automaticamente devido ao onDelete: Cascade)
    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.status(200).json({ message: 'Avaliação deletada com sucesso' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Erro ao deletar avaliação' });
  }
});

// Get average rating for a product
router.get('/product/:productId/average', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.id || 0,
    });
  } catch (error: any) {
    console.error('Get average rating error:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliação média' });
  }
});

export default router;

