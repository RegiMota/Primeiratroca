import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  Clock,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsOverviewProps {
  onPeriodChange?: (startDate: string, endDate: string) => void;
}

const COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

export function AnalyticsOverview({ onPeriodChange }: AnalyticsOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAnalyticsOverview({
        startDate,
        endDate,
      });
      setAnalyticsData(data);
      onPeriodChange?.(startDate, endDate);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar analytics', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Erro ao carregar analytics</p>
      </div>
    );
  }

  const { metrics, customers, topProducts, categoryMetrics, peakHours } = analyticsData;

  // Preparar dados para gráficos
  const categoryChartData = categoryMetrics.slice(0, 5).map((cat: any) => ({
    name: cat.category.substring(0, 15),
    receita: cat.revenue,
    ticket: cat.averageTicket,
  }));

  const productsChartData = topProducts.slice(0, 5).map((prod: any) => ({
    name: prod.name.substring(0, 15),
    vendas: prod.totalSold,
    receita: prod.revenue,
  }));

  const peakHoursData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}h`,
    pedidos: peakHours.find((p: any) => p.hour === hour)?.count || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Período</CardTitle>
          <CardDescription>Selecione o período para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics} className="w-full">
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Pedidos / Visitantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.averageTicket.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por pedido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.abandonmentRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Pedidos cancelados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Cupons</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.couponUsageRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Desconto total: R$ {metrics.totalDiscount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Novos vs Recorrentes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Distribuição de clientes novos e recorrentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-500">{customers.total}</div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{customers.new}</div>
              <p className="text-sm text-muted-foreground">Clientes Novos ({customers.newVsReturning.new.toFixed(1)}%)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{customers.returning}</div>
              <p className="text-sm text-muted-foreground">Clientes Recorrentes ({customers.newVsReturning.returning.toFixed(1)}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top 5 Categorias por Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Categorias</CardTitle>
            <CardDescription>Receita e ticket médio por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="receita" fill="#0EA5E9" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendas" fill="#F59E0B" name="Quantidade Vendida" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Horários de Pico */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Pico</CardTitle>
            <CardDescription>Distribuição de pedidos ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pedidos" stroke="#8B5CF6" name="Pedidos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Receita por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryMetrics.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryMetrics.slice(0, 5).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          <CardDescription>Produtos com maior volume de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left" style={{ fontWeight: 700 }}>Produto</th>
                  <th className="px-4 py-2 text-left" style={{ fontWeight: 700 }}>Categoria</th>
                  <th className="px-4 py-2 text-right" style={{ fontWeight: 700 }}>Quantidade</th>
                  <th className="px-4 py-2 text-right" style={{ fontWeight: 700 }}>Receita</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 10).map((product: any, index: number) => (
                  <tr key={product.productId} className="border-b">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{product.category}</td>
                    <td className="px-4 py-2 text-right font-semibold">{product.totalSold}</td>
                    <td className="px-4 py-2 text-right font-semibold text-sky-500">
                      R$ {product.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

