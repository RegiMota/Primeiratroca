#!/bin/bash
# Script para recriar o banco de dados PostgreSQL com a senha correta

cd "$(dirname "$0")"

echo "⚠️  ATENÇÃO: Este script vai APAGAR todos os dados do banco de dados!"
echo "   Certifique-se de ter um backup antes de continuar."
echo ""
read -p "Deseja continuar? (sim/não): " confirm

if [ "$confirm" != "sim" ]; then
    echo "Operação cancelada."
    exit 0
fi

# Carregar variáveis do .env.prod
if [ -f .env.prod ]; then
    source .env.prod
    echo ""
    echo "✅ Variáveis carregadas do .env.prod"
else
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

echo ""
echo "🛑 Parando containers..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "🗑️  Removendo volume do PostgreSQL..."
docker volume rm primeiratroca_postgres_data 2>/dev/null || echo "Volume não existe ou já foi removido"

echo ""
echo "🔄 Recriando containers com a senha correta..."
export $(cat .env.prod | grep -v '^#' | xargs)
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 15

echo ""
echo "✅ Banco de dados recriado e containers iniciados!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute as migrações: docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy"
echo "   2. Crie o usuário admin: docker-compose -f docker-compose.prod.yml exec backend node scripts/create-admin.js"
echo ""
echo "📋 Verificar status:"
echo "   ./verificar-status.sh"

