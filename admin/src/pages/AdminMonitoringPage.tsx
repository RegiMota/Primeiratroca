import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { monitoringAPI } from '../lib/api';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Database, Server, Globe, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';

interface SystemHealth {
  database: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    error?: string;
  };
  backend: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    error?: string;
    uptime?: number;
  };
  frontend: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    error?: string;
  };
  admin: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    error?: string;
  };
}

interface ServiceLogs {
  service: string;
  logs: string[];
  error: string | null;
}

export function AdminMonitoringPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<Record<string, ServiceLogs>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 10000); // Atualizar a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [healthData, logsData] = await Promise.all([
        monitoringAPI.getHealth(),
        monitoringAPI.getLogs(),
      ]);
      setHealth(healthData);
      setLogs(logsData);
    } catch (error: any) {
      console.error('Error loading monitoring data:', error);
      toast.error('Erro ao carregar dados de monitoramento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Saudável</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-500">Com Problemas</Badge>;
      default:
        return <Badge className="bg-yellow-500">Desconhecido</Badge>;
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Monitoramento do Sistema
          </h1>
          <p className="mt-2 text-gray-600">Acompanhe a saúde e os logs de todos os serviços</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-500' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-atualizar: ON' : 'Auto-atualizar: OFF'}
          </Button>
          <Button onClick={loadData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status de Saúde */}
      {health && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.database.status)}
                  {getStatusBadge(health.database.status)}
                </div>
              </div>
              {health.database.responseTime && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tempo de resposta: {health.database.responseTime}ms
                </p>
              )}
              {health.database.error && (
                <p className="text-xs text-red-500 mt-2">{health.database.error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backend</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.backend.status)}
                  {getStatusBadge(health.backend.status)}
                </div>
              </div>
              {health.backend.responseTime && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tempo de resposta: {health.backend.responseTime}ms
                </p>
              )}
              {health.backend.uptime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: {formatUptime(health.backend.uptime)}
                </p>
              )}
              {health.backend.error && (
                <p className="text-xs text-red-500 mt-2">{health.backend.error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frontend</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.frontend.status)}
                  {getStatusBadge(health.frontend.status)}
                </div>
              </div>
              {health.frontend.error && (
                <p className="text-xs text-red-500 mt-2">{health.frontend.error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.admin.status)}
                  {getStatusBadge(health.admin.status)}
                </div>
              </div>
              {health.admin.error && (
                <p className="text-xs text-red-500 mt-2">{health.admin.error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs de Erros */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Erros</CardTitle>
          <CardDescription>Logs de erros de cada serviço do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="database" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="database">Banco de Dados</TabsTrigger>
              <TabsTrigger value="backend">Backend</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs do Banco de Dados</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.database?.error ? (
                    <div className="text-red-500">{logs.database.error}</div>
                  ) : logs.database?.logs && logs.database.logs.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="space-y-1 font-mono text-sm">
                        {logs.database.logs.map((log, index) => (
                          <div key={index} className="text-red-600">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhum erro encontrado no banco de dados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backend" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs do Backend</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.backend?.error ? (
                    <div className="text-red-500">{logs.backend.error}</div>
                  ) : logs.backend?.logs && logs.backend.logs.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="space-y-1 font-mono text-sm">
                        {logs.backend.logs.map((log, index) => (
                          <div key={index} className="text-red-600">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhum erro encontrado no backend</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="frontend" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs do Frontend</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.frontend?.error ? (
                    <div className="text-red-500">{logs.frontend.error}</div>
                  ) : logs.frontend?.logs && logs.frontend.logs.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="space-y-1 font-mono text-sm">
                        {logs.frontend.logs.map((log, index) => (
                          <div key={index} className="text-red-600">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhum erro encontrado no frontend</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs do Admin Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.admin?.error ? (
                    <div className="text-red-500">{logs.admin.error}</div>
                  ) : logs.admin?.logs && logs.admin.logs.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <div className="space-y-1 font-mono text-sm">
                        {logs.admin.logs.map((log, index) => (
                          <div key={index} className="text-red-600">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Nenhum erro encontrado no admin panel</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

