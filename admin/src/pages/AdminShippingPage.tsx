// Dashboard Admin de Rastreamentos e Entregas
// Versão 2.0 - Sistema de Frete e Entregas

import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import {
  Truck,
  Package,
  MapPin,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';

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
  events?: any;
  recipientName?: string;
  order?: {
    id: number;
    userId: number;
    status: string;
    total: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_transit: 'bg-blue-100 text-blue-800 border-blue-300',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  exception: 'bg-red-100 text-red-800 border-red-300',
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

export function AdminShippingPage() {
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedTracking, setSelectedTracking] = useState<Tracking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    statusDetail: '',
  });
  const [filters, setFilters] = useState({
    status: '',
    carrier: '',
    search: '',
  });

  useEffect(() => {
    loadTrackings();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.carrier]);

  const loadTrackings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getShippingTrackings({
        status: filters.status || undefined,
        carrier: filters.carrier || undefined,
      });
      console.log('Trackings response:', response); // Debug
      setTrackings(response.trackings || response || []);
    } catch (error: any) {
      console.error('Error loading trackings:', error);
      toast.error('Erro ao carregar rastreamentos', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
      setTrackings([]); // Garantir que sempre tenha um array
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getShippingStats();
      console.log('Stats response:', response); // Debug
      setStats(response);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Se houver erro, definir stats padrão para não quebrar a UI
      setStats({
        total: 0,
        inTransit: 0,
        delivered: 0,
        exception: 0,
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTracking || !updateFormData.status) {
      toast.error('Selecione um status');
      return;
    }

    try {
      await adminAPI.updateTrackingStatus(selectedTracking.id, {
        status: updateFormData.status,
        statusDetail: updateFormData.statusDetail || undefined,
      });
      toast.success('Status atualizado com sucesso!');
      setIsUpdateDialogOpen(false);
      setUpdateFormData({ status: '', statusDetail: '' });
      setSelectedTracking(null);
      loadTrackings();
      loadStats();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleSyncTracking = async (trackingCode: string) => {
    try {
      await adminAPI.syncTracking(trackingCode);
      toast.success('Rastreamento sincronizado com sucesso!');
      loadTrackings();
    } catch (error: any) {
      console.error('Error syncing tracking:', error);
      toast.error('Erro ao sincronizar rastreamento', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
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

  const parseEvents = (events: any): any[] => {
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

  const filteredTrackings = trackings.filter((tracking) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        tracking.trackingCode.toLowerCase().includes(search) ||
        tracking.orderId.toString().includes(search) ||
        tracking.address.toLowerCase().includes(search) ||
        tracking.city.toLowerCase().includes(search) ||
        (tracking.order?.user?.name || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rastreamentos e Entregas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie rastreamentos e status de entregas
          </p>
        </div>
        <Button onClick={loadTrackings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {(stats || !loading) && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Rastreamentos</CardTitle>
              <Truck className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.inTransit || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Problemas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.exception || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Código, pedido, endereço..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Aguardando Envio</SelectItem>
                  <SelectItem value="in_transit">Em Trânsito</SelectItem>
                  <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="exception">Com Problema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="carrier">Transportadora</Label>
              <Select
                value={filters.carrier || 'all'}
                onValueChange={(value) => setFilters({ ...filters, carrier: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as transportadoras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as transportadoras</SelectItem>
                  <SelectItem value="correios">Correios</SelectItem>
                  <SelectItem value="jadlog">Jadlog</SelectItem>
                  <SelectItem value="total">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Rastreamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Rastreamentos</CardTitle>
          <CardDescription>
            {filteredTrackings.length} rastreamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando rastreamentos...</p>
            </div>
          ) : filteredTrackings.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum rastreamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrackings.map((tracking) => {
                const StatusIcon = STATUS_ICONS[tracking.status] || Clock;
                return (
                  <div
                    key={tracking.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${STATUS_COLORS[tracking.status]}`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Pedido #{tracking.orderId}</h3>
                            <Badge className={STATUS_COLORS[tracking.status]}>
                              {STATUS_LABELS[tracking.status] || tracking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Código: <span className="font-mono">{tracking.trackingCode}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Transportadora: {tracking.carrier.toUpperCase()}
                          </p>
                          {tracking.order?.user && (
                            <p className="text-sm text-gray-600 mt-1">
                              Cliente: {tracking.order.user.name} ({tracking.order.user.email})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTracking(tracking);
                            setUpdateFormData({
                              status: tracking.status,
                              statusDetail: tracking.statusDetail || '',
                            });
                            setIsUpdateDialogOpen(true);
                          }}
                        >
                          Atualizar Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncTracking(tracking.trackingCode)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sincronizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTracking(tracking);
                            setIsDialogOpen(true);
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Endereço de Entrega</Label>
                        <p className="text-sm">
                          {tracking.address}, {tracking.city} - {tracking.state}
                        </p>
                        <p className="text-xs text-gray-500">CEP: {tracking.zipCode}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {tracking.shippedAt && (
                          <div>
                            <Label className="text-xs text-gray-500 mb-1">Enviado em</Label>
                            <p className="text-sm">{formatDate(tracking.shippedAt)}</p>
                          </div>
                        )}
                        {tracking.estimatedDelivery && (
                          <div>
                            <Label className="text-xs text-gray-500 mb-1">Previsão</Label>
                            <p className="text-sm">{formatDate(tracking.estimatedDelivery)}</p>
                          </div>
                        )}
                        {tracking.deliveredAt && (
                          <div>
                            <Label className="text-xs text-gray-500 mb-1">Entregue em</Label>
                            <p className="text-sm text-green-600">{formatDate(tracking.deliveredAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Rastreamento</DialogTitle>
            <DialogDescription>
              Pedido #{selectedTracking?.orderId} • {selectedTracking?.trackingCode}
            </DialogDescription>
          </DialogHeader>

          {selectedTracking && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">Status Atual</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[selectedTracking.status]}>
                      {STATUS_LABELS[selectedTracking.status] || selectedTracking.status}
                    </Badge>
                  </div>
                  {selectedTracking.statusDetail && (
                    <p className="text-sm text-gray-600 mt-2">{selectedTracking.statusDetail}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">Transportadora</Label>
                  <p className="text-sm font-medium">{selectedTracking.carrier.toUpperCase()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-gray-500 mb-1">Endereço de Entrega</Label>
                <p className="text-sm">
                  {selectedTracking.address}, {selectedTracking.city} - {selectedTracking.state}
                </p>
                <p className="text-xs text-gray-500">CEP: {selectedTracking.zipCode}</p>
                {selectedTracking.recipientName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Destinatário: {selectedTracking.recipientName}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                {selectedTracking.shippedAt && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Enviado em</Label>
                    <p className="text-sm">{formatDate(selectedTracking.shippedAt)}</p>
                  </div>
                )}
                {selectedTracking.estimatedDelivery && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Previsão de Entrega</Label>
                    <p className="text-sm">{formatDate(selectedTracking.estimatedDelivery)}</p>
                  </div>
                )}
                {selectedTracking.deliveredAt && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Entregue em</Label>
                    <p className="text-sm text-green-600">{formatDate(selectedTracking.deliveredAt)}</p>
                  </div>
                )}
              </div>

              {parseEvents(selectedTracking.events).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-3">Histórico de Eventos</Label>
                    <div className="space-y-3">
                      {parseEvents(selectedTracking.events).map((event: any, index: number) => {
                        const EventIcon = STATUS_ICONS[selectedTracking.status] || Clock;
                        return (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-full ${STATUS_COLORS[selectedTracking.status]}`}>
                              <EventIcon className="h-4 w-4" />
                            </div>
                            {index < parseEvents(selectedTracking.events).length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm font-medium">{event.status}</p>
                            <p className="text-xs text-gray-500">{event.location}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(event.date)}</p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualização de Status */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Rastreamento</DialogTitle>
            <DialogDescription>
              Pedido #{selectedTracking?.orderId} • {selectedTracking?.trackingCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateFormData.status}
                onValueChange={(value) => setUpdateFormData({ ...updateFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Aguardando Envio</SelectItem>
                  <SelectItem value="in_transit">Em Trânsito</SelectItem>
                  <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="exception">Com Problema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusDetail">Detalhes do Status (opcional)</Label>
              <Input
                id="statusDetail"
                value={updateFormData.statusDetail}
                onChange={(e) =>
                  setUpdateFormData({ ...updateFormData, statusDetail: e.target.value })
                }
                placeholder="Ex: Objeto postado, aguardando coleta..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus}>Atualizar Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

