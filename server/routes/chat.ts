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

    console.log('📨 Nova mensagem recebida:', {
      ticketId,
      userId,
      isAdmin,
      hasContent: !!content,
      hasFileUrl: !!fileUrl,
      fileName,
      fileSize,
      messageType,
      fileUrlLength: fileUrl ? fileUrl.length : 0,
    });

    // Permitir mensagens apenas com arquivo ou apenas com texto, mas pelo menos um deve existir
    if ((!content || content.trim().length === 0) && !fileUrl) {
      return res.status(400).json({ error: 'Conteúdo da mensagem ou arquivo é obrigatório' });
    }

    // Validar tamanho do fileUrl (base64 pode ser muito grande)
    if (fileUrl && fileUrl.length > 50 * 1024 * 1024) { // 50MB em caracteres
      console.error('❌ Arquivo muito grande:', fileUrl.length);
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 10MB.' });
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
    const messageData: any = {
      ticketId,
      senderId: userId,
      senderIsAdmin: isAdmin,
      content: content ? content.trim() : (fileUrl ? `Anexo: ${fileName || 'arquivo'}` : ''),
      messageType: messageType || (fileUrl ? 'file' : 'text'),
    };

    // Adicionar campos de arquivo apenas se existirem
    if (fileUrl) {
      messageData.fileUrl = fileUrl;
    }
    if (fileName) {
      messageData.fileName = fileName;
    }
    if (fileSize) {
      messageData.fileSize = parseInt(fileSize.toString());
    }

    console.log('💾 Criando mensagem no banco de dados...');
    const message = await prisma.chatMessage.create({
      data: messageData,
    });
    console.log('✅ Mensagem criada com sucesso:', message.id);

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
  } catch (error: any) {
    console.error('❌ Erro ao criar mensagem:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      body: req.body ? { 
        ...req.body, 
        fileUrl: req.body.fileUrl ? `${req.body.fileUrl.substring(0, 50)}... (${req.body.fileUrl.length} chars)` : null,
        contentLength: req.body.content?.length || 0,
      } : null,
    });
    
    // Erro específico do Prisma para campos muito grandes
    if (error.code === 'P2000' || error.message?.includes('too large') || error.message?.includes('exceeds')) {
      return res.status(400).json({
        error: 'Arquivo muito grande',
        details: 'O arquivo excede o tamanho máximo permitido. Tente comprimir a imagem antes de enviar.',
      });
    }

    res.status(500).json({
      error: 'Erro ao criar mensagem',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
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

