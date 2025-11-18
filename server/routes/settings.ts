import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET logo is public (no auth required)
router.get('/logo', async (req, res) => {
  try {
    const [logoSetting, linkSetting, sizeSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'logo' } }),
      prisma.settings.findUnique({ where: { key: 'logoLink' } }),
      prisma.settings.findUnique({ where: { key: 'logoSize' } }),
    ]);
    
    res.json({ 
      logo: logoSetting?.value || null,
      logoLink: linkSetting?.value || '/',
      logoSize: sizeSetting?.value || '150px'
    });
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
      return res.json({ logo: null, logoLink: '/', logoSize: '150px' });
    }
    
    // Em caso de tabela não existir, retornar null
    if (error.code === 'P2025' || error.message?.includes('does not exist')) {
      console.warn('Settings table might not exist - returning null logo');
      return res.json({ logo: null, logoLink: '/', logoSize: '150px' });
    }
    
    // Para qualquer outro erro, retornar null em desenvolvimento para não quebrar o frontend
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.warn('Unknown error fetching logo - returning null in development');
      return res.json({ logo: null, logoLink: '/', logoSize: '150px' });
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
    const { logo, logoLink, logoSize } = req.body;
    
    // Se logo for vazio, null ou undefined, remover a logo
    if (!logo || logo === '' || logo === null || logo === undefined) {
      // Deletar os registros de logo se existirem
      try {
        await prisma.settings.deleteMany({
          where: { 
            key: {
              in: ['logo', 'logoLink', 'logoSize']
            }
          },
        });
      } catch (deleteError: any) {
        // Se não existir, não é um erro
        if (deleteError.code !== 'P2025') {
          throw deleteError;
        }
      }
      return res.json({ message: 'Logo removida com sucesso', logo: null, logoLink: '/', logoSize: '150px' });
    }

    // Validate logo URL (must be a valid URL or base64)
    if (!logo.startsWith('http') && !logo.startsWith('data:image')) {
      return res.status(400).json({ error: 'Logo deve ser uma URL válida ou base64' });
    }

    // Validar link da logo (deve ser um caminho válido ou URL)
    const validLink = logoLink && logoLink.trim() !== '' ? logoLink.trim() : '/';
    
    // Validar tamanho da logo (deve ser um valor CSS válido)
    const validSize = logoSize && logoSize.trim() !== '' ? logoSize.trim() : '150px';

    // Upsert logo settings
    await prisma.settings.upsert({
      where: { key: 'logo' },
      update: { value: logo },
      create: { key: 'logo', value: logo },
    });

    await prisma.settings.upsert({
      where: { key: 'logoLink' },
      update: { value: validLink },
      create: { key: 'logoLink', value: validLink },
    });

    await prisma.settings.upsert({
      where: { key: 'logoSize' },
      update: { value: validSize },
      create: { key: 'logoSize', value: validSize },
    });

    res.json({ 
      message: 'Logo atualizada com sucesso', 
      logo: logo,
      logoLink: validLink,
      logoSize: validSize
    });
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

// ============================================
// ROTAS DE ESTILIZAÇÃO
// ============================================

// GET /api/settings/theme - Buscar configurações de tema (público)
router.get('/theme', async (req, res) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'theme' },
    });
    
    if (setting) {
      res.json(JSON.parse(setting.value));
    } else {
      // Retornar valores padrão
      res.json({
        colors: {
          primary: '#0ea5e9',
          secondary: '#46d392',
          accent: '#f59e0b',
          background: '#ffffff',
          text: '#1f2937',
        },
        sizes: {
          cardWidth: '280px',
          cardHeight: 'auto',
          borderRadius: '12px',
        },
        customCSS: '',
      });
    }
  } catch (error: any) {
    console.error('Error fetching theme:', error);
    res.json({
      colors: {
        primary: '#0ea5e9',
        secondary: '#46d392',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
      },
      sizes: {
        cardWidth: '280px',
        cardHeight: 'auto',
        borderRadius: '12px',
      },
      customCSS: '',
    });
  }
});

// PUT /api/settings/theme - Atualizar configurações de tema (admin)
router.put('/theme', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const theme = req.body;
    
    // Validar estrutura
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ error: 'Dados de tema inválidos' });
    }
    
    // Salvar como JSON
    const setting = await prisma.settings.upsert({
      where: { key: 'theme' },
      update: { value: JSON.stringify(theme) },
      create: { key: 'theme', value: JSON.stringify(theme) },
    });
    
    res.json({ message: 'Tema atualizado com sucesso', theme: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Erro ao atualizar tema' });
  }
});

export default router;

