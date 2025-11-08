import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { emitNewTicket, emitTicketUpdate } from '../socket';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tickets - Lista todos os tickets do usuário autenticado
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { status, category, limit, offset } = req.query;

    const where: any = { userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets' });
  }
});

// GET /api/tickets/:id - Busca um ticket específico
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const ticketId = parseInt(req.params.id);
    const isAdmin = req.user?.isAdmin || false;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ...(isAdmin ? {} : { userId }), // Admin pode ver qualquer ticket
      },
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
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            ticket: {
              select: {
                id: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Erro ao buscar ticket' });
  }
});

// POST /api/tickets - Cria um novo ticket
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { subject, description, category, orderId, priority } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({ error: 'Assunto, descrição e categoria são obrigatórios' });
    }

    // Validar categoria
    const validCategories = ['technical', 'order', 'payment', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    // Validar prioridade
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Verificar se orderId existe (se fornecido)
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        subject,
        description,
        category,
        priority: ticketPriority,
        orderId: orderId ? parseInt(orderId) : null,
        status: 'open',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
      },
    });

    // Emitir novo ticket via WebSocket para admins
    emitNewTicket(ticket);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
});

// PATCH /api/tickets/:id - Atualiza um ticket (cliente pode atualizar, admin pode atribuir/resolver)
router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const isAdmin = req.user?.isAdmin || false;
    const ticketId = parseInt(req.params.id);
    const { status, priority, assignedToId, resolution } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        ...(isAdmin ? {} : { userId }), // Cliente só pode atualizar seus próprios tickets
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const updateData: any = {};

    // Cliente pode atualizar apenas status para "waiting_customer"
    if (!isAdmin) {
      if (status === 'waiting_customer') {
        updateData.status = status;
      }
    } else {
      // Admin pode atualizar status, prioridade, atribuição e resolução
      if (status && ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].includes(status)) {
        updateData.status = status;

        // Se mudou para resolved, registrar resolução
        if (status === 'resolved' && !ticket.resolvedAt) {
          updateData.resolvedAt = new Date();
          updateData.resolvedById = userId;
          if (resolution) {
            updateData.resolution = resolution;
          }
        }

        // Se mudou para closed e estava resolved, atualizar
        if (status === 'closed' && ticket.status === 'resolved') {
          updateData.resolvedAt = ticket.resolvedAt;
          updateData.resolvedById = ticket.resolvedById;
        }
      }

      if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
        updateData.priority = priority;
      }

      if (assignedToId !== undefined) {
        if (assignedToId === null || assignedToId === '') {
          updateData.assignedToId = null;
        } else {
          // Verificar se o usuário é admin
          const assignedUser = await prisma.user.findFirst({
            where: {
              id: parseInt(assignedToId),
              isAdmin: true,
            },
          });

          if (!assignedUser) {
            return res.status(400).json({ error: 'Usuário atribuído deve ser um administrador' });
          }

          updateData.assignedToId = parseInt(assignedToId);

          // Se é a primeira atribuição e ainda não tem firstResponseAt, registrar
          if (!ticket.assignedToId && !ticket.firstResponseAt) {
            updateData.firstResponseAt = new Date();
          }

          // Se mudou para in_progress e não tinha status, atualizar
          if (ticket.status === 'open' && !status) {
            updateData.status = 'in_progress';
          }
        }
      }

      if (resolution) {
        updateData.resolution = resolution;
      }
    }

    const updatedTicket = await prisma.ticket.update({
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
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
      },
    });

    // Emitir atualização de ticket via WebSocket
    emitTicketUpdate(ticketId, updatedTicket);

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Erro ao atualizar ticket' });
  }
});

// GET /api/tickets/admin/all - Lista todos os tickets (admin only)
router.get('/admin/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { status, category, assignedToId, limit, offset } = req.query;

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (assignedToId && assignedToId !== 'all') {
      if (assignedToId === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = parseInt(assignedToId as string);
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
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
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets' });
  }
});

// GET /api/tickets/admin/stats - Estatísticas de tickets (admin only)
router.get('/admin/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [total, open, inProgress, resolved, closed, byCategory, byPriority] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'open' } }),
      prisma.ticket.count({ where: { status: 'in_progress' } }),
      prisma.ticket.count({ where: { status: 'resolved' } }),
      prisma.ticket.count({ where: { status: 'closed' } }),
      prisma.ticket.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ]);

    res.json({
      total,
      byStatus: {
        open,
        inProgress,
        resolved,
        closed,
      },
      byCategory,
      byPriority,
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de tickets' });
  }
});

export default router;

