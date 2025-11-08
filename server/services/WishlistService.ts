// WishlistService - Serviço para gerenciamento de wishlist
// Versão 2.0 - Sistema de Wishlist/Favoritos

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateWishlistItemData {
  userId: number;
  productId: number;
  variantId?: number;
  notes?: string;
  priority?: number;
  isPublic?: boolean;
}

export interface UpdateWishlistItemData {
  notes?: string;
  priority?: number;
  isPublic?: boolean;
  shareCode?: string;
}

export class WishlistService {
  /**
   * Adiciona item à wishlist
   */
  static async addItem(data: CreateWishlistItemData) {
    try {
      // Verificar se já existe
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          userId: data.userId,
          productId: data.productId,
          variantId: data.variantId || null,
        },
      });

      if (existing) {
        throw new Error('Item já está na wishlist');
      }

      // Gerar shareCode se isPublic = true
      let shareCode: string | undefined = undefined;
      if (data.isPublic) {
        // Gerar código único baseado em timestamp e random
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        shareCode = `wish_${timestamp}_${random}`.substring(0, 50);
      }

      const item = await prisma.wishlistItem.create({
        data: {
          userId: data.userId,
          productId: data.productId,
          variantId: data.variantId,
          notes: data.notes,
          priority: data.priority || 0,
          isPublic: data.isPublic || false,
          shareCode,
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
            },
          },
          variant: true,
        },
      });

      // Format item to convert Decimal to number
      return {
        ...item,
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
        },
      };
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove item da wishlist
   */
  static async removeItem(userId: number, itemId: number) {
    try {
      // Verificar se o item pertence ao usuário
      const item = await prisma.wishlistItem.findFirst({
        where: {
          id: itemId,
          userId,
        },
      });

      if (!item) {
        throw new Error('Item não encontrado ou não pertence ao usuário');
      }

      await prisma.wishlistItem.delete({
        where: { id: itemId },
      });

      return { message: 'Item removido da wishlist' };
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      throw error;
    }
  }

  /**
   * Atualiza item da wishlist
   */
  static async updateItem(userId: number, itemId: number, data: UpdateWishlistItemData) {
    try {
      // Verificar se o item pertence ao usuário
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          id: itemId,
          userId,
        },
      });

      if (!existing) {
        throw new Error('Item não encontrado ou não pertence ao usuário');
      }

      // Gerar shareCode se isPublic mudou para true e ainda não tem
      let shareCode = data.shareCode;
      if (data.isPublic && !existing.shareCode) {
        // Gerar código único baseado em timestamp e random
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        shareCode = `wish_${timestamp}_${random}`.substring(0, 50);
      } else if (!data.isPublic) {
        // Remover shareCode se isPublic = false
        shareCode = null;
      }

      const item = await prisma.wishlistItem.update({
        where: { id: itemId },
        data: {
          notes: data.notes,
          priority: data.priority,
          isPublic: data.isPublic,
          shareCode,
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
            },
          },
          variant: true,
        },
      });

      // Format item to convert Decimal to number
      return {
        ...item,
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
        },
      };
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      throw error;
    }
  }

  /**
   * Lista itens da wishlist do usuário
   */
  static async getUserWishlist(userId: number, limit?: number, offset?: number) {
    try {
      const items = await prisma.wishlistItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              variants: {
                where: { isActive: true },
              },
            },
          },
          variant: true,
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit || 50,
        skip: offset || 0,
      });

      const total = await prisma.wishlistItem.count({
        where: { userId },
      });

      // Format items to convert Decimal to number
      const formattedItems = items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
        },
      }));

      return {
        items: formattedItems,
        total,
        limit: limit || 50,
        offset: offset || 0,
      };
    } catch (error) {
      console.error('Error getting user wishlist:', error);
      throw error;
    }
  }

  /**
   * Busca wishlist por código de compartilhamento
   */
  static async getWishlistByShareCode(shareCode: string) {
    try {
      const item = await prisma.wishlistItem.findUnique({
        where: { shareCode },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              variants: {
                where: { isActive: true },
              },
            },
          },
          variant: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!item || !item.isPublic) {
        throw new Error('Wishlist não encontrada ou não é pública');
      }

      // Format item to convert Decimal to number
      return {
        ...item,
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
        },
      };
    } catch (error) {
      console.error('Error getting wishlist by share code:', error);
      throw error;
    }
  }

  /**
   * Verifica se produto está na wishlist do usuário
   */
  static async isInWishlist(userId: number, productId: number, variantId?: number) {
    try {
      const item = await prisma.wishlistItem.findFirst({
        where: {
          userId,
          productId,
          variantId: variantId || null,
        },
      });

      return !!item;
    } catch (error) {
      console.error('Error checking if product is in wishlist:', error);
      return false;
    }
  }

  /**
   * Obtém item da wishlist por ID
   */
  static async getItemById(itemId: number, userId?: number) {
    try {
      const where: any = { id: itemId };
      if (userId) {
        where.userId = userId;
      }

      const item = await prisma.wishlistItem.findFirst({
        where,
        include: {
          product: {
            include: {
              images: true,
              category: true,
              variants: {
                where: { isActive: true },
              },
            },
          },
          variant: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!item) {
        throw new Error('Item não encontrado');
      }

      // Format item to convert Decimal to number
      return {
        ...item,
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
        },
      };
    } catch (error) {
      console.error('Error getting wishlist item:', error);
      throw error;
    }
  }

  /**
   * Move item para o topo (aumenta prioridade)
   */
  static async moveToTop(userId: number, itemId: number) {
    try {
      // Buscar maior prioridade atual
      const maxPriority = await prisma.wishlistItem.aggregate({
        where: { userId },
        _max: { priority: true },
      });

      const newPriority = (maxPriority._max.priority || 0) + 1;

      return await this.updateItem(userId, itemId, { priority: newPriority });
    } catch (error) {
      console.error('Error moving item to top:', error);
      throw error;
    }
  }

  /**
   * Remove múltiplos itens da wishlist
   */
  static async removeMultiple(userId: number, itemIds: number[]) {
    try {
      const deleted = await prisma.wishlistItem.deleteMany({
        where: {
          id: { in: itemIds },
          userId,
        },
      });

      return { message: `${deleted.count} item(ns) removido(s) da wishlist` };
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas da wishlist do usuário
   */
  static async getWishlistStats(userId: number) {
    try {
      const [total, byPriority, byCategory] = await Promise.all([
        prisma.wishlistItem.count({ where: { userId } }),
        prisma.wishlistItem.groupBy({
          by: ['priority'],
          where: { userId },
          _count: true,
        }),
        prisma.wishlistItem.findMany({
          where: { userId },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        }).then((items) => {
          const categoryMap = new Map<string, number>();
          items.forEach((item) => {
            const categoryName = item.product.category.name;
            categoryMap.set(
              categoryName,
              (categoryMap.get(categoryName) || 0) + 1
            );
          });
          return Array.from(categoryMap.entries()).map(([name, count]) => ({
            category: name,
            count,
          }));
        }),
      ]);

      return {
        total,
        byPriority: byPriority.map((p) => ({
          priority: p.priority,
          count: p._count,
        })),
        byCategory,
      };
    } catch (error) {
      console.error('Error getting wishlist stats:', error);
      throw error;
    }
  }
}

