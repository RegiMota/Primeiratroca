import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Check if user purchased a product
router.get('/check-purchase/:productId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const productId = parseInt(req.params.productId);

    // Verificar se o usuário comprou o produto
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        order: {
          userId: userId,
          status: {
            in: ['delivered', 'shipped', 'processing', 'completed'],
          },
        },
      },
    });

    res.json({ hasPurchased: !!hasPurchased });
  } catch (error: any) {
    console.error('Check purchase error:', error);
    res.status(500).json({ error: 'Erro ao verificar compra' });
  }
});

// Create a review
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const { productId, rating, comment } = req.body;

    // Validate rating (1-5)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5 estrelas' });
    }

    // Se houver comentário, verificar se o usuário comprou o produto
    if (comment && comment.trim()) {
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          productId: parseInt(productId),
          order: {
            userId: userId,
            status: {
              in: ['delivered', 'shipped', 'processing', 'completed'],
            },
          },
        },
      });

      if (!hasPurchased) {
        return res.status(403).json({ 
          error: 'Você precisa comprar o produto antes de escrever um comentário. Você pode avaliar apenas com estrelas.' 
        });
      }
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: parseInt(productId),
          userId: userId,
        },
      },
    });

    if (existingReview) {
      // Se já existe uma review, atualizar apenas se houver comentário (e usuário comprou)
      if (comment && comment.trim()) {
        const hasPurchased = await prisma.orderItem.findFirst({
          where: {
            productId: parseInt(productId),
            order: {
              userId: userId,
              status: {
                in: ['delivered', 'shipped', 'processing', 'completed'],
              },
            },
          },
        });

        if (!hasPurchased) {
          return res.status(403).json({ 
            error: 'Você precisa comprar o produto antes de escrever um comentário.' 
          });
        }

        // Atualizar review existente com comentário
        const updatedReview = await prisma.review.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: parseInt(rating),
            comment: comment.trim(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return res.status(200).json(updatedReview);
      } else {
        // Atualizar apenas o rating
        const updatedReview = await prisma.review.update({
          where: {
            id: existingReview.id,
          },
          data: {
            rating: parseInt(rating),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return res.status(200).json(updatedReview);
      }
    }

    // Criar nova review
    const review = await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: userId,
        rating: parseInt(rating),
        comment: (comment && comment.trim()) || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Create review error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Você já avaliou este produto' });
    }
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Get average rating for a product
router.get('/product/:productId/average', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.id || 0,
    });
  } catch (error: any) {
    console.error('Get average rating error:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliação média' });
  }
});

export default router;

