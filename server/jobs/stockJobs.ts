// Jobs Agendados para Gestão de Estoque
// Versão 2.0 - Módulo 2: Sistema de Estoque Avançado

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { StockService } from '../services/StockService';
import { NotificationService } from '../services/NotificationService';

const prisma = new PrismaClient();

/**
 * Job 1: Verificar estoque baixo (executa diariamente às 9:00 AM)
 * Busca todas as variações com estoque <= minStock e notifica admins
 */
export function startLowStockCheckJob() {
  // Executar diariamente às 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[StockJob] Iniciando verificação de estoque baixo...');
      
      const lowStockVariants = await StockService.getLowStockVariants();
      
      if (lowStockVariants.length > 0) {
        console.log(`[StockJob] Encontradas ${lowStockVariants.length} variações com estoque baixo`);
        
        // Agrupar por produto para evitar notificações duplicadas
        const productMap = new Map<number, any[]>();
        
        lowStockVariants.forEach((variant) => {
          const productId = variant.productId;
          if (!productMap.has(productId)) {
            productMap.set(productId, []);
          }
          productMap.get(productId)!.push(variant);
        });
        
        // Buscar todos os admins
        const admins = await prisma.user.findMany({
          where: { isAdmin: true },
          select: { id: true },
        });
        
        // Notificar cada admin sobre cada produto com estoque baixo
        for (const admin of admins) {
          for (const [productId, variants] of productMap.entries()) {
            const product = variants[0].product;
            const variantDetails = variants.map((v) => ({
              size: v.size || 'N/A',
              color: v.color || 'N/A',
              stock: v.stock,
              minStock: v.minStock,
            }));
            
            const variantSummary = variantDetails
              .map((v) => `${v.size}/${v.color}: ${v.stock} (mín: ${v.minStock})`)
              .join(', ');
            
            try {
              await NotificationService.createNotification(
                admin.id,
                'stock',
                `Estoque Baixo: ${product.name}`,
                `Variações com estoque baixo: ${variantSummary}`,
                {
                  productId,
                  variantId: variants[0].id,
                  variants: variantDetails,
                }
              );
            } catch (error) {
              console.error(`[StockJob] Erro ao notificar admin ${admin.id}:`, error);
            }
          }
        }
        
        console.log(`[StockJob] Notificações enviadas para ${admins.length} admin(s)`);
      } else {
        console.log('[StockJob] Nenhuma variação com estoque baixo encontrada');
      }
    } catch (error) {
      console.error('[StockJob] Erro ao verificar estoque baixo:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo',
  });
  
  console.log('✅ Job de verificação de estoque baixo agendado (diário às 9:00 AM)');
}

/**
 * Job 2: Liberar estoque reservado expirado (executa a cada 15 minutos)
 * Busca pedidos pendentes há mais de 1 hora e libera estoque reservado
 */
export function startReleaseReservedStockJob() {
  // Executar a cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[StockJob] Iniciando liberação de estoque reservado expirado...');
      
      // Buscar pedidos pendentes há mais de 1 hora (60 minutos)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const expiredPendingOrders = await prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lt: oneHourAgo,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
            },
          },
        },
      });
      
      if (expiredPendingOrders.length > 0) {
        console.log(`[StockJob] Encontrados ${expiredPendingOrders.length} pedidos pendentes expirados`);
        
        let releasedCount = 0;
        
        for (const order of expiredPendingOrders) {
          try {
            // Para cada item do pedido, liberar estoque reservado
            for (const item of order.items) {
              try {
                // Buscar variação correspondente usando StockService
                const variant = await StockService.getVariantByProductSizeColor(
                  item.productId,
                  item.size || undefined,
                  item.color || undefined
                );
                
                if (variant && variant.reservedStock > 0) {
                  // Liberar estoque reservado
                  await StockService.releaseStock(
                    variant.id,
                    item.quantity,
                    order.id
                  );
                  
                  releasedCount++;
                  console.log(`[StockJob] Liberado estoque reservado: Variant ${variant.id}, Order ${order.id}, Quantity ${item.quantity}`);
                }
              } catch (error) {
                // Variação não encontrada ou erro ao liberar - continuar com próximo item
                console.log(`[StockJob] Variação não encontrada ou sem estoque reservado para item ${item.id} do pedido ${order.id}`);
              }
            }
            
            // Atualizar status do pedido para cancelled se ainda estiver pending
            if (order.status === 'pending') {
              await prisma.order.update({
                where: { id: order.id },
                data: { status: 'cancelled' },
              });
              
              console.log(`[StockJob] Pedido ${order.id} cancelado automaticamente (timeout)`);
              
              // Notificar usuário sobre cancelamento
              try {
                await NotificationService.createNotification(
                  order.userId,
                  'order',
                  'Pedido Cancelado',
                  `Seu pedido #${order.id} foi cancelado automaticamente devido ao tempo de espera excedido. O estoque foi liberado.`,
                  { orderId: order.id }
                );
              } catch (error) {
                console.error(`[StockJob] Erro ao notificar usuário sobre cancelamento:`, error);
              }
            }
          } catch (error) {
            console.error(`[StockJob] Erro ao processar pedido ${order.id}:`, error);
          }
        }
        
        console.log(`[StockJob] ${releasedCount} reservas de estoque liberadas`);
      } else {
        console.log('[StockJob] Nenhum pedido pendente expirado encontrado');
      }
    } catch (error) {
      console.error('[StockJob] Erro ao liberar estoque reservado:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo',
  });
  
  console.log('✅ Job de liberação de estoque reservado agendado (a cada 15 minutos, cancela pedidos após 1 hora)');
}

/**
 * Inicializa todos os jobs de estoque
 */
export function initStockJobs() {
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_JOBS !== 'true') {
    console.log('⚠️  Jobs de estoque desabilitados (defina ENABLE_JOBS=true para habilitar)');
    return;
  }
  
  startLowStockCheckJob();
  startReleaseReservedStockJob();
  
  console.log('✅ Todos os jobs de estoque inicializados');
}

