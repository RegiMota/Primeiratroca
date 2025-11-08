import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, User, Package, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
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
  _count?: {
    messages: number;
  };
}

interface Stats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byCategory: Array<{ category: string; _count: number }>;
  byPriority: Array<{ priority: string; _count: number }>;
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

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Aberto', color: 'bg-blue-500', icon: AlertCircle },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500', icon: Clock },
  waiting_customer: { label: 'Aguardando Cliente', color: 'bg-orange-500', icon: Clock },
  resolved: { label: 'Resolvido', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: 'Fechado', color: 'bg-gray-500', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-500' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

const categoryConfig: Record<string, { label: string }> = {
  technical: { label: 'Técnico' },
  order: { label: 'Pedido' },
  payment: { label: 'Pagamento' },
  other: { label: 'Outro' },
};

export function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [admins, setAdmins] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    assignedToId: 'none',
    resolution: '',
  });
  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
    loadStats();
    loadAdmins();
  }, [statusFilter, categoryFilter, assignedToFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (assignedToFilter !== 'all') {
        if (assignedToFilter === 'unassigned') {
          params.assignedToId = 'unassigned';
        } else {
          params.assignedToId = assignedToFilter;
        }
      }

      const data = await adminAPI.getTickets(params);
      setTickets(data);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminAPI.getTicketStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      const users = await adminAPI.getUsers();
      const adminsList = users.filter((user: any) => user.isAdmin);
      setAdmins(adminsList);
    } catch (error: any) {
      console.error('Error loading admins:', error);
    }
  };

  const handleOpenTicket = async (ticket: Ticket) => {
    try {
      const fullTicket = await adminAPI.getTicketById(ticket.id);
      setSelectedTicket(fullTicket);
      setUpdateData({
        status: fullTicket.status,
        priority: fullTicket.priority,
        assignedToId: fullTicket.assignedTo?.id?.toString() || 'none',
        resolution: fullTicket.resolution || '',
      });
      setIsDialogOpen(true);
      loadMessages(fullTicket.id);
      connectSocket(fullTicket.id);
    } catch (error: any) {
      console.error('Error loading ticket:', error);
      toast.error('Erro ao carregar ticket');
    }
  };

  const loadMessages = async (ticketId: number) => {
    try {
      setLoadingMessages(true);
      const messagesData = await adminAPI.getChatMessages(ticketId);
      setMessages(messagesData);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectSocket = (ticketId: number) => {
    // Desconectar socket anterior se existir
    if (socket) {
      socket.disconnect();
    }

    const socketEnabled = import.meta.env.VITE_SOCKET_IO_ENABLED === 'true';
    const socketUrl = import.meta.env.VITE_SOCKET_IO_URL || 'http://localhost:5000';
    
    if (socketEnabled) {
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Conectado ao WebSocket para chat (admin)');
        newSocket.emit('chat:join', ticketId);
      });

      newSocket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => scrollToBottom(), 100);
      });

      newSocket.on('ticket:update', (updatedTicket: Ticket) => {
        setSelectedTicket((prev) => prev ? { ...prev, ...updatedTicket } : updatedTicket);
      });

      setSocket(newSocket);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !messageContent.trim()) return;

    try {
      setSendingMessage(true);
      const newMessage = await adminAPI.sendChatMessage(selectedTicket.id, {
        content: messageContent.trim(),
        messageType: 'text',
      });
      
      setMessages((prev) => [...prev, newMessage]);
      setMessageContent('');
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  // Cleanup socket quando o dialog fechar
  useEffect(() => {
    if (!isDialogOpen && socket) {
      socket.disconnect();
      setSocket(null);
      setMessages([]);
      setMessageContent('');
    }
  }, [isDialogOpen]);

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    try {
      const updatePayload: any = {};
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.priority) updatePayload.priority = updateData.priority;
      if (updateData.assignedToId === 'none' || updateData.assignedToId === '') {
        updatePayload.assignedToId = null;
      } else if (updateData.assignedToId) {
        updatePayload.assignedToId = parseInt(updateData.assignedToId);
      }
      if (updateData.resolution) updatePayload.resolution = updateData.resolution;

      await adminAPI.updateTicket(selectedTicket.id, updatePayload);
      toast.success('Ticket atualizado com sucesso!');
      setIsDialogOpen(false);
      loadTickets();
      loadStats();
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error('Erro ao atualizar ticket', {
        description: error.response?.data?.error || 'Tente novamente.',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets de Suporte</h1>
          <p className="mt-2 text-gray-600">Gerencie todos os tickets de suporte dos clientes</p>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Abertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byStatus.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resolvidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="waiting_customer">Aguardando Cliente</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="technical">Técnico</SelectItem>
              <SelectItem value="order">Pedido</SelectItem>
              <SelectItem value="payment">Pagamento</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por atribuição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unassigned">Não atribuídos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Tickets */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum ticket encontrado</h3>
            <p className="mt-2 text-gray-600">Tente ajustar os filtros para ver mais resultados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle;
            const statusInfo = statusConfig[ticket.status] || statusConfig.open;
            const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.medium;

            return (
              <Card
                key={ticket.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleOpenTicket(ticket)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">
                          {categoryConfig[ticket.category]?.label || ticket.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          {ticket.user.name}
                        </div>
                        {ticket.order && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Package className="h-4 w-4" />
                            Pedido #{ticket.order.id}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="outline" className={priorityInfo.color}>
                        {priorityInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-gray-600">{ticket.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket._count?.messages || 0} mensagens
                      </span>
                      {ticket.assignedTo ? (
                        <span>Atribuído a: {ticket.assignedTo.name}</span>
                      ) : (
                        <span className="text-orange-600">Não atribuído</span>
                      )}
                    </div>
                    <span>Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Edição e Chat */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="!max-w-[98vw] !w-[98vw] h-[95vh] max-h-[95vh] flex flex-col p-0 gap-0" 
          style={{ 
            width: '98vw', 
            maxWidth: '98vw', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            margin: 0
          } as React.CSSProperties}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Ticket #{selectedTicket?.id} - {selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Cliente: {selectedTicket?.user?.name} ({selectedTicket?.user?.email})
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(95vh - 120px)' }}>
              {/* Chat - Lado Esquerdo */}
              <div className="flex-1 flex flex-col overflow-hidden border-r p-6" style={{ minWidth: 0 }}>
                <div className="mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold mb-2">Conversa</h3>
                  {selectedTicket.status === 'closed' && (
                    <Badge variant="outline" className="text-xs">
                      Ticket fechado - não é possível enviar mensagens
                    </Badge>
                  )}
                </div>
                
                {/* Mensagens */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0"
                  style={{ overflowX: 'hidden' }}
                >
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOwnMessage = message.senderIsAdmin;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg p-3 break-words ${
                                isOwnMessage
                                  ? 'bg-blue-500'
                                  : 'bg-gray-100'
                              }`}
                              style={{ 
                                wordWrap: 'break-word', 
                                overflowWrap: 'break-word',
                                backgroundColor: isOwnMessage ? '#3b82f6' : '#f3f4f6',
                                color: isOwnMessage ? '#ffffff' : '#111827'
                              }}
                            >
                              {!isOwnMessage && (
                                <div className="mb-1 text-xs font-semibold" style={{ color: '#111827', opacity: 1 }}>
                                  {selectedTicket.user?.name}
                                </div>
                              )}
                              {isOwnMessage && (
                                <div className="mb-1 text-xs font-semibold" style={{ color: '#ffffff', opacity: 1 }}>
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
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input de Mensagem */}
                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-2 flex-shrink-0 mt-auto">
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={2}
                      className="flex-1 min-w-0 text-gray-900 placeholder:text-gray-500"
                      style={{ color: '#111827' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendingMessage}
                      className="flex-shrink-0"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Informações e Edição - Lado Direito */}
              <div className="w-96 flex-shrink-0 overflow-y-auto p-6 space-y-4 border-l bg-gray-50" style={{ minWidth: '400px', maxWidth: '400px' }}>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting_customer">Aguardando Cliente</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={updateData.priority}
                    onValueChange={(value) => setUpdateData({ ...updateData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Atribuir a</Label>
                  <Select
                    value={updateData.assignedToId || 'none'}
                    onValueChange={(value) => setUpdateData({ ...updateData, assignedToId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id.toString()}>
                          {admin.name} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resolution">Resolução</Label>
                  <Textarea
                    id="resolution"
                    value={updateData.resolution}
                    onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                    placeholder="Descreva a solução ou resposta final..."
                    rows={4}
                    className="text-gray-900 placeholder:text-gray-500"
                    style={{ color: '#111827' }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateTicket}>Salvar Alterações</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

