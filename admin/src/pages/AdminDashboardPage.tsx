import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../lib/api';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

interface Order {
  id: number;
  total: number | string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface TopProduct {
  id: number;
  name: string;
  totalSold: number;
}

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
  recentOrders: Order[];
  topProducts: TopProduct[];
}

const COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Erro ao carregar dashboard</p>
      </div>
    );
  }

  // Preparar dados para gráficos
  const revenueData = dashboardData.recentOrders.slice(0, 7).map((order) => ({
    name: new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    receita: Number(order.total),
  }));

  const productsData = dashboardData.topProducts.map((product) => ({
    name: product.name?.substring(0, 20) || 'Produto',
    vendas: product.totalSold || 0,
  }));

  const statusData = [
    { name: 'Pendente', value: dashboardData.recentOrders.filter((o) => o.status === 'pending').length },
    { name: 'Processando', value: dashboardData.recentOrders.filter((o) => o.status === 'processing').length },
    { name: 'Enviado', value: dashboardData.recentOrders.filter((o) => o.status === 'shipped').length },
    { name: 'Entregue', value: dashboardData.recentOrders.filter((o) => o.status === 'delivered').length },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Painel de Controle
        </h2>
        <p className="text-gray-600">Visão geral do desempenho da loja</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-sky-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Usuários</CardTitle>
            <Users className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{dashboardData.stats.totalUsers}</div>
            <p className="text-xs text-gray-600">Total de usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Produtos</CardTitle>
            <Package className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{dashboardData.stats.totalProducts}</div>
            <p className="text-xs text-gray-600">Produtos no catálogo</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pedidos</CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{dashboardData.stats.totalOrders}</div>
            <p className="text-xs text-gray-600">Total de pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {dashboardData.stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Receita acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="products">Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="status">Status de Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
              <CardDescription>Evolução da receita por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
              <CardDescription>Produtos com maior volume de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendas" fill="#F59E0B" name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Status dos Pedidos</CardTitle>
              <CardDescription>Status dos últimos pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Orders */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pedidos Recentes
          </CardTitle>
          <CardDescription>Últimos 10 pedidos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentOrders.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Nenhum pedido encontrado</p>
            ) : (
              dashboardData.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">Pedido #{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.user?.name || order.user?.email || 'Cliente'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          order.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-300'
                            : order.status === 'delivered'
                            ? 'bg-green-50 text-green-800 border-green-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }
                      >
                        {order.status === 'pending'
                          ? 'Pendente'
                          : order.status === 'processing'
                          ? 'Processando'
                          : order.status === 'shipped'
                          ? 'Enviado'
                          : order.status === 'delivered'
                          ? 'Entregue'
                          : order.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sky-600">R$ {Number(order.total).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{order.items?.length || 0} itens</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Produtos Mais Vendidos
          </CardTitle>
          <CardDescription>Top 5 produtos por volume de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.topProducts.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Nenhum produto vendido ainda</p>
            ) : (
              dashboardData.topProducts.map((product, index: number) => (
                <div
                  key={product.id || index}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-orange-50">
                      <span className="text-xl font-bold text-sky-500">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{product.name || 'Produto'}</p>
                      <p className="text-sm text-gray-600">
                        R$ {Number(product.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{product.totalSold || 0} vendas</p>
                    <p className="text-sm text-gray-600">
                      Estoque: {product.stock || 0} unidades
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

