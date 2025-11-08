// AnalyticsFunnel - Visualização do Funil de Conversão
// Versão 2.0 - Módulo 7: Analytics Avançado

import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { TrendingDown, TrendingUp, Users, Eye, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelData {
  period: {
    start: string;
    end: string;
  };
  funnel: {
    visitors: number;
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    completedPurchases: number;
  };
  conversionRates: {
    visitorsToProductViews: number;
    productViewsToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
    overallConversion: number;
  };
  dropOffs: {
    visitorsToProductViews: number;
    productViewsToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
  };
  cartAbandonment: {
    abandonedCarts: number;
    cartAbandonmentRate: number;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

export function AnalyticsFunnel() {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const loadFunnel = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAnalyticsFunnel({
        startDate,
        endDate,
      });
      setFunnelData(data);
    } catch (error: any) {
      console.error('Error loading funnel:', error);
      toast.error('Erro ao carregar funil de conversão', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunnel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-gray-600">Carregando funil de conversão...</p>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="space-y-6">
        <p className="text-gray-600">Erro ao carregar funil de conversão</p>
      </div>
    );
  }

  const { funnel, conversionRates, dropOffs, cartAbandonment, statusBreakdown } = funnelData;

  // Preparar dados para o gráfico de funil
  const funnelChartData = [
    {
      name: 'Visitantes',
      value: funnel.visitors,
      icon: Users,
      color: COLORS[0],
    },
    {
      name: 'Visualizações',
      value: funnel.productViews,
      icon: Eye,
      color: COLORS[1],
    },
    {
      name: 'Carrinho',
      value: funnel.addToCarts,
      icon: ShoppingCart,
      color: COLORS[2],
    },
    {
      name: 'Checkout',
      value: funnel.checkoutStarts,
      icon: CreditCard,
      color: COLORS[3],
    },
    {
      name: 'Compra',
      value: funnel.completedPurchases,
      icon: CheckCircle,
      color: COLORS[4],
    },
  ];

  // Preparar dados para gráfico de taxas de conversão
  const conversionChartData = [
    {
      name: 'Visitas → Produtos',
      rate: conversionRates.visitorsToProductViews,
      dropOff: dropOffs.visitorsToProductViews,
    },
    {
      name: 'Produtos → Carrinho',
      rate: conversionRates.productViewsToCart,
      dropOff: dropOffs.productViewsToCart,
    },
    {
      name: 'Carrinho → Checkout',
      rate: conversionRates.cartToCheckout,
      dropOff: dropOffs.cartToCheckout,
    },
    {
      name: 'Checkout → Compra',
      rate: conversionRates.checkoutToPurchase,
      dropOff: dropOffs.checkoutToPurchase,
    },
  ];

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
              <Button onClick={loadFunnel}>Atualizar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRates.overallConversion.toFixed(2)}%</div>
            <p className="text-xs text-gray-500">
              {funnel.completedPurchases} de {funnel.visitors} visitantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abandono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cartAbandonment.cartAbandonmentRate.toFixed(2)}%</div>
            <p className="text-xs text-gray-500">
              {cartAbandonment.abandonedCarts} carrinhos abandonados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel.visitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Checkouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel.checkoutStarts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{funnel.completedPurchases.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Funil Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Visualização do funil de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelChartData.map((step, index) => {
              const Icon = step.icon;
              const previousValue = index > 0 ? funnelChartData[index - 1].value : funnel.visitors;
              const widthPercentage = previousValue > 0 ? (step.value / previousValue) * 100 : 0;
              const conversionRate = index > 0
                ? conversionChartData[index - 1]?.rate || 0
                : 100;

              return (
                <div key={step.name} className="relative">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color: step.color }} />
                      <span className="font-semibold">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      <Badge variant="outline">{step.value.toLocaleString()}</Badge>
                      {index > 0 && (
                        <span className="text-sm text-gray-600">
                          {conversionRate.toFixed(2)}% de conversão
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-0 transition-all duration-500 flex items-center justify-center text-white font-bold"
                      style={{
                        width: `${widthPercentage}%`,
                        backgroundColor: step.color,
                      }}
                    >
                      {widthPercentage > 10 && `${widthPercentage.toFixed(1)}%`}
                    </div>
                  </div>
                  {index > 0 && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      <span>
                        {(() => {
                          const dropOffKey = index === 1 ? 'visitorsToProductViews' :
                            index === 2 ? 'productViewsToCart' :
                            index === 3 ? 'cartToCheckout' :
                            'checkoutToPurchase';
                          return dropOffs[dropOffKey as keyof typeof dropOffs]?.toLocaleString() || 0;
                        })()} abandonos
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Taxas de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxas de Conversão por Etapa</CardTitle>
          <CardDescription>Percentual de conversão entre cada etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="rate" fill="#0EA5E9" name="Taxa de Conversão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
          <CardDescription>Breakdown de pedidos por status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statusBreakdown.map((status) => (
              <div key={status.status} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold capitalize">{status.status}</p>
                  <p className="text-sm text-gray-600">{status.count} pedidos</p>
                </div>
                <Badge variant="outline">{status.percentage.toFixed(1)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

