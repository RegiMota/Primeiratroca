// Rotas de Endereços do Usuário
// Versão 2.0 - Gestão de Endereços Múltiplos

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/addresses
 * Lista endereços do usuário autenticado
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ addresses });
  } catch (error: any) {
    console.error('Error getting addresses:', error);
    res.status(500).json({
      error: 'Erro ao buscar endereços',
      message: error.message,
    });
  }
});

/**
 * GET /api/addresses/:id
 * Busca um endereço específico
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const address = await prisma.userAddress.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    res.json({ address });
  } catch (error: any) {
    console.error('Error getting address:', error);
    res.status(500).json({
      error: 'Erro ao buscar endereço',
      message: error.message,
    });
  }
});

/**
 * POST /api/addresses
 * Cria um novo endereço
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const {
      label,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country = 'BR',
      reference,
      isDefault = false,
      recipientName,
      phone,
    } = req.body;

    // Validar campos obrigatórios
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      return res.status(400).json({
        error: 'Campos obrigatórios: street, number, neighborhood, city, state, zipCode',
      });
    }

    // Validar CEP (formato brasileiro)
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    if (!zipCodeRegex.test(zipCode)) {
      return res.status(400).json({ error: 'CEP inválido' });
    }

    // Se for marcado como padrão, remover padrão de outros endereços
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Criar endereço
    const address = await prisma.userAddress.create({
      data: {
        userId,
        label,
        street,
        number,
        complement,
        neighborhood,
        city,
        state: state.toUpperCase(),
        zipCode: zipCode.replace(/-/g, ''),
        country,
        reference,
        isDefault,
        recipientName,
        phone,
      },
    });

    res.status(201).json({ address });
  } catch (error: any) {
    console.error('Error creating address:', error);
    res.status(500).json({
      error: 'Erro ao criar endereço',
      message: error.message,
    });
  }
});

/**
 * PUT /api/addresses/:id
 * Atualiza um endereço
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se endereço existe e pertence ao usuário
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const {
      label,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      reference,
      isDefault,
      recipientName,
      phone,
    } = req.body;

    // Se for marcado como padrão, remover padrão de outros endereços
    if (isDefault && !existingAddress.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Validar CEP se fornecido
    if (zipCode) {
      const zipCodeRegex = /^\d{5}-?\d{3}$/;
      if (!zipCodeRegex.test(zipCode)) {
        return res.status(400).json({ error: 'CEP inválido' });
      }
    }

    // Montar dados de atualização
    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (street !== undefined) updateData.street = street;
    if (number !== undefined) updateData.number = number;
    if (complement !== undefined) updateData.complement = complement;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state.toUpperCase();
    if (zipCode !== undefined) updateData.zipCode = zipCode.replace(/-/g, '');
    if (country !== undefined) updateData.country = country;
    if (reference !== undefined) updateData.reference = reference;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (recipientName !== undefined) updateData.recipientName = recipientName;
    if (phone !== undefined) updateData.phone = phone;

    const address = await prisma.userAddress.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ address });
  } catch (error: any) {
    console.error('Error updating address:', error);
    res.status(500).json({
      error: 'Erro ao atualizar endereço',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/addresses/:id
 * Remove um endereço
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se endereço existe e pertence ao usuário
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.userAddress.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Endereço removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      error: 'Erro ao remover endereço',
      message: error.message,
    });
  }
});

/**
 * POST /api/addresses/:id/set-default
 * Define um endereço como padrão
 */
router.post('/:id/set-default', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se endereço existe e pertence ao usuário
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    // Remover padrão de outros endereços
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Definir este como padrão
    const address = await prisma.userAddress.update({
      where: { id: parseInt(id) },
      data: { isDefault: true },
    });

    res.json({ address });
  } catch (error: any) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      error: 'Erro ao definir endereço padrão',
      message: error.message,
    });
  }
});

export default router;

