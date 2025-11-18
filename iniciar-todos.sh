#!/bin/bash
# Script para iniciar todos os containers

cd "$(dirname "$0")"

echo "🚀 Iniciando todos os containers..."
echo ""

# Carregar variáveis do .env.prod
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas do .env.prod"
else
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

# Iniciar todos os containers
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 10

echo ""
echo "✅ Containers iniciados!"
echo ""
echo "📋 Verificar status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo "   ./verificar-status.sh"

