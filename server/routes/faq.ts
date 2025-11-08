import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// GET /api/faq - Lista todas as FAQs ativas
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    const where: any = {
      isActive: true,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { question: { contains: search as string } },
        { answer: { contains: search as string } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Erro ao buscar FAQs' });
  }
});

// GET /api/faq/categories - Lista categorias de FAQ
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.fAQ.groupBy({
      by: ['category'],
      where: {
        isActive: true,
      },
      _count: true,
    });

    res.json(categories.map((c) => ({ category: c.category, count: c._count })));
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias de FAQ' });
  }
});

// POST /api/faq/:id/feedback - Registra feedback de uma FAQ
router.post('/:id/feedback', async (req, res) => {
  try {
    const faqId = parseInt(req.params.id);
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'Campo "helpful" deve ser um booleano' });
    }

    const updateData: any = {};

    if (helpful) {
      updateData.helpfulCount = { increment: 1 };
    } else {
      updateData.notHelpfulCount = { increment: 1 };
    }

    await prisma.fAQ.update({
      where: { id: faqId },
      data: updateData,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating FAQ feedback:', error);
    res.status(500).json({ error: 'Erro ao atualizar feedback da FAQ' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET /api/faq/admin/all - Lista todas as FAQs (admin only)
router.get('/admin/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { category, search } = req.query;

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { question: { contains: search as string } },
        { answer: { contains: search as string } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching all FAQs:', error);
    res.status(500).json({ error: 'Erro ao buscar FAQs' });
  }
});

// POST /api/faq/admin - Cria uma nova FAQ (admin only)
router.post('/admin', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { question, answer, category, order, isActive } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ error: 'Pergunta, resposta e categoria são obrigatórios' });
    }

    const validCategories = ['general', 'orders', 'payments', 'shipping', 'products', 'returns'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    const faq = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Erro ao criar FAQ' });
  }
});

// PUT /api/faq/admin/:id - Atualiza uma FAQ (admin only)
router.put('/admin/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const faqId = parseInt(req.params.id);
    const { question, answer, category, order, isActive } = req.body;

    const updateData: any = {};

    if (question !== undefined) {
      updateData.question = question.trim();
    }

    if (answer !== undefined) {
      updateData.answer = answer.trim();
    }

    if (category !== undefined) {
      const validCategories = ['general', 'orders', 'payments', 'shipping', 'products', 'returns'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
      updateData.category = category;
    }

    if (order !== undefined) {
      updateData.order = parseInt(order);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data: updateData,
    });

    res.json(faq);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Erro ao atualizar FAQ' });
  }
});

// DELETE /api/faq/admin/:id - Deleta uma FAQ (admin only)
router.delete('/admin/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const faqId = parseInt(req.params.id);

    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    res.json({ message: 'FAQ deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Erro ao deletar FAQ' });
  }
});

export default router;

