// Rotas para Wishlist/Favoritos
// Versão 2.0 - Sistema de Wishlist

import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { WishlistService } from '../services/WishlistService';

const router = express.Router();

// GET /api/wishlist - Listar wishlist do usuário autenticado
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await WishlistService.getUserWishlist(user.id, limit, offset);
    res.json(result);
  } catch (error: any) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar wishlist' });
  }
});

// GET /api/wishlist/stats - Estatísticas da wishlist do usuário
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const stats = await WishlistService.getWishlistStats(user.id);
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting wishlist stats:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
  }
});

// GET /api/wishlist/check/:productId - Verificar se produto está na wishlist
router.get('/check/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const productId = parseInt(req.params.productId);
    const variantId = req.query.variantId
      ? parseInt(req.query.variantId as string)
      : undefined;

    const isInWishlist = await WishlistService.isInWishlist(
      user.id,
      productId,
      variantId
    );

    res.json({ isInWishlist });
  } catch (error: any) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: error.message || 'Erro ao verificar wishlist' });
  }
});

// GET /api/wishlist/share/:shareCode - Buscar wishlist por código de compartilhamento (público)
router.get('/share/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;
    const item = await WishlistService.getWishlistByShareCode(shareCode);
    res.json({ item });
  } catch (error: any) {
    console.error('Error getting shared wishlist:', error);
    res.status(404).json({ error: error.message || 'Wishlist não encontrada' });
  }
});

// GET /api/wishlist/:id - Obter item específico da wishlist
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.id);
    const item = await WishlistService.getItemById(itemId, user.id);
    res.json({ item });
  } catch (error: any) {
    console.error('Error getting wishlist item:', error);
    res.status(404).json({ error: error.message || 'Item não encontrado' });
  }
});

// POST /api/wishlist - Adicionar item à wishlist
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const { productId, variantId, notes, priority, isPublic } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId é obrigatório' });
    }

    const item = await WishlistService.addItem({
      userId: user.id,
      productId: parseInt(productId),
      variantId: variantId ? parseInt(variantId) : undefined,
      notes,
      priority: priority ? parseInt(priority) : undefined,
      isPublic,
    });

    res.status(201).json({ item });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: error.message || 'Erro ao adicionar à wishlist' });
  }
});

// PUT /api/wishlist/:id - Atualizar item da wishlist
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.id);
    const { notes, priority, isPublic } = req.body;

    const item = await WishlistService.updateItem(user.id, itemId, {
      notes,
      priority: priority ? parseInt(priority) : undefined,
      isPublic,
    });

    res.json({ item });
  } catch (error: any) {
    console.error('Error updating wishlist item:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar item' });
  }
});

// POST /api/wishlist/:id/move-to-top - Mover item para o topo
router.post('/:id/move-to-top', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.id);
    const item = await WishlistService.moveToTop(user.id, itemId);
    res.json({ item });
  } catch (error: any) {
    console.error('Error moving item to top:', error);
    res.status(500).json({ error: error.message || 'Erro ao mover item' });
  }
});

// DELETE /api/wishlist/:id - Remover item da wishlist
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const itemId = parseInt(req.params.id);
    await WishlistService.removeItem(user.id, itemId);
    res.json({ message: 'Item removido da wishlist' });
  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: error.message || 'Erro ao remover da wishlist' });
  }
});

// POST /api/wishlist/remove-multiple - Remover múltiplos itens
router.post('/remove-multiple', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds deve ser um array não vazio' });
    }

    const result = await WishlistService.removeMultiple(
      user.id,
      itemIds.map((id: any) => parseInt(id))
    );
    res.json(result);
  } catch (error: any) {
    console.error('Error removing multiple items:', error);
    res.status(500).json({ error: error.message || 'Erro ao remover itens' });
  }
});

export default router;

