#!/bin/bash
# Script para reiniciar o backend com as variáveis de ambiente corretas

cd "$(dirname "$0")"

# Carregar variáveis do .env.prod
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas do .env.prod"
else
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

# Reiniciar o backend
echo "🔄 Reiniciando backend..."
docker-compose -f docker-compose.prod.yml up -d --build backend

echo "✅ Backend reiniciado!"
echo ""
echo "📋 Ver logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend"

