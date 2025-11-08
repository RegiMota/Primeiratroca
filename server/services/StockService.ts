// StockService - Serviço para gerenciamento de estoque avançado
// Versão 2.0 - Controle de estoque por variação

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';

const prisma = new PrismaClient();

interface CreateVariantData {
  productId: number;
  size?: string;
  color?: string;
  stock?: number;
  minStock?: number;
  price?: number;
  isActive?: boolean;
}

interface UpdateStockData {
  variantId: number;
  quantity: number;
  type: 'sale' | 'purchase' | 'adjustment' | 'reserve' | 'release' | 'return';
  orderId?: number;
  reason?: string;
  description?: string;
  userId?: number;
}

export class StockService {
  // Criar variação de produto
  static async createVariant(data: CreateVariantData) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        size: data.size || null,
        color: data.color || null,
        stock: data.stock || 0,
        minStock: data.minStock || 5,
        price: data.price || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return variant;
  }

  // Obter todas as variações de um produto
  static async getVariantsByProduct(productId: number) {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: [{ size: 'asc' }, { color: 'asc' }],
    });

    return variants;
  }

  // Obter variação específica
  static async getVariantById(id: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Últimas 10 movimentações
        },
      },
    });

    return variant;
  }

  // Obter variação por produto, tamanho e cor
  static async getVariantByProductSizeColor(
    productId: number,
    size?: string,
    color?: string
  ) {
    // Buscar usando where para campos únicos compostos
    const variant = await prisma.productVariant.findFirst({
      where: {
        productId,
        size: size || null,
        color: color || null,
      },
    });

    return variant;
  }

  // Atualizar variação
  static async updateVariant(id: number, data: Partial<CreateVariantData>) {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        size: data.size,
        color: data.color,
        stock: data.stock,
        minStock: data.minStock,
        price: data.price,
        isActive: data.isActive,
      },
    });

    return variant;
  }

  // Deletar variação
  static async deleteVariant(id: number) {
    await prisma.productVariant.delete({
      where: { id },
    });
  }

  // Atualizar estoque (cria movimento automaticamente)
  static async updateStock(data: UpdateStockData) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
    });

    if (!variant) {
      throw new Error('Variação não encontrada');
    }

    // Calcular novo estoque
    let newStock = variant.stock;
    let newReservedStock = variant.reservedStock;

    switch (data.type) {
      case 'sale':
        // Venda: reduz estoque
        newStock -= Math.abs(data.quantity);
        break;
      case 'purchase':
        // Compra: adiciona estoque
        newStock += Math.abs(data.quantity);
        break;
      case 'adjustment':
        // Ajuste manual: pode ser positivo ou negativo
        newStock += data.quantity;
        break;
      case 'reserve':
        // Reservar durante checkout
        newReservedStock += Math.abs(data.quantity);
        newStock -= Math.abs(data.quantity);
        break;
      case 'release':
        // Liberar reserva (checkout cancelado/timeout)
        newReservedStock -= Math.abs(data.quantity);
        newStock += Math.abs(data.quantity);
        break;
      case 'return':
        // Devolução: retorna ao estoque
        newStock += Math.abs(data.quantity);
        break;
    }

    // Validar estoque não negativo
    if (newStock < 0) {
      throw new Error('Estoque insuficiente');
    }

    if (newReservedStock < 0) {
      throw new Error('Estoque reservado inválido');
    }

    // Atualizar estoque e criar movimento em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar variação
      const updatedVariant = await tx.productVariant.update({
        where: { id: data.variantId },
        data: {
          stock: newStock,
          reservedStock: newReservedStock,
        },
      });

      // Criar movimento
      const movement = await tx.stockMovement.create({
        data: {
          variantId: data.variantId,
          type: data.type,
          quantity: data.quantity,
          orderId: data.orderId || null,
          reason: data.reason || null,
          description: data.description || null,
          userId: data.userId || null,
        },
      });

      return { variant: updatedVariant, movement };
    });

    // Verificar se estoque está abaixo do mínimo e criar notificação se necessário (v2.0)
    if (result.variant.stock <= result.variant.minStock) {
      try {
        // Buscar informações do produto para a notificação
        const product = await prisma.product.findUnique({
          where: { id: result.variant.productId },
          select: { name: true },
        });

        if (product) {
          await NotificationService.notifyLowStockVariant(
            result.variant.id,
            product.name,
            result.variant.size || undefined,
            result.variant.color || undefined,
            result.variant.stock,
            result.variant.minStock
          );
        }
      } catch (error) {
        console.error('Error sending low stock notification:', error);
        // Não falhar a operação se a notificação falhar
      }
    }

    return result;
  }

  // Reservar estoque durante checkout
  static async reserveStock(
    variantId: number,
    quantity: number,
    orderId: number,
    timeoutMinutes: number = 15
  ) {
    // Verificar disponibilidade
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new Error('Variação não encontrada');
    }

    const availableStock = variant.stock - variant.reservedStock;

    if (availableStock < quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${availableStock}, Solicitado: ${quantity}`);
    }

    // Reservar estoque
    await this.updateStock({
      variantId,
      quantity,
      type: 'reserve',
      orderId,
      reason: 'Reserva durante checkout',
      description: `Estoque reservado por ${timeoutMinutes} minutos`,
    });

    // Programar liberação automática (será implementado com jobs agendados)
    // setTimeout(() => this.releaseReservedStock(variantId, quantity, orderId), timeoutMinutes * 60 * 1000);
  }

  // Liberar estoque reservado
  static async releaseStock(variantId: number, quantity: number, orderId?: number) {
    await this.updateStock({
      variantId,
      quantity,
      type: 'release',
      orderId,
      reason: 'Liberação de reserva',
      description: 'Estoque reservado foi liberado',
    });
  }

  // Confirmar venda (converte reserva em venda)
  static async confirmSale(variantId: number, quantity: number, orderId: number) {
    // Primeiro liberar a reserva, depois fazer a venda
    await this.releaseStock(variantId, quantity, orderId);
    
    await this.updateStock({
      variantId,
      quantity: -quantity, // Negativo para venda
      type: 'sale',
      orderId,
      reason: 'Venda confirmada',
      description: 'Produto vendido e removido do estoque',
    });
  }

  // Obter histórico de movimentações
  static async getMovementHistory(
    variantId?: number,
    limit: number = 50,
    offset: number = 0
  ) {
    const where = variantId ? { variantId } : {};

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return movements;
  }

  // Verificar produtos com estoque baixo
  static async getLowStockVariants(minStock?: number) {
    const where: any = {
      isActive: true,
    };

    if (minStock !== undefined) {
      where.stock = { lte: minStock };
    } else {
      // Buscar variantes onde stock <= minStock
      const allVariants = await prisma.productVariant.findMany({
        where: { isActive: true },
      });
      
      const lowStockVariants = allVariants.filter(
        (v) => v.stock <= v.minStock
      );

      const variantIds = lowStockVariants.map((v) => v.id);

      where.id = { in: variantIds };
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { stock: 'asc' },
      ],
    });

    return variants;
  }

  // Obter estatísticas de estoque
  static async getStockStats() {
    const totalVariants = await prisma.productVariant.count({
      where: { isActive: true },
    });

    const variantsWithStock = await prisma.productVariant.count({
      where: {
        isActive: true,
        stock: { gt: 0 },
      },
    });

    // Contar variantes com estoque baixo
    const allVariantsForLowStock = await prisma.productVariant.findMany({
      where: { isActive: true },
      select: { id: true, stock: true, minStock: true },
    });

    const lowStockVariants = allVariantsForLowStock.filter(
      (v) => v.stock <= v.minStock
    ).length;

    const totalStock = await prisma.productVariant.aggregate({
      where: { isActive: true },
      _sum: {
        stock: true,
      },
    });

    const totalReserved = await prisma.productVariant.aggregate({
      where: { isActive: true },
      _sum: {
        reservedStock: true,
      },
    });

    return {
      totalVariants,
      variantsWithStock,
      lowStockVariants,
      outOfStockVariants: totalVariants - variantsWithStock,
      totalStock: totalStock._sum.stock || 0,
      totalReserved: totalReserved._sum.reservedStock || 0,
      availableStock: (totalStock._sum.stock || 0) - (totalReserved._sum.reservedStock || 0),
    };
  }
}

