// Rotas de Frete e Rastreamento
// Versão 2.0 - Sistema de Frete e Entregas

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ShippingService } from '../services/ShippingService';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();

const router = express.Router();

/**
 * POST /api/shipping/calculate
 * Calcula opções de frete para um pedido
 * Body: { originZipCode, destinationZipCode, weight, dimensions, value? }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { originZipCode, destinationZipCode, weight, dimensions, value } = req.body;

    // Validar campos obrigatórios
    if (!originZipCode || !destinationZipCode || !weight || !dimensions) {
      return res.status(400).json({
        error: 'Campos obrigatórios: originZipCode, destinationZipCode, weight, dimensions',
      });
    }

    // Validar dimensões
    if (!dimensions.height || !dimensions.width || !dimensions.length) {
      return res.status(400).json({
        error: 'Dimensões obrigatórias: height, width, length',
      });
    }

    const options = await ShippingService.calculateShipping({
      originZipCode,
      destinationZipCode,
      weight,
      dimensions,
      value,
    });

    res.json({ options });
  } catch (error: any) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({
      error: 'Erro ao calcular frete',
      message: error.message,
    });
  }
});

/**
 * GET /api/shipping/tracking/:code
 * Busca rastreamento por código
 */
router.get('/tracking/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Código de rastreamento é obrigatório' });
    }

    const tracking = await ShippingService.getTrackingByCode(code);

    if (!tracking) {
      return res.status(404).json({ error: 'Rastreamento não encontrado' });
    }

    res.json({ tracking });
  } catch (error: any) {
    console.error('Error getting tracking:', error);
    res.status(500).json({
      error: 'Erro ao buscar rastreamento',
      message: error.message,
    });
  }
});

/**
 * GET /api/shipping/tracking/order/:orderId
 * Busca rastreamento por pedido (requer autenticação)
 */
router.get('/tracking/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.id;

    if (!orderId) {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    // Buscar tracking pelo orderId
    const tracking = await prisma.shippingTracking.findUnique({
      where: { orderId: parseInt(orderId) },
      include: { order: { include: { user: true } } },
    });

    if (!tracking) {
      return res.status(404).json({ error: 'Rastreamento não encontrado' });
    }

    // Verificar se o pedido pertence ao usuário (exceto admin)
    const isAdmin = (req as any).user?.isAdmin;
    if (!isAdmin && tracking.order.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Parse eventos JSON se existir
    const trackingWithParsedEvents = {
      ...tracking,
      events: tracking.events ? JSON.parse(tracking.events) : null,
    };

    res.json({ tracking: trackingWithParsedEvents });
  } catch (error: any) {
    console.error('Error getting tracking by order:', error);
    res.status(500).json({
      error: 'Erro ao buscar rastreamento',
      message: error.message,
    });
  }
});

/**
 * POST /api/shipping/tracking/sync/:code
 * Sincroniza rastreamento com API externa (requer autenticação admin)
 */
router.post('/tracking/sync/:code', authenticate, async (req, res) => {
  try {
    const { code } = req.params;
    const isAdmin = (req as any).user?.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Código de rastreamento é obrigatório' });
    }

    // Buscar tracking atual
    const tracking = await ShippingService.getTrackingByCode(code);
    if (!tracking) {
      return res.status(404).json({ error: 'Rastreamento não encontrado' });
    }
    
    // Simular sincronização (em produção, chamaria API dos Correios)
    const syncResult = await ShippingService.syncTrackingWithExternalAPI(tracking.id);
    
    res.json({ message: 'Rastreamento sincronizado', result: syncResult });
  } catch (error: any) {
    console.error('Error syncing tracking:', error);
    res.status(500).json({
      error: 'Erro ao sincronizar rastreamento',
      message: error.message,
    });
  }
});

export default router;

