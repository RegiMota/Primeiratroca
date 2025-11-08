// Rotas para gerenciamento de estoque avançado
// Versão 2.0 - Controle de estoque por variação

import express, { Request, Response } from 'express';
import { StockService } from '../services/StockService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/stock/variants/product/:productId - Obter todas as variações de um produto
router.get('/variants/product/:productId', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const variants = await StockService.getVariantsByProduct(productId);
    res.json(variants);
  } catch (error: any) {
    console.error('Error getting variants:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar variações' });
  }
});

// GET /api/stock/variants/:id - Obter variação específica
router.get('/variants/:id', async (req: Request, res: Response) => {
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

// POST /api/stock/variants - Criar nova variação (requer autenticação)
router.post('/variants', authenticate, async (req: Request, res: Response) => {
  try {
    const variant = await StockService.createVariant(req.body);
    res.status(201).json(variant);
  } catch (error: any) {
    console.error('Error creating variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar variação' });
  }
});

// PUT /api/stock/variants/:id - Atualizar variação (requer autenticação)
router.put('/variants/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const variant = await StockService.updateVariant(id, req.body);
    res.json(variant);
  } catch (error: any) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar variação' });
  }
});

// DELETE /api/stock/variants/:id - Deletar variação (requer autenticação)
router.delete('/variants/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await StockService.deleteVariant(id);
    res.json({ message: 'Variação deletada com sucesso' });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: error.message || 'Erro ao deletar variação' });
  }
});

// POST /api/stock/reserve - Reservar estoque durante checkout
router.post('/reserve', authenticate, async (req: Request, res: Response) => {
  try {
    const { variantId, quantity, orderId, timeoutMinutes } = req.body;
    
    if (!variantId || !quantity || !orderId) {
      return res.status(400).json({ error: 'variantId, quantity e orderId são obrigatórios' });
    }

    await StockService.reserveStock(
      variantId,
      quantity,
      orderId,
      timeoutMinutes || 15
    );
    
    res.json({ message: 'Estoque reservado com sucesso' });
  } catch (error: any) {
    console.error('Error reserving stock:', error);
    res.status(500).json({ error: error.message || 'Erro ao reservar estoque' });
  }
});

// POST /api/stock/release - Liberar estoque reservado
router.post('/release', authenticate, async (req: Request, res: Response) => {
  try {
    const { variantId, quantity, orderId } = req.body;
    
    if (!variantId || !quantity) {
      return res.status(400).json({ error: 'variantId e quantity são obrigatórios' });
    }

    await StockService.releaseStock(variantId, quantity, orderId);
    
    res.json({ message: 'Estoque liberado com sucesso' });
  } catch (error: any) {
    console.error('Error releasing stock:', error);
    res.status(500).json({ error: error.message || 'Erro ao liberar estoque' });
  }
});

// POST /api/stock/confirm-sale - Confirmar venda (converte reserva em venda)
router.post('/confirm-sale', authenticate, async (req: Request, res: Response) => {
  try {
    const { variantId, quantity, orderId } = req.body;
    
    if (!variantId || !quantity || !orderId) {
      return res.status(400).json({ error: 'variantId, quantity e orderId são obrigatórios' });
    }

    await StockService.confirmSale(variantId, quantity, orderId);
    
    res.json({ message: 'Venda confirmada e estoque atualizado' });
  } catch (error: any) {
    console.error('Error confirming sale:', error);
    res.status(500).json({ error: error.message || 'Erro ao confirmar venda' });
  }
});

// GET /api/stock/movements - Obter histórico de movimentações
router.get('/movements', authenticate, async (req: Request, res: Response) => {
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

// GET /api/stock/low-stock - Obter variações com estoque baixo
router.get('/low-stock', authenticate, async (req: Request, res: Response) => {
  try {
    const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : undefined;
    const variants = await StockService.getLowStockVariants(minStock);
    res.json(variants);
  } catch (error: any) {
    console.error('Error getting low stock:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estoque baixo' });
  }
});

// GET /api/stock/stats - Obter estatísticas de estoque
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await StockService.getStockStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
  }
});

export default router;

