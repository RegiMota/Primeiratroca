import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all coupons (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { isActive, code } = req.query;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (code) {
      where.code = {
        contains: code as string,
      };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    // Convert Decimal to number
    const formattedCoupons = coupons.map((coupon) => ({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      orderCount: coupon._count.orders,
    }));

    res.json(formattedCoupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Erro ao buscar cupons' });
  }
});

// GET single coupon (admin only)
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const couponId = parseInt(req.params.id);

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    // Convert Decimal to number
    const formattedCoupon = {
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      orderCount: coupon._count.orders,
    };

    res.json(formattedCoupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({ error: 'Erro ao buscar cupom' });
  }
});

// POST validate coupon (public - no auth required)
// IMPORTANTE: Deve estar ANTES das rotas com parâmetros
router.post('/validate', async (req, res) => {
  try {
    const { code, total } = req.body;

    if (!code || !total) {
      return res.status(400).json({ error: 'Código e total são obrigatórios' });
    }

    // Normalize code
    const normalizedCode = code.toUpperCase().trim();

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return res.json({
        valid: false,
        error: 'Cupom não encontrado',
      });
    }

    // Validate coupon
    const now = new Date();

    // Check if active
    if (!coupon.isActive) {
      return res.json({
        valid: false,
        error: 'Cupom não está ativo',
      });
    }

    // Check date range
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.json({
        valid: false,
        error: 'Cupom fora do período de validade',
      });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return res.json({
        valid: false,
        error: 'Cupom atingiu o limite de usos',
      });
    }

    // Check min purchase
    const subtotal = parseFloat(total);
    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      return res.json({
        valid: false,
        error: `Valor mínimo de compra: R$ ${Number(coupon.minPurchase).toFixed(2)}`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
      
      // Apply max discount if specified
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      },
      discountAmount,
      finalTotal: subtotal - discountAmount,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Erro ao validar cupom' });
  }
});

// POST create coupon (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      maxUses,
      isActive,
    } = req.body;

    // Validation
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return res.status(400).json({ error: 'Tipo de desconto deve ser "percentage" ou "fixed"' });
    }

    if (discountValue <= 0) {
      return res.status(400).json({ error: 'Valor do desconto deve ser maior que zero' });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ error: 'Desconto percentual não pode ser maior que 100%' });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCoupon) {
      return res.status(400).json({ error: 'Código do cupom já existe' });
    }

    // Validate dates
    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (validUntilDate <= validFromDate) {
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive: isActive !== undefined ? isActive : true,
        currentUses: 0,
      },
    });

    // Convert Decimal to number
    const formattedCoupon = {
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
    };

    res.status(201).json(formattedCoupon);
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Código do cupom já existe' });
    }

    res.status(500).json({ error: 'Erro ao criar cupom' });
  }
});

// PUT update coupon (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const couponId = parseInt(req.params.id);
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      maxUses,
      isActive,
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    // Build update data
    const updateData: any = {};

    if (code !== undefined) {
      const normalizedCode = code.toUpperCase().trim();
      
      // Check if new code already exists (if different from current)
      if (normalizedCode !== existingCoupon.code) {
        const codeExists = await prisma.coupon.findUnique({
          where: { code: normalizedCode },
        });

        if (codeExists) {
          return res.status(400).json({ error: 'Código do cupom já existe' });
        }
      }

      updateData.code = normalizedCode;
    }

    if (discountType !== undefined) {
      if (discountType !== 'percentage' && discountType !== 'fixed') {
        return res.status(400).json({ error: 'Tipo de desconto deve ser "percentage" ou "fixed"' });
      }
      updateData.discountType = discountType;
    }

    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return res.status(400).json({ error: 'Valor do desconto deve ser maior que zero' });
      }
      
      const finalDiscountType = discountType || existingCoupon.discountType;
      if (finalDiscountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({ error: 'Desconto percentual não pode ser maior que 100%' });
      }
      
      updateData.discountValue = parseFloat(discountValue);
    }

    if (minPurchase !== undefined) {
      updateData.minPurchase = minPurchase ? parseFloat(minPurchase) : null;
    }

    if (maxDiscount !== undefined) {
      updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    }

    if (validFrom !== undefined) {
      updateData.validFrom = new Date(validFrom);
    }

    if (validUntil !== undefined) {
      updateData.validUntil = new Date(validUntil);
    }

    // Validate dates if both are provided
    const finalValidFrom = updateData.validFrom || existingCoupon.validFrom;
    const finalValidUntil = updateData.validUntil || existingCoupon.validUntil;

    if (finalValidUntil <= finalValidFrom) {
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }

    if (maxUses !== undefined) {
      updateData.maxUses = maxUses ? parseInt(maxUses) : null;
      
      // Ensure currentUses doesn't exceed maxUses
      if (updateData.maxUses !== null && existingCoupon.currentUses > updateData.maxUses) {
        return res.status(400).json({ 
          error: `Não é possível definir máximo de usos menor que os usos atuais (${existingCoupon.currentUses})` 
        });
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    // Convert Decimal to number
    const formattedCoupon = {
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
    };

    res.json(formattedCoupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Código do cupom já existe' });
    }

    res.status(500).json({ error: 'Erro ao atualizar cupom' });
  }
});

// DELETE coupon (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const couponId = parseInt(req.params.id);

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    // Check if coupon has orders
    if (coupon._count.orders > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cupom que já foi usado em pedidos. Desative-o ao invés de deletar.' 
      });
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: couponId },
    });

    res.json({ message: 'Cupom deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Erro ao deletar cupom' });
  }
});

export default router;

