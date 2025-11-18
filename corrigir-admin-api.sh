#!/bin/bash
# Script para corrigir a URL da API no admin

cd "$(dirname "$0")"

echo "🔧 Corrigindo URL da API no .env.prod..."
echo ""

# Verificar se .env.prod existe, se não, criar
if [ ! -f .env.prod ]; then
    echo "⚠️  Arquivo .env.prod não encontrado!"
    echo "📝 Criando .env.prod..."
    if [ -f criar-env-prod.sh ]; then
        chmod +x criar-env-prod.sh
        ./criar-env-prod.sh
    else
        echo "❌ Script criar-env-prod.sh não encontrado!"
        echo "   Criando .env.prod manualmente..."
        DOMAIN="primeiratrocaecia.com.br"
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        JWT_SECRET=$(openssl rand -hex 32)
        cat > .env.prod << EOF
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=primeiratroca

# JWT Secret
JWT_SECRET=$JWT_SECRET

# API URL (deve terminar com /api)
VITE_API_URL=https://api.$DOMAIN/api

# CORS Origins (domínios permitidos para requisições)
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,https://admin.$DOMAIN

# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000
EOF
        echo "✅ .env.prod criado!"
    fi
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

