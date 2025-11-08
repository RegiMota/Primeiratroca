import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, Paperclip, Loader2 } from 'lucide-react';
import { ticketsAPI, chatAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  order?: {
    id: number;
    status: string;
    total: number;
  };
}

interface ChatMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderIsAdmin: boolean;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'bg-blue-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500' },
  waiting_customer: { label: 'Aguardando Cliente', color: 'bg-orange-500' },
  resolved: { label: 'Resolvido', color: 'bg-green-500' },
  closed: { label: 'Fechado', color: 'bg-gray-500' },
};

export function TicketDetailPage() {
  const [, params] = useRoute('/tickets/:id');
  const ticketId = params?.id ? parseInt(params.id) : null;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !ticketId) return;

    loadTicket();
    loadMessages();

    // Conectar ao WebSocket se disponível
    const socketEnabled = import.meta.env.VITE_SOCKET_IO_ENABLED === 'true';
    
    const getSocketUrl = async () => {
      if (import.meta.env.VITE_SOCKET_IO_URL) {
        return import.meta.env.VITE_SOCKET_IO_URL;
      }
      // Usar a função helper do api.ts para detectar a URL correta
      const { getServerUrl } = await import('../lib/api');
      return getServerUrl('5000');
    };
    
    if (socketEnabled) {
      getSocketUrl().then(socketUrl => {
        const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Conectado ao WebSocket para chat');
        if (ticketId) {
          newSocket.emit('chat:join', ticketId);
        }
      });

      newSocket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      newSocket.on('ticket:update', (updatedTicket: Ticket) => {
        setTicket(updatedTicket);
      });

        setSocket(newSocket);

        return () => {
          if (ticketId) {
            newSocket.emit('chat:leave', ticketId);
          }
          newSocket.disconnect();
        };
      }).catch(error => {
        console.error('Erro ao conectar WebSocket:', error);
      });
    }

    // Polling como fallback (a cada 5 segundos)
    const pollingInterval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      clearInterval(pollingInterval);
      if (socket) {
        if (ticketId) {
          socket.emit('chat:leave', ticketId);
        }
        socket.disconnect();
      }
    };
  }, [ticketId, isAuthenticated, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = async () => {
    if (!ticketId) return;

    try {
      const data = await ticketsAPI.getById(ticketId);
      setTicket(data);
    } catch (error: any) {
      console.error('Error loading ticket:', error);
      toast.error('Erro ao carregar ticket', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const loadMessages = async () => {
    if (!ticketId) return;

    try {
      const data = await chatAPI.getMessages(ticketId);
      setMessages(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageContent.trim() || !ticketId) return;

    try {
      setSending(true);
      const newMessage = await chatAPI.sendMessage(ticketId, {
        content: messageContent.trim(),
        messageType: 'text',
      });

      setMessages((prev) => [...prev, newMessage]);
      setMessageContent('');
      scrollToBottom();

      // Se não está usando WebSocket, recarregar mensagens
      if (!socket) {
        setTimeout(() => loadMessages(), 1000);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated || !ticketId) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Carregando ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Ticket não encontrado</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[ticket.status] || statusConfig.open;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            {ticket.assignedTo && (
              <span className="text-sm text-gray-600">
                Atribuído a: {ticket.assignedTo.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col">
            <CardHeader>
              <CardTitle>Conversa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              {/* Mensagens */}
              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-4 overflow-y-auto p-6"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const isAdmin = message.senderIsAdmin;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 break-words ${
                            isOwnMessage
                              ? 'bg-blue-500'
                              : isAdmin
                              ? 'bg-purple-100'
                              : 'bg-gray-100'
                          }`}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            backgroundColor: isOwnMessage ? '#3b82f6' : isAdmin ? '#f3e8ff' : '#f3f4f6',
                            color: isOwnMessage ? '#ffffff' : '#111827'
                          }}
                        >
                          {isAdmin && !isOwnMessage && (
                            <div className="mb-1 text-xs font-semibold" style={{ color: '#111827', opacity: 1 }}>
                              Admin
                            </div>
                          )}
                          <p className="text-sm" style={{ color: isOwnMessage ? '#ffffff' : '#111827', opacity: 1, fontWeight: 400 }}>
                            {message.content}
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: isOwnMessage ? '#e0f2fe' : '#4b5563', opacity: 1 }}
                          >
                            {new Date(message.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem */}
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={2}
                    className="flex-1 resize-none text-gray-900 placeholder:text-gray-500"
                    style={{ color: '#111827' }}
                    disabled={sending || ticket.status === 'closed'}
                  />
                  <Button type="submit" disabled={sending || !messageContent.trim() || ticket.status === 'closed'}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {ticket.status === 'closed' && (
                  <p className="mt-2 text-sm text-gray-500">
                    Este ticket está fechado. Não é possível enviar novas mensagens.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Ticket */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Categoria</p>
                <p className="text-sm text-gray-600 capitalize">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Prioridade</p>
                <p className="text-sm text-gray-600 capitalize">{ticket.priority}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Criado em</p>
                <p className="text-sm text-gray-600">
                  {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              {ticket.order && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Pedido Relacionado</p>
                  <p className="text-sm text-gray-600">
                    Pedido #{ticket.order.id} - {ticket.order.status}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descrição Inicial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{ticket.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

