import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, authAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function APIConnectionTest() {
  const [tests, setTests] = useState<Array<{
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
  }>>([]);

  const runTests = async () => {
    setTests([
      { name: 'Health Check', status: 'pending', message: 'Testando...' },
      { name: 'Buscar Produtos', status: 'pending', message: 'Testando...' },
      { name: 'Buscar Categorias', status: 'pending', message: 'Testando...' },
      { name: 'Verificar URL da API', status: 'pending', message: 'Testando...' },
    ]);

    // Teste 1: Verificar URL da API
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    setTests(prev => {
      const updated = [...prev];
      updated[3] = {
        name: 'Verificar URL da API',
        status: 'success',
        message: `URL configurada: ${apiUrl}`,
      };
      return updated;
    });

    // Teste 2: Health Check
    try {
      const response = await fetch(`${apiUrl.replace('/api', '')}/api/health`);
      if (response.ok) {
        const data = await response.json();
        setTests(prev => {
          const updated = [...prev];
          updated[0] = {
            name: 'Health Check',
            status: 'success',
            message: data.message || 'Servidor está respondendo',
          };
          return updated;
        });
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    } catch (error: any) {
      setTests(prev => {
        const updated = [...prev];
        updated[0] = {
          name: 'Health Check',
          status: 'error',
          message: error.message || 'Erro ao conectar com o servidor',
        };
        return updated;
      });
    }

    // Teste 3: Buscar Produtos
    try {
      const products = await productsAPI.getAll({ limit: 5 });
      const count = Array.isArray(products) ? products.length : products.products?.length || 0;
      setTests(prev => {
        const updated = [...prev];
        updated[1] = {
          name: 'Buscar Produtos',
          status: 'success',
          message: `${count} produtos encontrados`,
        };
        return updated;
      });
    } catch (error: any) {
      setTests(prev => {
        const updated = [...prev];
        updated[1] = {
          name: 'Buscar Produtos',
          status: 'error',
          message: error.response?.data?.error || error.message || 'Erro ao buscar produtos',
        };
        return updated;
      });
    }

    // Teste 4: Buscar Categorias
    try {
      const categories = await categoriesAPI.getAll();
      const count = Array.isArray(categories) ? categories.length : 0;
      setTests(prev => {
        const updated = [...prev];
        updated[2] = {
          name: 'Buscar Categorias',
          status: 'success',
          message: `${count} categorias encontradas`,
        };
        return updated;
      });
    } catch (error: any) {
      setTests(prev => {
        const updated = [...prev];
        updated[2] = {
          name: 'Buscar Categorias',
          status: 'error',
          message: error.response?.data?.error || error.message || 'Erro ao buscar categorias',
        };
        return updated;
      });
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">OK</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">Erro</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white">Pendente</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Diagnóstico de Conexão API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{test.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{test.message}</p>
              </div>
            </div>
            {getStatusBadge(test.status)}
          </div>
        ))}
        <Button onClick={runTests} className="w-full">
          Executar Testes Novamente
        </Button>
      </CardContent>
    </Card>
  );
}
