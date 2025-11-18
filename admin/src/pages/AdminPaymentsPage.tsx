import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../lib/api';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    label: 'Pendente',
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
    label: 'Aprovado',
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-300',
    label: 'Rejeitado',
  },
  refunded: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    label: 'Reembolsado',
  },
};

const paymentMethodConfig: Record<string, { label: string }> = {
  credit_card: { label: 'Cartão de Crédito' },
  pix: { label: 'PIX' },
  boleto: { label: 'Boleto' },
};

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [refunding, setRefunding] = useState<number | null>(null);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [statusFilter, gatewayFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (gatewayFilter !== 'all') params.gateway = gatewayFilter;
      
      const paymentsData = await adminAPI.getPayments(params);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Erro ao carregar pagamentos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminAPI.getPaymentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = async (paymentId: number) => {
    try {
      const payment = await adminAPI.getPaymentById(paymentId);
      setSelectedPayment(payment);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading payment details:', error);
      toast.error('Erro ao carregar detalhes do pagamento');
    }
  };

  const handleRefund = async (paymentId: number) => {
    if (!confirm('Tem certeza que deseja reembolsar este pagamento?')) {
      return;
    }

    if (refunding === paymentId) return;

    try {
      setRefunding(paymentId);
      await adminAPI.refundPayment(paymentId);
      
      // Atualizar pagamento na lista
      setPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, status: 'refunded' } : payment
        )
      );

      // Atualizar stats
      loadStats();

      toast.success('Reembolso processado com sucesso');
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar reembolso');
    } finally {
      setRefunding(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
          <p className="mt-2 text-gray-600">Gerencie todos os pagamentos do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">Todos os pagamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved || 0}</div>
              <p className="text-xs text-muted-foreground">Pagamentos aprovados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Valor total processado</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Gateway</label>
              <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os gateways" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="mock">Mock</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="asaas">Asaas</SelectItem>
                  <SelectItem value="pagseguro">PagSeguro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagamentos</CardTitle>
          <CardDescription>Visualize e gerencie todos os pagamentos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Carregando pagamentos...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Pedido</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Método</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Gateway</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const StatusIcon = statusConfig[payment.status]?.icon || Clock;
                    const statusConfigItem = statusConfig[payment.status] || statusConfig.pending;
                    const methodConfig = paymentMethodConfig[payment.paymentMethod] || {
                      label: payment.paymentMethod,
                    };

                    return (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">#{payment.id}</td>
                        <td className="px-4 py-3 text-sm">#{payment.orderId}</td>
                        <td className="px-4 py-3 text-sm">{methodConfig.label}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline">{payment.gateway}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusConfigItem.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfigItem.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(payment.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefund(payment.id)}
                                disabled={refunding === payment.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${refunding === payment.id ? 'animate-spin' : ''}`}
                                />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento #{selectedPayment?.id}</DialogTitle>
            <DialogDescription>
              Visualize todas as informações relacionadas a este pagamento
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Pedido</label>
                  <p className="text-lg font-semibold">#{selectedPayment.orderId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge
                      className={
                        statusConfig[selectedPayment.status]?.color || statusConfig.pending.color
                      }
                    >
                      {statusConfig[selectedPayment.status]?.label || 'Pendente'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Método de Pagamento</label>
                  <p className="text-lg">
                    {paymentMethodConfig[selectedPayment.paymentMethod]?.label ||
                      selectedPayment.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gateway</label>
                  <p className="text-lg">{selectedPayment.gateway}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Parcelas</label>
                  <p className="text-lg">
                    {selectedPayment.installments || 1}x
                  </p>
                </div>
                {selectedPayment.cardLastDigits && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cartão</label>
                    <p className="text-lg">**** {selectedPayment.cardLastDigits}</p>
                  </div>
                )}
                {selectedPayment.cardBrand && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bandeira</label>
                    <p className="text-lg">{selectedPayment.cardBrand}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                  <p className="text-lg">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                  <p className="text-lg">{formatDate(selectedPayment.updatedAt)}</p>
                </div>
              </div>

              {selectedPayment.statusDetail && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Detalhes do Status</label>
                  <p className="mt-1 text-sm text-gray-700">{selectedPayment.statusDetail}</p>
                </div>
              )}

              {selectedPayment.status === 'approved' && (
                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleRefund(selectedPayment.id);
                    }}
                    disabled={refunding === selectedPayment.id}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${refunding === selectedPayment.id ? 'animate-spin' : ''}`}
                    />
                    Processar Reembolso
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

