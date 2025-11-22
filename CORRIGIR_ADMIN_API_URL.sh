#!/bin/bash

# Script para corrigir a URL da API no admin panel
# Corrige o VITE_API_URL no .env.prod e reconstrói o admin

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Corrigindo URL da API no Admin Panel...${NC}"
echo ""

# Verificar diretório
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: Execute no diretório do projeto${NC}"
    exit 1
fi

# Verificar se .env.prod existe
if [ ! -f ".env.prod" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.prod não encontrado!${NC}"
    echo -e "${YELLOW}📝 Criando .env.prod...${NC}"
    
    # Gerar senhas
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32 2>/dev/null || echo "primeiratroca123")
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "sua_chave_secreta_aqui")
    
    cat > .env.prod << EOF
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=primeiratroca

# JWT Secret
JWT_SECRET=$JWT_SECRET

# API URL - Usar caminho relativo (Nginx faz proxy)
# Em produção, o admin está em admin.primeiratrocaecia.com.br
# e a API está em primeiratrocaecia.com.br/api (mesmo domínio via Nginx)
VITE_API_URL=/api

# CORS Origins
CORS_ORIGIN=https://primeiratrocaecia.com.br,https://www.primeiratrocaecia.com.br,https://admin.primeiratrocaecia.com.br

# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000
EOF
    echo -e "${GREEN}✅ .env.prod criado!${NC}"
else
    echo -e "${GREEN}✅ .env.prod encontrado${NC}"
fi

# Atualizar VITE_API_URL no .env.prod
echo -e "${YELLOW}📝 Atualizando VITE_API_URL...${NC}"

# Remover linhas antigas com seudominio ou api.primeiratrocaecia
sed -i '/^VITE_API_URL=/d' .env.prod

# Adicionar a linha correta
# Em produção, usar caminho relativo /api (Nginx faz proxy)
echo "VITE_API_URL=/api" >> .env.prod

echo -e "${GREEN}✅ VITE_API_URL atualizado para /api${NC}"
echo ""

# Mostrar a configuração atual
echo -e "${YELLOW}📋 Configuração atual do VITE_API_URL:${NC}"
grep VITE_API_URL .env.prod || echo "VITE_API_URL=/api"
echo ""

# Carregar variáveis do .env.prod
export $(cat .env.prod | grep -v '^#' | xargs)

# Parar o admin
echo -e "${YELLOW}🛑 Parando container do admin...${NC}"
docker-compose -f docker-compose.prod.yml stop admin || true

# Reconstruir o admin com a URL correta
echo -e "${YELLOW}🔨 Reconstruindo admin com URL correta...${NC}"
echo -e "${YELLOW}   (Isso pode levar alguns minutos)${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache admin

# Iniciar o admin
echo -e "${YELLOW}🚀 Iniciando admin...${NC}"
docker-compose -f docker-compose.prod.yml up -d admin

# Aguardar alguns segundos
sleep 5

# Verificar status
echo ""
echo -e "${YELLOW}📊 Status do admin:${NC}"
docker-compose -f docker-compose.prod.yml ps admin

# Verificar logs
echo ""
echo -e "${YELLOW}📋 Últimas linhas dos logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20 admin

echo ""
echo -e "${GREEN}✅ Correção concluída!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Acesse: https://admin.primeiratrocaecia.com.br"
echo "   2. Tente fazer login novamente"
echo "   3. A API agora deve usar: /api (caminho relativo via Nginx)"
echo ""
echo -e "${YELLOW}🔍 Se ainda houver problemas, verifique os logs:${NC}"
echo "   docker-compose -f docker-compose.prod.yml logs -f admin"

