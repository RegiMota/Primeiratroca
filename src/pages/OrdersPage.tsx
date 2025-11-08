import { useState, useEffect } from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { ordersAPI } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pendente',
  },
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processando',
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    label: 'Enviado',
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Entregue',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Cancelado',
  },
};

export function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      // Esperar o AuthContext terminar de carregar antes de verificar autenticação
      if (authLoading) {
        return;
      }
      
      if (!isAuthenticated) {
        setLocation('/login');
        return;
      }

      try {
        setLoading(true);
        const ordersData = await ordersAPI.getAll();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, authLoading, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
        Meus Pedidos
      </h1>

      {loading ? (
        <div className="rounded-3xl bg-white p-16 text-center shadow-lg">
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl bg-white p-16 text-center shadow-lg">
          <Package className="mx-auto mb-6 h-24 w-24 text-gray-300" />
          <h2 className="mb-4 text-gray-700" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Nenhum Pedido Ainda
          </h2>
          <p className="text-gray-600">
            Você ainda não fez nenhum pedido
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="rounded-2xl bg-white p-6 shadow-md">
                {/* Order Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      Pedido #{order.id}
                    </h3>
                    <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                      Feito em {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <Badge className={status.color}>
                    <StatusIcon className="mr-1 h-4 w-4" />
                    {status.label}
                  </Badge>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => {
                    const productPrice = typeof item.product.price === 'number' 
                      ? item.product.price 
                      : Number(item.product.price || item.price || 0);
                    
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-orange-50">
                          <ImageWithFallback
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 justify-between">
                          <div>
                            <h4 style={{ fontWeight: 600 }}>
                              {item.product.name}
                            </h4>
                            <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                              Tamanho: {item.size} • Cor: {item.color} • Qtd: {item.quantity}
                            </p>
                          </div>

                          <div className="text-right">
                            <p style={{ fontWeight: 700 }}>
                              R$ {(productPrice * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Total */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between">
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Total</span>
                    <span className="text-sky-500" style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
