// Jobs Agendados para Wishlist
// Versão 2.0 - Módulo 4: Sistema de Wishlist/Favoritos

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/NotificationService';

const prisma = new PrismaClient();

/**
 * Job: Verificar promoções de produtos na wishlist (executa diariamente às 8:00 AM)
 * Busca todos os produtos na wishlist que entraram em promoção e notifica os usuários
 */
export function startWishlistPromotionCheckJob() {
  // Executar diariamente às 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('[WishlistJob] Iniciando verificação de promoções na wishlist...');
      
      // Buscar todos os itens da wishlist com seus produtos
      const wishlistItems = await prisma.wishlistItem.findMany({
        include: {
          product: {
            include: {
              category: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (wishlistItems.length === 0) {
        console.log('[WishlistJob] Nenhum item na wishlist para verificar');
        return;
      }

      let notificationsSent = 0;
      const notifiedUsers = new Set<number>();

      // Verificar cada item da wishlist
      for (const item of wishlistItems) {
        try {
          const product = item.product;
          
          // Verificar se o produto está em promoção
          // Um produto está em promoção se tem originalPrice e price < originalPrice
          if (product.originalPrice && product.price < product.originalPrice) {
            // Calcular desconto percentual
            const discountPercent = Math.round(
              ((product.originalPrice.toNumber() - product.price.toNumber()) / 
               product.originalPrice.toNumber()) * 100
            );

            // Verificar se já notificamos este usuário sobre este produto hoje
            // (evitar spam de notificações)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: item.userId,
                type: 'promotion',
                data: {
                  contains: `"productId":${product.id}`,
                },
                createdAt: {
                  gte: today,
                },
              },
            });

            if (existingNotification) {
              // Já notificamos hoje, pular
              continue;
            }

            // Criar notificação para o usuário
            await NotificationService.createNotification(
              item.userId,
              'promotion',
              '🎉 Produto em Promoção!',
              `O produto "${product.name}" da sua wishlist está com ${discountPercent}% de desconto! De R$ ${product.originalPrice.toFixed(2)} por R$ ${product.price.toFixed(2)}`,
              {
                productId: product.id,
                wishlistItemId: item.id,
                discountPercent,
                originalPrice: product.originalPrice.toNumber(),
                currentPrice: product.price.toNumber(),
                productName: product.name,
              }
            );

            notifiedUsers.add(item.userId);
            notificationsSent++;

            console.log(
              `[WishlistJob] Notificação enviada para usuário ${item.userId} sobre produto ${product.name} (${discountPercent}% off)`
            );
          }
        } catch (error) {
          console.error(`[WishlistJob] Erro ao processar item ${item.id}:`, error);
        }
      }

      console.log(
        `[WishlistJob] Verificação concluída: ${notificationsSent} notificação(ões) enviada(s) para ${notifiedUsers.size} usuário(s)`
      );
    } catch (error) {
      console.error('[WishlistJob] Erro ao verificar promoções:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo',
  });

  console.log('✅ Job de verificação de promoções na wishlist agendado (diário às 8:00 AM)');
}

/**
 * Inicializa todos os jobs da wishlist
 */
export function initWishlistJobs() {
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_JOBS !== 'true') {
    console.log('⚠️  Jobs de wishlist desabilitados (defina ENABLE_JOBS=true para habilitar)');
    return;
  }

  startWishlistPromotionCheckJob();

  console.log('✅ Todos os jobs de wishlist inicializados');
}

