import { PrismaClient } from '@prisma/client';
import { emitNotification, emitAdminNotification } from '../socket';

const prisma = new PrismaClient();

export interface NotificationData {
  orderId?: number;
  productId?: number;
  variantId?: number;
  couponId?: number;
  [key: string]: any;
}

export class NotificationService {
  /**
   * Cria uma nova notificação no banco de dados
   */
  static async createNotification(
    userId: number,
    type: 'order' | 'stock' | 'system' | 'coupon' | 'promotion',
    title: string,
    message: string,
    data?: NotificationData
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null,
          isRead: false,
        },
      });

      // Parse JSON data if present
      const parsedNotification = {
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : undefined,
      };

      // Emitir notificação via WebSocket (se Socket.io estiver ativo)
      emitNotification(userId, parsedNotification);

      return parsedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notifica admins sobre um novo pedido
   */
  static async notifyNewOrder(orderId: number, orderTotal: number, userName: string) {
    try {
      // Buscar todos os admins
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
      });

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification(
            admin.id,
            'order',
            'Novo Pedido Recebido',
            `Pedido #${orderId} de ${userName} no valor de R$ ${orderTotal.toFixed(2)}`,
            { orderId, orderTotal }
          )
        )
      );

      // Emitir notificação para todos os admins via WebSocket
      const firstNotification = notifications[0];
      if (firstNotification) {
        emitAdminNotification({
          type: 'order',
          title: 'Novo Pedido Recebido',
          message: `Pedido #${orderId} de ${userName} no valor de R$ ${orderTotal.toFixed(2)}`,
          data: { orderId, orderTotal },
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying new order:', error);
      throw error;
    }
  }

  /**
   * Notifica cliente sobre atualização de status do pedido
   */
  static async notifyOrderStatusUpdate(
    userId: number,
    orderId: number,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const statusLabels: Record<string, string> = {
        pending: 'Pendente',
        processing: 'Em Processamento',
        shipped: 'Enviado',
        delivered: 'Entregue',
        cancelled: 'Cancelado',
      };

      const title = 'Status do Pedido Atualizado';
      const message = `Seu pedido #${orderId} foi atualizado de "${statusLabels[oldStatus] || oldStatus}" para "${statusLabels[newStatus] || newStatus}"`;

      return await this.createNotification(
        userId,
        'order',
        title,
        message,
        { orderId, oldStatus, newStatus }
      );
    } catch (error) {
      console.error('Error notifying order status update:', error);
      throw error;
    }
  }

  /**
   * Notifica admins sobre estoque baixo (produto) - v1.2
   */
  static async notifyLowStock(productId: number, productName: string, currentStock: number) {
    try {
      // Buscar todos os admins
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
      });

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification(
            admin.id,
            'stock',
            'Estoque Baixo',
            `O produto "${productName}" está com estoque baixo (${currentStock} unidades restantes)`,
            { productId, productName, currentStock }
          )
        )
      );

      // Emitir notificação para todos os admins via WebSocket
      const firstNotification = notifications[0];
      if (firstNotification) {
        emitAdminNotification({
          type: 'stock',
          title: 'Estoque Baixo',
          message: `O produto "${productName}" está com estoque baixo (${currentStock} unidades restantes)`,
          data: { productId, productName, currentStock },
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying low stock:', error);
      throw error;
    }
  }

  /**
   * Notifica admins sobre estoque baixo (variação) - v2.0
   */
  static async notifyLowStockVariant(
    variantId: number,
    productName: string,
    size?: string,
    color?: string,
    currentStock: number = 0,
    minStock: number = 0
  ) {
    try {
      // Buscar todos os admins
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
      });

      // Montar mensagem detalhada
      const variantInfo = [size, color].filter(Boolean).join(' / ') || 'Geral';
      const message = `A variação "${variantInfo}" do produto "${productName}" está com estoque baixo (${currentStock}/${minStock} unidades). Disponível: ${currentStock}`;

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification(
            admin.id,
            'stock',
            'Estoque Baixo - Variação',
            message,
            { variantId, productId: null, productName, size, color, currentStock, minStock }
          )
        )
      );

      // Emitir notificação para todos os admins via WebSocket
      const firstNotification = notifications[0];
      if (firstNotification) {
        emitAdminNotification({
          type: 'stock',
          title: 'Estoque Baixo - Variação',
          message: message,
          data: { variantId, productName, size, color, currentStock, minStock },
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying low stock variant:', error);
      throw error;
    }
  }

  /**
   * Notifica admins sobre cupom usado
   */
  static async notifyCouponUsed(
    couponId: number,
    couponCode: string,
    orderId: number,
    discountAmount: number
  ) {
    try {
      // Buscar todos os admins
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
      });

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        admins.map((admin) =>
          this.createNotification(
            admin.id,
            'coupon',
            'Cupom Utilizado',
            `O cupom "${couponCode}" foi utilizado no pedido #${orderId} com desconto de R$ ${discountAmount.toFixed(2)}`,
            { couponId, couponCode, orderId, discountAmount }
          )
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error notifying coupon used:', error);
      throw error;
    }
  }

  /**
   * Notifica usuário sobre sistema
   */
  static async notifySystem(userId: number, title: string, message: string, data?: NotificationData) {
    try {
      return await this.createNotification(
        userId,
        'system',
        title,
        message,
        data
      );
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }
}

