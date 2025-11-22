import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/announcements - Lista todos os avisos ativos (rota pública)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    // Buscar todos os avisos ativos
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Announcements] Found ${announcements.length} active announcements`);
      announcements.forEach((ann) => {
        console.log(`  - ${ann.title} (Active: ${ann.isActive}, Start: ${ann.startDate}, End: ${ann.endDate})`);
      });
    }

    res.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    console.error('Error stack:', error.stack);
    res.json([]); // Retornar array vazio em caso de erro para não quebrar o frontend
  }
});

export default router;

