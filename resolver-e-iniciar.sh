#!/bin/bash
# Script para resolver conflitos do git e iniciar todos os containers

cd "$(dirname "$0")"

echo "🔄 Resolvendo conflitos do git..."
git stash
git pull origin main

echo ""
echo "✅ Código atualizado!"
echo ""

# Dar permissão de execução aos scripts
chmod +x iniciar-todos.sh verificar-status.sh recriar-banco.sh

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
sleep 15

echo ""
echo "✅ Containers iniciados!"
echo ""
echo "📋 Verificar status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute as migrações: docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy"
echo "   2. Crie o usuário admin: docker-compose -f docker-compose.prod.yml exec backend node scripts/create-admin.js"

