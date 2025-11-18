import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ticketsAPI } from '../lib/api';
import { TicketSearchParams } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

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
  _count?: {
    messages: number;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
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

export function TicketsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
  });

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    loadTickets();
  }, [isAuthenticated, authLoading, statusFilter, categoryFilter, setLocation]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: TicketSearchParams = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const data = await ticketsAPI.getAll(params);
      setTickets(data);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast.error('Erro ao carregar tickets', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await ticketsAPI.create(formData);
      toast.success('Ticket criado com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        subject: '',
        description: '',
        category: 'other',
        priority: 'medium',
      });
      loadTickets();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error('Erro ao criar ticket', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Tickets de Suporte</h1>
          <p className="mt-2 text-gray-600">Gerencie seus pedidos de suporte e acompanhe o atendimento</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou dúvida. Nossa equipe entrará em contato em breve.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Problema com meu pedido"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="order">Pedido</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva seu problema ou dúvida em detalhes..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Ticket</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
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
            <p className="mt-2 text-gray-600">
              {statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Crie um novo ticket para começar.'}
            </p>
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
                onClick={() => setLocation(`/tickets/${ticket.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        {categoryConfig[ticket.category]?.label || ticket.category}
                      </CardDescription>
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
                      {ticket.assignedTo && (
                        <span>Atribuído a: {ticket.assignedTo.name}</span>
                      )}
                    </div>
                    <span>
                      Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

