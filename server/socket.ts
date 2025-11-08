// Socket.io Server - Notificações em Tempo Real
// Suporta Socket.io e fallback para polling (desenvolvimento)

import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

/**
 * Inicializa o servidor Socket.io
 */
export function initSocketServer(httpServer: HttpServer): SocketServer | null {
  try {
    // Verificar se Socket.io deve ser usado
    // Por enquanto, vamos manter polling como padrão
    // Para ativar Socket.io, adicionar SOCKET_IO_ENABLED=true no .env
    
    if (process.env.SOCKET_IO_ENABLED !== 'true') {
      console.log('⚠️ Socket.io desabilitado. Usando polling como fallback.');
      return null;
    }

    io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log('✅ Cliente conectado via WebSocket:', socket.id);

      // Autenticação do socket (opcional)
      socket.on('authenticate', (token: string) => {
        // TODO: Verificar token JWT
        // Por enquanto, apenas aceita
        socket.data.authenticated = true;
        console.log('✅ Cliente autenticado:', socket.id);
      });

      // Quando usuário se conecta, adicionar a uma sala (userId)
      socket.on('subscribe', (userId: number) => {
        socket.join(`user:${userId}`);
        console.log(`✅ Cliente ${socket.id} entrou na sala user:${userId}`);
        
        // Se for admin, adicionar também à sala de admins
        // TODO: Verificar se o usuário é admin (necessário autenticação do socket)
        socket.join('admins');
      });

      // ============================================
      // CHAT - HANDLERS
      // ============================================
      
      // Entrar em uma sala de chat (ticket)
      socket.on('chat:join', (ticketId: number) => {
        socket.join(`ticket:${ticketId}`);
        console.log(`✅ Cliente ${socket.id} entrou no chat do ticket ${ticketId}`);
      });

      // Sair de uma sala de chat (ticket)
      socket.on('chat:leave', (ticketId: number) => {
        socket.leave(`ticket:${ticketId}`);
        console.log(`❌ Cliente ${socket.id} saiu do chat do ticket ${ticketId}`);
      });

      // Indicador de digitação
      socket.on('chat:typing', (data: { ticketId: number; userId: number; isTyping: boolean }) => {
        socket.to(`ticket:${data.ticketId}`).emit('chat:typing', data);
      });

      // Desconexão
      socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado:', socket.id);
      });
    });

    console.log('✅ Socket.io server inicializado');
    return io;
  } catch (error) {
    console.error('❌ Erro ao inicializar Socket.io:', error);
    console.log('⚠️ Usando polling como fallback.');
    return null;
  }
}

/**
 * Obtém a instância do Socket.io
 */
export function getSocketServer(): SocketServer | null {
  return io;
}

/**
 * Emite notificação para um usuário específico
 */
export function emitNotification(userId: number, notification: any): void {
  if (!io) {
    // Socket.io não está ativo, usar polling (já implementado no NotificationContext)
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`📤 Notificação enviada via WebSocket para usuário ${userId}`);
}

/**
 * Emite notificação para todos os admins
 */
export function emitAdminNotification(notification: any): void {
  if (!io) {
    // Socket.io não está ativo, usar polling
    return;
  }

  // Emitir para sala de admins (todos os admins conectados)
  io.to('admins').emit('notification', notification);
  console.log('📤 Notificação enviada via WebSocket para admins');
}

/**
 * Emite mensagem de chat para uma sala de ticket
 */
export function emitChatMessage(ticketId: number, message: any): void {
  if (!io) {
    // Socket.io não está ativo
    return;
  }

  io.to(`ticket:${ticketId}`).emit('chat:message', message);
  console.log(`📤 Mensagem de chat enviada via WebSocket para ticket ${ticketId}`);
}

/**
 * Emite atualização de status de ticket
 */
export function emitTicketUpdate(ticketId: number, ticket: any): void {
  if (!io) {
    return;
  }

  io.to(`ticket:${ticketId}`).emit('ticket:update', ticket);
  console.log(`📤 Atualização de ticket enviada via WebSocket para ticket ${ticketId}`);
}

/**
 * Emite novo ticket para admins
 */
export function emitNewTicket(ticket: any): void {
  if (!io) {
    return;
  }

  io.to('admins').emit('ticket:new', ticket);
  console.log('📤 Novo ticket enviado via WebSocket para admins');
}

/**
 * Verifica se Socket.io está ativo
 */
export function isSocketIOEnabled(): boolean {
  return io !== null;
}

