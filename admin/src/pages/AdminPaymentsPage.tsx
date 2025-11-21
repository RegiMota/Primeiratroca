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
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
  const [syncing, setSyncing] = useState<number | null>(null);
  const [refundConfirmation, setRefundConfirmation] = useState<string>('');
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundOrderIdInput, setRefundOrderIdInput] = useState<string>('');
  const [refundError, setRefundError] = useState<string>('');

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
      setRefundConfirmation(''); // Limpar confirmação ao abrir modal
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error loading payment details:', error);
      toast.error('Erro ao carregar detalhes do pagamento');
    }
  };

  const handleRefundClick = (paymentId: number, orderId: number) => {
    // Abrir dialog de confirmação de reembolso
    // Manter os dados do pagamento selecionado, mas atualizar id e orderId
    const currentPayment = payments.find(p => p.id === paymentId) || selectedPayment;
    setSelectedPayment({ ...currentPayment, id: paymentId, orderId });
    setRefundOrderIdInput('');
    setRefundError('');
    setIsRefundDialogOpen(true);
  };

  const handleRefundConfirm = async () => {
    if (!selectedPayment) return;

    const paymentId = selectedPayment.id;
    const orderId = selectedPayment.orderId;
    const inputValue = refundOrderIdInput.trim();

    // Validar se o número digitado corresponde ao número do pedido
    const expectedOrderId = orderId.toString();
    
    if (inputValue !== expectedOrderId) {
      setRefundError(`Número do pedido incorreto. Digite ${expectedOrderId} para confirmar.`);
      return;
    }

    if (refunding === paymentId) return;

    try {
      setRefunding(paymentId);
      setRefundError('');
      
      await adminAPI.refundPayment(paymentId);
      
      // Atualizar pagamento na lista
      setPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, status: 'refunded' } : payment
        )
      );

      // Se estiver visualizando detalhes, atualizar também
      if (selectedPayment?.id === paymentId) {
        setSelectedPayment({ ...selectedPayment, status: 'refunded' });
      }

      // Limpar campos e fechar dialogs
      setRefundOrderIdInput('');
      setIsRefundDialogOpen(false);
      setIsDetailDialogOpen(false);

      // Atualizar stats
      loadStats();

      toast.success('Reembolso processado com sucesso');
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      setRefundError(error.response?.data?.error || 'Erro ao processar reembolso');
      toast.error(error.response?.data?.error || 'Erro ao processar reembolso');
    } finally {
      setRefunding(null);
    }
  };

  const handleSync = async (paymentId: number) => {
    if (syncing === paymentId) return;

    try {
      setSyncing(paymentId);
      const updatedPayment = await adminAPI.syncPayment(paymentId);
      
      // Atualizar pagamento na lista
      setPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === paymentId ? updatedPayment : payment
        )
      );

      // Se estiver visualizando detalhes, atualizar também
      if (selectedPayment?.id === paymentId) {
        setSelectedPayment(updatedPayment);
      }

      // Atualizar stats
      loadStats();

      toast.success('Pagamento sincronizado com sucesso');
    } catch (error: any) {
      console.error('Error syncing payment:', error);
      toast.error(error.response?.data?.error || 'Erro ao sincronizar pagamento');
    } finally {
      setSyncing(null);
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
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.gateway === 'asaas' && payment.gatewayPaymentId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSync(payment.id)}
                                disabled={syncing === payment.id}
                                className="text-blue-600 hover:text-blue-700"
                                title="Sincronizar com Asaas"
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${syncing === payment.id ? 'animate-spin' : ''}`}
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
                <div className="border-t pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleRefundClick(selectedPayment.id, selectedPayment.orderId)}
                    disabled={refunding === selectedPayment.id}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${refunding === selectedPayment.id ? 'animate-spin' : ''}`}
                    />
                    {refunding === selectedPayment.id ? 'Processando Reembolso...' : 'Processar Reembolso'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Reembolso</DialogTitle>
            <DialogDescription>
              Para confirmar o reembolso, digite o número do pedido abaixo.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refund-order-id" className="text-sm font-medium text-gray-700">
                  Número do Pedido
                </Label>
                <p className="text-xs text-gray-500">
                  Digite <strong>#{selectedPayment.orderId}</strong> para confirmar o reembolso do pagamento #{selectedPayment.id}
                </p>
                <Input
                  id="refund-order-id"
                  type="text"
                  placeholder={`Digite ${selectedPayment.orderId}`}
                  value={refundOrderIdInput}
                  onChange={(e) => {
                    setRefundOrderIdInput(e.target.value);
                    setRefundError(''); // Limpar erro ao digitar
                  }}
                  disabled={refunding === selectedPayment.id}
                  className={refundError ? 'border-red-500' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && refundOrderIdInput.trim() === selectedPayment.orderId.toString()) {
                      handleRefundConfirm();
                    }
                  }}
                  autoFocus
                />
                {refundError && (
                  <p className="text-sm text-red-600">{refundError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRefundDialogOpen(false);
                    setRefundOrderIdInput('');
                    setRefundError('');
                  }}
                  disabled={refunding === selectedPayment.id}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRefundConfirm}
                  disabled={refunding === selectedPayment.id || refundOrderIdInput.trim() !== selectedPayment.orderId.toString()}
                >
                  {refunding === selectedPayment.id ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Reembolso'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

