// Página de Rastreamento de Pedidos
// Versão 2.0 - Sistema de Frete e Entregas

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { shippingAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Search, 
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface TrackingEvent {
  date: string | Date;
  location: string;
  status: string;
}

interface Tracking {
  id: number;
  orderId: number;
  carrier: string;
  trackingCode: string;
  status: string;
  statusDetail?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  shippedAt?: string | Date;
  estimatedDelivery?: string | Date;
  deliveredAt?: string | Date;
  events?: TrackingEvent[] | string;
  deliveryProof?: string;
  recipientName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  in_transit: 'text-blue-600 bg-blue-50 border-blue-200',
  out_for_delivery: 'text-purple-600 bg-purple-50 border-purple-200',
  delivered: 'text-green-600 bg-green-50 border-green-200',
  exception: 'text-red-600 bg-red-50 border-red-200',
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  in_transit: Truck,
  out_for_delivery: Package,
  delivered: CheckCircle,
  exception: AlertCircle,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando Envio',
  in_transit: 'Em Trânsito',
  out_for_delivery: 'Saiu para Entrega',
  delivered: 'Entregue',
  exception: 'Problema na Entrega',
};

export function TrackingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchCode, setSearchCode] = useState('');
  const [searchByOrderId, setSearchByOrderId] = useState('');
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [myOrdersTracking, setMyOrdersTracking] = useState<any[]>([]);

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    // Carregar rastreamentos dos pedidos do usuário
    loadMyOrdersTracking();
  }, [isAuthenticated, authLoading, setLocation]);

  const loadMyOrdersTracking = async () => {
    try {
      // Buscar pedidos do usuário com rastreamento
      // Por enquanto, vamos buscar pelo orderId
      // Em produção, teríamos uma rota específica para isso
      // Usar a função helper do api.ts para detectar a URL correta
      const { getServerUrl } = await import('../lib/api');
      const ordersResponse = await fetch(getServerUrl('5000', '/api/orders'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        
        // Buscar tracking para cada pedido que tem trackingCode
        const trackingsPromises = orders
          .filter((order: any) => order.trackingCode)
          .map(async (order: any) => {
            try {
              const trackingResponse = await shippingAPI.getTrackingByOrder(order.id);
              return trackingResponse.tracking;
            } catch (error) {
              return null;
            }
          });

        const trackings = await Promise.all(trackingsPromises);
        setMyOrdersTracking(trackings.filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading orders tracking:', error);
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      toast.error('Digite um código de rastreamento');
      return;
    }

    setLoading(true);
    try {
      const response = await shippingAPI.getTrackingByCode(searchCode.trim());
      setTracking(response.tracking);
      
      if (!response.tracking) {
        toast.error('Rastreamento não encontrado');
      }
    } catch (error: any) {
      console.error('Error searching tracking:', error);
      toast.error('Erro ao buscar rastreamento', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByOrderId = async () => {
    if (!searchByOrderId.trim()) {
      toast.error('Digite um ID de pedido');
      return;
    }

    const orderId = parseInt(searchByOrderId.trim());
    if (isNaN(orderId)) {
      toast.error('ID de pedido inválido');
      return;
    }

    setLoading(true);
    try {
      const response = await shippingAPI.getTrackingByOrder(orderId);
      setTracking(response.tracking);
      
      if (!response.tracking) {
        toast.error('Rastreamento não encontrado para este pedido');
      }
    } catch (error: any) {
      console.error('Error searching tracking:', error);
      toast.error('Erro ao buscar rastreamento', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Não disponível';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseEvents = (events: TrackingEvent[] | string | undefined): TrackingEvent[] => {
    if (!events) return [];
    if (typeof events === 'string') {
      try {
        return JSON.parse(events);
      } catch {
        return [];
      }
    }
    return events;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
        Rastreamento de Pedidos
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Conteúdo Principal */}
        <div className="space-y-6">
          {/* Busca por Código */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar por Código de Rastreamento
              </CardTitle>
              <CardDescription>
                Digite o código de rastreamento fornecido pelos Correios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: AA123456789BR"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchByCode();
                    }
                  }}
                />
                <Button onClick={handleSearchByCode} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Busca por Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Buscar por ID do Pedido
              </CardTitle>
              <CardDescription>
                Digite o ID do seu pedido para ver o rastreamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Ex: 123"
                  value={searchByOrderId}
                  onChange={(e) => setSearchByOrderId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchByOrderId();
                    }
                  }}
                />
                <Button onClick={handleSearchByOrderId} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado do Rastreamento */}
          {tracking && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Rastreamento #{tracking.trackingCode}
                  </CardTitle>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${
                    STATUS_COLORS[tracking.status] || STATUS_COLORS.pending
                  }`}>
                    {STATUS_LABELS[tracking.status] || tracking.status}
                  </div>
                </div>
                <CardDescription>
                  Pedido #{tracking.orderId} • {tracking.carrier.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endereço de Entrega */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </Label>
                  <p className="text-sm text-gray-600">
                    {tracking.address}, {tracking.city} - {tracking.state}
                  </p>
                  <p className="text-sm text-gray-500">CEP: {tracking.zipCode}</p>
                  {tracking.recipientName && (
                    <p className="text-sm text-gray-500 mt-1">
                      Destinatário: {tracking.recipientName}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Informações de Datas */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {tracking.shippedAt && (
                    <div>
                      <Label className="text-xs text-gray-500 mb-1">Enviado em</Label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(tracking.shippedAt)}
                      </p>
                    </div>
                  )}
                  {tracking.estimatedDelivery && (
                    <div>
                      <Label className="text-xs text-gray-500 mb-1">Previsão de Entrega</Label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatDate(tracking.estimatedDelivery)}
                      </p>
                    </div>
                  )}
                  {tracking.deliveredAt && (
                    <div>
                      <Label className="text-xs text-gray-500 mb-1">Entregue em</Label>
                      <p className="text-sm font-medium flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {formatDate(tracking.deliveredAt)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Detail */}
                {tracking.statusDetail && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-2">Detalhes do Status</Label>
                      <p className="text-sm text-gray-600">{tracking.statusDetail}</p>
                    </div>
                  </>
                )}

                {/* Timeline de Eventos */}
                {parseEvents(tracking.events).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-4">Histórico de Eventos</Label>
                      <div className="space-y-4">
                        {parseEvents(tracking.events).map((event, index) => {
                          const EventIcon = STATUS_ICONS[tracking.status] || Package;
                          return (
                            <div key={index} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`p-2 rounded-full ${
                                  STATUS_COLORS[tracking.status] || STATUS_COLORS.pending
                                }`}>
                                  <EventIcon className="h-4 w-4" />
                                </div>
                                {index < parseEvents(tracking.events).length - 1 && (
                                  <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="text-sm font-medium">{event.status}</p>
                                <p className="text-xs text-gray-500">{event.location}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDate(event.date)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Botão para ver pedido */}
                <Separator />
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/orders/${tracking.orderId}`)}
                  className="w-full"
                >
                  Ver Detalhes do Pedido
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há resultado */}
          {!tracking && !loading && (searchCode || searchByOrderId) && (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Rastreamento não encontrado. Verifique o código ou ID do pedido.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Meus Pedidos com Rastreamento */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Meus Pedidos</CardTitle>
              <CardDescription>
                Pedidos com rastreamento disponível
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myOrdersTracking.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum pedido com rastreamento encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {myOrdersTracking.map((trackingItem: any) => {
                    const StatusIcon = STATUS_ICONS[trackingItem.status] || Package;
                    return (
                      <div
                        key={trackingItem.id}
                        className="p-3 border rounded-lg cursor-pointer hover:border-sky-300 transition-colors"
                        onClick={() => {
                          setTracking(trackingItem);
                          setSearchCode(trackingItem.trackingCode);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              Pedido #{trackingItem.orderId}
                            </span>
                          </div>
                          <StatusIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {trackingItem.trackingCode}
                        </p>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs ${
                          STATUS_COLORS[trackingItem.status] || STATUS_COLORS.pending
                        }`}>
                          {STATUS_LABELS[trackingItem.status] || trackingItem.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

