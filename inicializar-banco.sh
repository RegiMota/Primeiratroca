#!/bin/bash
# Script para inicializar o banco de dados (criar tabelas)

cd "$(dirname "$0")"

echo "📊 Inicializando banco de dados..."
echo ""

# Carregar variáveis do .env.prod
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas do .env.prod"
else
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

echo ""
echo "🔄 Criando tabelas no banco de dados usando prisma db push..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma db push --accept-data-loss

echo ""
echo "✅ Tabelas criadas!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Crie o usuário admin: docker-compose -f docker-compose.prod.yml exec backend node scripts/create-admin.js"

