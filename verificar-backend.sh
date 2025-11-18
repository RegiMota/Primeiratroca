#!/bin/bash
# Script para verificar o status do backend

cd "$(dirname "$0")"

echo "🔍 Verificando status do backend..."
echo ""

# Verificar se .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

# Carregar variáveis
export $(cat .env.prod | grep -v '^#' | xargs)

echo "📋 Variáveis de ambiente:"
echo "   POSTGRES_USER: $POSTGRES_USER"
echo "   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:10}..."
echo "   JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "   CORS_ORIGIN: $CORS_ORIGIN"
echo "   VITE_API_URL: $VITE_API_URL"
echo ""

# Verificar containers
echo "📦 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Verificar logs do backend
echo "📋 Últimas 30 linhas dos logs do backend:"
docker-compose -f docker-compose.prod.yml logs --tail=30 backend
echo ""

# Testar conexão local
echo "🧪 Testando conexão local na porta 5000:"
if curl -s http://localhost:5000/api/health | grep -q "ok"; then
    echo "✅ Backend está respondendo localmente"
else
    echo "❌ Backend NÃO está respondendo localmente"
    echo ""
    echo "🔍 Verificando se a porta 5000 está em uso:"
    netstat -tlnp | grep 5000 || echo "Porta 5000 não está em uso"
fi
echo ""

# Verificar se o backend está acessível via Nginx
echo "🧪 Testando via Nginx (simulando requisição):"
curl -s -H "Host: api.primeiratrocaecia.com.br" http://localhost/api/health || echo "❌ Nginx não consegue acessar o backend"
echo ""

