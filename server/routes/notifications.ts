import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { isRead, limit } = req.query;

    const where: any = { userId };
    
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit as string) : 50,
    });

    // Parse JSON data if present
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : undefined,
    }));

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// GET unread count for current user
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Erro ao buscar contagem de notificações não lidas' });
  }
});

// GET single notification
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Parse JSON data if present
    const formattedNotification = {
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : undefined,
    };

    res.json(formattedNotification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Erro ao buscar notificação' });
  }
});

// PATCH mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Parse JSON data if present
    const formattedNotification = {
      ...updatedNotification,
      data: updatedNotification.data ? JSON.parse(updatedNotification.data) : undefined,
    };

    res.json(formattedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// PATCH mark all notifications as read for current user
router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ 
      message: 'Todas as notificações foram marcadas como lidas',
      updated: result.count 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
  }
});

// DELETE notification
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
});

export default router;

