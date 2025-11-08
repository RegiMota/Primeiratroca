import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { adminAPI } from '../lib/api';
import { Package, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ErrorBoundary } from '../components/ErrorBoundary';
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
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    label: 'Processando',
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    label: 'Enviado',
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
    label: 'Entregue',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-300',
    label: 'Cancelado',
  },
};

export function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      setLocation('/');
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await adminAPI.getOrders(statusFilter !== 'all' ? statusFilter : undefined);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, user, setLocation, statusFilter]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (updatingStatus === orderId) return; // Prevenir múltiplas chamadas simultâneas
    
    try {
      setUpdatingStatus(orderId);
      await adminAPI.updateOrderStatus(orderId, newStatus);
      
      // Atualizar pedido na lista
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Status do pedido atualizado com sucesso');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
            Gerenciar Pedidos
          </h2>
          <p className="text-gray-600">Visualize e gerencie todos os pedidos</p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-gray-600">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <ErrorBoundary>
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <ErrorBoundary key={`order-${order.id}`}>
                  <div className="rounded-2xl bg-white p-6 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-4">
                          <h3 className="text-lg font-bold">Pedido #{order.id}</h3>
                          <Badge className={status.color}>
                            <StatusIcon className="mr-1 h-4 w-4" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Cliente: {order.user?.name || order.user?.email || 'Não informado'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Data: {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {order.items?.length || 0} itens • Total: R$ {Number(order.total).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOrderDetails(order)}
                          className="text-sky-500 hover:bg-sky-50"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>

                        {updatingStatus === order.id ? (
                          <div className="w-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500">
                            Atualizando...
                          </div>
                        ) : (
                          <ErrorBoundary>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                              disabled={updatingStatus === order.id}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="processing">Processando</SelectItem>
                                <SelectItem value="shipped">Enviado</SelectItem>
                                <SelectItem value="delivered">Entregue</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </ErrorBoundary>
                        )}
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              );
            })}
          </div>
        </ErrorBoundary>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Cliente</p>
                  <p className="text-gray-900">{selectedOrder.user?.name || selectedOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge className={statusConfig[selectedOrder.status]?.color || ''}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Data do Pedido</p>
                  <p className="text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Método de Pagamento</p>
                  <p className="text-gray-900">{selectedOrder.paymentMethod || 'Cartão de Crédito'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Endereço de Entrega</p>
                  <p className="text-gray-900">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-4">Itens do Pedido</p>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => {
                    const productPrice = typeof item.product.price === 'number' 
                      ? item.product.price 
                      : Number(item.product.price || item.price || 0);

                    return (
                      <div key={index} className="flex gap-4 rounded-lg border p-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-orange-50">
                          <ImageWithFallback
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 justify-between">
                          <div>
                            <p className="font-semibold">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              Tamanho: {item.size} • Cor: {item.color} • Qtd: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600">Preço unitário: R$ {productPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R$ {(productPrice * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-sky-500">R$ {Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

