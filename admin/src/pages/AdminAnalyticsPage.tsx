// AdminAnalyticsPage - Analytics do painel admin
// Versão 2.0 - Módulo 7: Analytics Avançado

import { useState } from 'react';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { AnalyticsFunnel } from '../components/AnalyticsFunnel';
import { AnalyticsBehavior } from '../components/AnalyticsBehavior';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Download } from 'lucide-react';
import { adminAPI } from '../lib/api';
import { toast } from 'sonner';

export function AdminAnalyticsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const data = await adminAPI.exportAnalytics({
        startDate,
        endDate,
        format,
      });

      if (format === 'csv') {
        // Para CSV, o backend já retorna o conteúdo como string
        const csvContent = typeof data === 'string' ? data : await data.text();
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics-export-${startDate}-${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Para JSON, baixar como arquivo
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics-export-${startDate}-${endDate}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      console.error('Error exporting analytics:', error);
      toast.error('Erro ao exportar dados', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Análise de dados e métricas da loja</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AnalyticsOverview />
          </TabsContent>

          <TabsContent value="funnel" className="mt-6">
            <AnalyticsFunnel />
          </TabsContent>

          <TabsContent value="behavior" className="mt-6">
            <AnalyticsBehavior />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}


