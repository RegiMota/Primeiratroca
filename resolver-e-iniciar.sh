#!/bin/bash
# Script para resolver conflitos do git e iniciar todos os containers

cd "$(dirname "$0")"

echo "🔄 Resolvendo conflitos do git..."
# Forçar descarte de mudanças locais e atualizar
git reset --hard HEAD
git clean -fd
git pull origin main

echo ""
echo "✅ Código atualizado!"
echo ""

# Dar permissão de execução aos scripts
chmod +x iniciar-todos.sh verificar-status.sh recriar-banco.sh

echo "🚀 Iniciando todos os containers..."
echo ""

# Verificar e criar .env.prod se não existir
if [ ! -f .env.prod ]; then
    echo "⚠️  Arquivo .env.prod não encontrado!"
    echo "📝 Criando .env.prod..."
    if [ -f criar-env-prod.sh ]; then
        chmod +x criar-env-prod.sh
        ./criar-env-prod.sh
    else
        echo "❌ Script criar-env-prod.sh não encontrado!"
        echo "   Execute: git pull origin main"
        exit 1
    fi
fi

# Carregar variáveis do .env.prod
export $(cat .env.prod | grep -v '^#' | xargs)
echo "✅ Variáveis de ambiente carregadas do .env.prod"

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

