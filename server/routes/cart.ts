import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// For now, cart is managed in the frontend
// In the future, we can persist cart in the database
router.get('/', authenticate, async (req: AuthRequest, res) => {
  // Cart is currently stored in localStorage on the frontend
  // This endpoint can be used to sync cart in the future
  res.json({ items: [], message: 'Carrinho gerenciado no frontend' });
});

export default router;

