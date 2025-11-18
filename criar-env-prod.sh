#!/bin/bash
# Script para criar o arquivo .env.prod

cd "$(dirname "$0")"

DOMAIN="primeiratrocaecia.com.br"

echo "🔐 Gerando senhas seguras para .env.prod..."
echo ""

# Função para gerar senha aleatória
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Gerar senhas
POSTGRES_PASSWORD=$(generate_password)
JWT_SECRET=$(openssl rand -hex 32)

echo "📝 Criando arquivo .env.prod..."
cat > .env.prod << EOF
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=primeiratroca

# JWT Secret
JWT_SECRET=$JWT_SECRET

# API URL
VITE_API_URL=https://api.$DOMAIN

# CORS Origins (domínios permitidos para requisições)
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,https://admin.$DOMAIN

# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000
EOF

echo "✅ Arquivo .env.prod criado!"
echo ""
echo "⚠️  IMPORTANTE: As senhas foram geradas novamente!"
echo "   Se você tinha um banco de dados existente, será necessário recriá-lo."
echo ""
echo "📋 Senhas geradas (salve em local seguro!):"
echo "   POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "   JWT_SECRET: $JWT_SECRET"
echo ""
echo "📋 Próximos passos:"
echo "   1. Se você tinha dados no banco, recrie-o: ./recriar-banco.sh"
echo "   2. Ou inicie os containers: ./iniciar-todos.sh"

