import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { ImageService } from '../services/ImageService';

const router = express.Router();
const prisma = new PrismaClient();

// GET all images for a product (public)
router.get('/products/:productId/images', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [
        { isPrimary: 'desc' }, // Primary image first
        { order: 'asc' },       // Then by order
        { createdAt: 'asc' },    // Then by creation date
      ],
    });

    res.json(images);
  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({ error: 'Erro ao buscar imagens do produto' });
  }
});

// POST upload new image (admin only)
router.post('/products/:productId/images', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { url, isPrimary, order } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL da imagem é obrigatória' });
    }

    // Validate URL (must be a valid URL or base64)
    if (!url.startsWith('http') && !url.startsWith('data:image')) {
      return res.status(400).json({ error: 'URL deve ser uma URL válida ou base64' });
    }

    // Se for base64, fazer upload para Cloudinary (se configurado)
    let imageUrl = url;
    if (url.startsWith('data:image')) {
      try {
        imageUrl = await ImageService.uploadImage(url, {
          folder: 'primeira-troca/products',
          width: 1200,
          height: 1200,
          quality: 85,
          format: 'webp',
        });
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        // Continuar com base64 se falhar
      }
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // If this image is marked as primary, unset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { 
          productId,
          isPrimary: true,
        },
        data: { 
          isPrimary: false,
        },
      });
    }

    // If no primary image exists and this is not explicitly primary, make it primary
    const existingImages = await prisma.productImage.findMany({
      where: { productId },
    });

    const hasPrimary = existingImages.some(img => img.isPrimary);
    const shouldBePrimary = isPrimary || (!hasPrimary && existingImages.length === 0);

    // Create image
    const image = await prisma.productImage.create({
      data: {
        productId,
        url: imageUrl, // Usar URL processada (Cloudinary ou base64)
        isPrimary: shouldBePrimary,
        order: order !== undefined ? parseInt(order) : existingImages.length,
      },
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// PUT update image (admin only)
router.put('/products/:productId/images/:imageId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const imageId = parseInt(req.params.imageId);
    const { url, isPrimary, order } = req.body;

    // Verify image exists and belongs to product
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // If setting as primary, unset other primary images
    if (isPrimary === true) {
      await prisma.productImage.updateMany({
        where: {
          productId,
          id: { not: imageId }, // Exclude current image
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Update image
    const updateData: any = {};
    if (url !== undefined) {
      // Validate URL if provided
      if (!url.startsWith('http') && !url.startsWith('data:image')) {
        return res.status(400).json({ error: 'URL deve ser uma URL válida ou base64' });
      }
      updateData.url = url;
    }
    if (isPrimary !== undefined) {
      updateData.isPrimary = isPrimary;
    }
    if (order !== undefined) {
      updateData.order = parseInt(order);
    }

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
    });

    res.json(image);
  } catch (error) {
    console.error('Error updating product image:', error);
    res.status(500).json({ error: 'Erro ao atualizar imagem' });
  }
});

// DELETE image (admin only)
router.delete('/products/:productId/images/:imageId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const imageId = parseInt(req.params.imageId);

    // Verify image exists and belongs to product
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // Deletar imagem do Cloudinary (se for URL do Cloudinary)
    if (existingImage.url.includes('cloudinary.com')) {
      await ImageService.deleteImage(existingImage.url);
    }

    // Delete image from database
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set first remaining image as primary
    if (existingImage.isPrimary) {
      const remainingImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { order: 'asc' },
        take: 1,
      });

      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true },
        });
      }
    }

    res.json({ message: 'Imagem deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ error: 'Erro ao deletar imagem' });
  }
});

export default router;

