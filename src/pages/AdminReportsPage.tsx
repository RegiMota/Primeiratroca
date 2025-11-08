import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { adminAPI } from '../lib/api';
import { Download, Calendar, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

interface SalesReport {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalItems: number;
    byStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
  };
  orders: any[];
}

export function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [reportData, setReportData] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, user, setLocation]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status !== 'all') params.status = filters.status;

      const data = await adminAPI.getSalesReport(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status !== 'all') params.status = filters.status;

      const blob = await adminAPI.exportSalesReportCSV(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  // Set default dates (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFilters((prev) => {
      const newFilters = {
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
      
      // Load report after setting default dates
      setTimeout(() => {
        loadReportWithFilters(newFilters);
      }, 100);
      
      return newFilters;
    });
  }, []);

  const loadReportWithFilters = async (filtersToUse: typeof filters) => {
    try {
      setLoading(true);
      const params: any = {};
      if (filtersToUse.startDate) params.startDate = filtersToUse.startDate;
      if (filtersToUse.endDate) params.endDate = filtersToUse.endDate;
      if (filtersToUse.status !== 'all') params.status = filtersToUse.status;

      const data = await adminAPI.getSalesReport(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  // Load report when filters change (but not on initial mount)
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.status]);

  return (
    <ErrorBoundary>
      <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
            Relatórios de Vendas
          </h2>
          <p className="text-gray-600">Visualize e exporte relatórios detalhados de vendas</p>
        </div>

        <Button
          onClick={handleExport}
          disabled={!reportData || exporting}
          className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
          style={{ fontWeight: 700 }}
        >
          <Download className="mr-2 h-5 w-5" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período e status para filtrar o relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      ) : reportData ? (
        <>
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-sky-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-5 w-5 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600">{reportData.summary.totalOrders}</div>
                <p className="text-xs text-gray-600">Pedidos no período</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {reportData.summary.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">Receita acumulada</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total de Itens</CardTitle>
                <Package className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{reportData.summary.totalItems}</div>
                <p className="text-xs text-gray-600">Itens vendidos</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Ticket Médio</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  R${' '}
                  {reportData.summary.totalOrders > 0
                    ? (reportData.summary.totalRevenue / reportData.summary.totalOrders).toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-gray-600">Por pedido</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Quantidade de pedidos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-5">
                {Object.entries(reportData.summary.byStatus).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-sky-600">{count}</div>
                    <p className="text-sm text-gray-600">{statusMap[status] || status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos ({reportData.orders.length})</CardTitle>
              <CardDescription>Lista detalhada de todos os pedidos no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.orders.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">Nenhum pedido encontrado no período selecionado</p>
                ) : (
                  reportData.orders.slice(0, 20).map((order: any) => (
                    <div key={order.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">Pedido #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sky-600">R$ {order.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{statusMap[order.status] || order.status}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Cliente: {order.customerName} ({order.customerEmail})</p>
                        <p className="mt-1">
                          Itens: {order.items.length} • Pagamento: {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}

