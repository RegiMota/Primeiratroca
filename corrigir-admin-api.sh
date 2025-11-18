#!/bin/bash
# Script para corrigir a URL da API no admin

cd "$(dirname "$0")"

echo "🔧 Corrigindo URL da API no .env.prod..."
echo ""

# Verificar se .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

# Atualizar VITE_API_URL para incluir /api
sed -i 's|VITE_API_URL=https://api\.primeiratrocaecia\.com\.br$|VITE_API_URL=https://api.primeiratrocaecia.com.br/api|g' .env.prod
sed -i 's|VITE_API_URL=https://api\.primeiratrocaecia\.com\.br/api/api|VITE_API_URL=https://api.primeiratrocaecia.com.br/api|g' .env.prod

echo "✅ .env.prod atualizado!"
echo ""
echo "📄 Verificando VITE_API_URL:"
grep VITE_API_URL .env.prod
echo ""

# Carregar variáveis
export $(cat .env.prod | grep -v '^#' | xargs)

echo "🔄 Reconstruindo container do admin com a URL correta..."
docker-compose -f docker-compose.prod.yml up -d --build admin

echo ""
echo "✅ Container do admin reconstruído!"
echo ""
echo "📋 Verificar status:"
docker-compose -f docker-compose.prod.yml ps admin
echo ""
echo "🧪 Teste o login em: https://admin.primeiratrocaecia.com.br/login"

