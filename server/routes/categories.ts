import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Get all menus (public route for navbar)
router.get('/menus', async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json(menus);
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ error: 'Erro ao buscar menus' });
  }
});

export default router;

