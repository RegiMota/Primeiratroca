import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET logo is public (no auth required)
router.get('/logo', async (req, res) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'logo' },
    });
    
    res.json({ logo: setting?.value || null });
  } catch (error: any) {
    console.error('Error fetching logo:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Se for erro de conexão com banco, retornar null em vez de erro 500
    if (error.code === 'P1001' || 
        error.code === 'P1017' ||
        error.code === 'P2002' ||
        error.message?.includes('connect') || 
        error.message?.includes('Can\'t reach database') ||
        error.message?.includes('Connection') ||
        error.message?.includes('ECONNREFUSED')) {
      console.error('Database connection error - returning null logo');
      return res.json({ logo: null });
    }
    
    // Em caso de tabela não existir, retornar null
    if (error.code === 'P2025' || error.message?.includes('does not exist')) {
      console.warn('Settings table might not exist - returning null logo');
      return res.json({ logo: null });
    }
    
    // Para qualquer outro erro, retornar null em desenvolvimento para não quebrar o frontend
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.warn('Unknown error fetching logo - returning null in development');
      return res.json({ logo: null });
    }
    
    res.status(500).json({ 
      error: 'Erro ao buscar logo', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
});

// PUT logo requires admin authentication
router.put('/logo', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { logo } = req.body;
    
    // Se logo for vazio, null ou undefined, remover a logo
    if (!logo || logo === '' || logo === null || logo === undefined) {
      // Deletar o registro de logo se existir
      try {
        await prisma.settings.delete({
          where: { key: 'logo' },
        });
      } catch (deleteError: any) {
        // Se não existir, não é um erro (P2025 = Record not found)
        if (deleteError.code !== 'P2025') {
          throw deleteError;
        }
      }
      return res.json({ message: 'Logo removida com sucesso', logo: null });
    }

    // Validate logo URL (must be a valid URL or base64)
    if (!logo.startsWith('http') && !logo.startsWith('data:image')) {
      return res.status(400).json({ error: 'Logo deve ser uma URL válida ou base64' });
    }

    // Upsert logo setting
    const setting = await prisma.settings.upsert({
      where: { key: 'logo' },
      update: { value: logo },
      create: { key: 'logo', value: logo },
    });

    res.json({ message: 'Logo atualizada com sucesso', logo: setting.value });
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({ error: 'Erro ao atualizar logo' });
  }
});

// Rotas públicas para carrossel e cards de benefícios
router.get('/hero-slides', async (req, res) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    res.json(slides);
  } catch (error: any) {
    console.error('Error fetching hero slides:', error);
    res.json([]); // Retornar array vazio em caso de erro para não quebrar o frontend
  }
});

router.get('/benefit-cards', async (req, res) => {
  try {
    const cards = await prisma.benefitCard.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    res.json(cards);
  } catch (error: any) {
    console.error('Error fetching benefit cards:', error);
    res.json([]); // Retornar array vazio em caso de erro para não quebrar o frontend
  }
});

export default router;

