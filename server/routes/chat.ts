import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { emitChatMessage, emitTicketUpdate } from '../socket';

const router = Router();
const prisma = new PrismaClient();

// GET /api/chat/:ticketId/messages - Lista mensagens de um ticket
router.get('/:ticketId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const isAdmin = req.user?.isAdmin || false;
    const ticketId = parseInt(req.params.ticketId);

    // Verificar se o ticket existe e se o usuário tem acesso
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ...(isAdmin ? {} : { userId }), // Admin pode ver qualquer ticket
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// POST /api/chat/:ticketId/messages - Envia uma nova mensagem
router.post('/:ticketId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const isAdmin = req.user?.isAdmin || false;
    const ticketId = parseInt(req.params.ticketId);
    const { content, messageType, fileUrl, fileName, fileSize } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }

    // Verificar se o ticket existe e se o usuário tem acesso
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ...(isAdmin ? {} : { userId }), // Admin pode ver qualquer ticket
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar se o ticket está fechado
    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Não é possível enviar mensagens em tickets fechados' });
    }

    // Criar mensagem
    const message = await prisma.chatMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderIsAdmin: isAdmin,
        content: content.trim(),
        messageType: messageType || 'text',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize ? parseInt(fileSize) : null,
      },
    });

    // Atualizar status do ticket se necessário
    const updateData: any = {};

    // Se o ticket estava "waiting_customer" e admin respondeu, mudar para "in_progress"
    if (isAdmin && ticket.status === 'waiting_customer') {
      updateData.status = 'in_progress';
    }

    // Se o ticket estava "open" ou "in_progress" e cliente respondeu, mudar para "waiting_customer"
    if (!isAdmin && (ticket.status === 'open' || ticket.status === 'in_progress')) {
      updateData.status = 'waiting_customer';
    }

    // Registrar primeira resposta se for admin
    if (isAdmin && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    // Atualizar ticket se necessário
    let updatedTicket = null;
    if (Object.keys(updateData).length > 0) {
      updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Emitir atualização de ticket via WebSocket
      if (updatedTicket) {
        emitTicketUpdate(ticketId, updatedTicket);
      }
    }

    // Emitir mensagem via WebSocket
    emitChatMessage(ticketId, message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Erro ao criar mensagem' });
  }
});

// PATCH /api/chat/messages/:id/read - Marca mensagem como lida
router.patch('/messages/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const isAdmin = req.user?.isAdmin || false;
    const messageId = parseInt(req.params.id);

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        ticket: true,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Verificar se o usuário tem acesso ao ticket
    const hasAccess = isAdmin || message.ticket.userId === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Só marcar como lida se não foi enviada pelo próprio usuário
    if (message.senderId !== userId && !message.isRead) {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
  }
});

// PATCH /api/chat/:ticketId/messages/read-all - Marca todas as mensagens do ticket como lidas
router.patch('/:ticketId/messages/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const isAdmin = req.user?.isAdmin || false;
    const ticketId = parseInt(req.params.ticketId);

    // Verificar se o ticket existe e se o usuário tem acesso
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ...(isAdmin ? {} : { userId }),
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Marcar todas as mensagens não lidas do ticket como lidas (exceto as enviadas pelo próprio usuário)
    await prisma.chatMessage.updateMany({
      where: {
        ticketId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
});

export default router;

