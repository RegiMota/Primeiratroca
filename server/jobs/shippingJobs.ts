// Jobs Agendados para Rastreamento de Entregas
// Versão 2.0 - Módulo 3: Sistema de Frete e Entregas

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ShippingService } from '../services/ShippingService';

const prisma = new PrismaClient();

/**
 * Job: Atualizar rastreamentos automaticamente (executa a cada hora)
 * Busca todos os rastreamentos ativos e atualiza status usando API dos Correios
 */
export function startTrackingUpdateJob() {
  // Executar a cada hora (minuto 0 de cada hora)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[ShippingJob] Iniciando atualização de rastreamentos...');
      
      // Buscar todos os rastreamentos ativos (não entregues)
      const activeTrackings = await prisma.shippingTracking.findMany({
        where: {
          status: {
            not: 'delivered',
          },
        },
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
        take: 100, // Limitar a 100 por execução para não sobrecarregar
      });

      if (activeTrackings.length === 0) {
        console.log('[ShippingJob] Nenhum rastreamento ativo encontrado');
        return;
      }

      console.log(`[ShippingJob] Atualizando ${activeTrackings.length} rastreamentos...`);

      let updated = 0;
      let errors = 0;

      // Atualizar cada rastreamento
      for (const tracking of activeTrackings) {
        try {
          // Sincronizar com API dos Correios
          const trackingData = await ShippingService.syncTrackingFromAPI(tracking.trackingCode);

          // Atualizar status no banco
          await ShippingService.updateTrackingStatus(
            tracking.id,
            trackingData.status,
            trackingData.statusDetail,
            trackingData.events
          );

          // Atualizar data estimada de entrega se disponível
          if (trackingData.estimatedDelivery) {
            await prisma.shippingTracking.update({
              where: { id: tracking.id },
              data: {
                estimatedDelivery: trackingData.estimatedDelivery,
              },
            });
          }

          updated++;
        } catch (error: any) {
          console.error(`[ShippingJob] Erro ao atualizar rastreamento ${tracking.trackingCode}:`, error.message);
          errors++;
        }
      }

      console.log(`[ShippingJob] Atualização concluída: ${updated} atualizados, ${errors} erros`);
    } catch (error: any) {
      console.error('[ShippingJob] Erro ao executar job de atualização de rastreamentos:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo',
  });

  console.log('✅ Job de atualização de rastreamentos agendado: A cada hora');
}

/**
 * Inicializa todos os jobs de rastreamento
 */
export function initShippingJobs() {
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_JOBS !== 'true') {
    console.log('⚠️  Jobs de rastreamento desabilitados (defina ENABLE_JOBS=true para habilitar)');
    return;
  }

  startTrackingUpdateJob();

  console.log('✅ Todos os jobs de rastreamento inicializados');
}

