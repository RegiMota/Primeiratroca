import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/announcements - Lista todos os avisos ativos (rota pública)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
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

    res.json(announcements);
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    res.json([]); // Retornar array vazio em caso de erro para não quebrar o frontend
  }
});

export default router;

