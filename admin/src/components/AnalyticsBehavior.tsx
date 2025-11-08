// AnalyticsBehavior - Análise de Comportamento do Usuário
// Versão 2.0 - Módulo 7: Analytics Avançado

import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Clock, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface BehaviorData {
  period: {
    start: string;
    end: string;
  };
  behavior: {
    averageTimeToComplete: number;
    averageCartSize: number;
    repeatPurchaseRate: number;
    returningCustomers: number;
  };
  hourlyPattern: Array<{
    hour: number;
    count: number;
    revenue: number;
    averageOrderValue: number;
  }>;
  weeklyPattern: Array<{
    day: number;
    dayName: string;
    count: number;
    revenue: number;
    averageOrderValue: number;
  }>;
  topViewedProducts: Array<{
    productId: number;
    name: string;
    views: number;
  }>;
  topCategories: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
}

const COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#14B8A6', '#F97316'];

export function AnalyticsBehavior() {
  const [loading, setLoading] = useState(true);
  const [behaviorData, setBehaviorData] = useState<BehaviorData | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const loadBehavior = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAnalyticsBehavior({
        startDate,
        endDate,
      });
      setBehaviorData(data);
    } catch (error: any) {
      console.error('Error loading behavior:', error);
      toast.error('Erro ao carregar análise de comportamento', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBehavior();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-gray-600">Carregando análise de comportamento...</p>
      </div>
    );
  }

  if (!behaviorData) {
    return (
      <div className="space-y-6">
        <p className="text-gray-600">Erro ao carregar análise de comportamento</p>
      </div>
    );
  }

  const { behavior, hourlyPattern, weeklyPattern, topViewedProducts, topCategories } = behaviorData;

  // Formatar dados para gráficos
  const hourlyChartData = hourlyPattern.map((item) => ({
    hora: `${item.hour}:00`,
    pedidos: item.count,
    receita: item.revenue,
    ticketMedio: item.averageOrderValue,
  }));

  const weeklyChartData = weeklyPattern.map((item) => ({
    dia: item.dayName,
    pedidos: item.count,
    receita: item.revenue,
    ticketMedio: item.averageOrderValue,
  }));

  const categoriesChartData = topCategories.map((cat, index) => ({
    name: cat.category,
    value: cat.revenue,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
          <CardDescription>Selecione o período para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadBehavior}>Atualizar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{behavior.averageTimeToComplete.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Entre criação e conclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Tamanho Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{behavior.averageCartSize.toFixed(1)}</div>
            <p className="text-xs text-gray-500">Itens por carrinho</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Taxa de Retorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{behavior.repeatPurchaseRate.toFixed(2)}%</div>
            <p className="text-xs text-gray-500">{behavior.returningCustomers} clientes recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Clientes Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{behavior.returningCustomers}</div>
            <p className="text-xs text-gray-500">Com mais de 1 compra</p>
          </CardContent>
        </Card>
      </div>

      {/* Padrão por Horário */}
      <Card>
        <CardHeader>
          <CardTitle>Padrão de Compras por Horário</CardTitle>
          <CardDescription>Distribuição de pedidos e receita ao longo do dia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pedidos"
                stroke="#0EA5E9"
                name="Pedidos"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="receita"
                stroke="#10B981"
                name="Receita (R$)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Padrão por Dia da Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Padrão de Compras por Dia da Semana</CardTitle>
          <CardDescription>Distribuição de pedidos e receita por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="pedidos" fill="#0EA5E9" name="Pedidos" />
              <Bar yAxisId="right" dataKey="receita" fill="#10B981" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Produtos e Categorias */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Visualizados</CardTitle>
            <CardDescription>Top 10 produtos mais visualizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topViewedProducts.slice(0, 10).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <Badge>{product.views.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias Mais Populares</CardTitle>
            <CardDescription>Receita por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoriesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

