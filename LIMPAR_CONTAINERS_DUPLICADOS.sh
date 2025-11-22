#!/bin/bash

# Script para limpar containers duplicados e manter apenas os de produção

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Limpando containers duplicados...${NC}"
echo ""

cd /root/Primeiratroca || cd /var/www/primeira-troca/ecommerce-roupa-infantil || pwd

# Listar todos os containers
echo -e "${YELLOW}📋 Containers atuais:${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "primeira-troca|NAME"
echo ""

# Parar e remover containers de desenvolvimento (sem -prod)
echo -e "${YELLOW}🛑 Parando containers de desenvolvimento...${NC}"

# Parar docker-compose.yml (desenvolvimento)
if [ -f "docker-compose.yml" ]; then
    echo "Parando docker-compose.yml..."
    docker-compose -f docker-compose.yml down 2>/dev/null || true
fi

# Parar docker-compose.dev.yml (desenvolvimento)
if [ -f "docker-compose.dev.yml" ]; then
    echo "Parando docker-compose.dev.yml..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
fi

# Remover containers individuais de desenvolvimento (sem -prod)
echo -e "${YELLOW}🗑️  Removendo containers de desenvolvimento...${NC}"

CONTAINERS_TO_REMOVE=(
    "primeira-troca-db"
    "primeira-troca-backend"
    "primeira-troca-frontend"
    "primeira-troca-admin"
    "primeira-troca-db-dev"
    "primeira-troca-backend-dev"
    "primeira-troca-frontend-dev"
    "primeira-troca-admin-dev"
)

for container in "${CONTAINERS_TO_REMOVE[@]}"; do
    if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
        echo "Removendo $container..."
        docker stop "$container" 2>/dev/null || true
        docker rm -f "$container" 2>/dev/null || true
    fi
done

# Manter apenas containers de produção (-prod)
echo ""
echo -e "${YELLOW}✅ Mantendo apenas containers de produção:${NC}"
echo ""

# Verificar se docker-compose.prod.yml existe
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ docker-compose.prod.yml não encontrado!${NC}"
    exit 1
fi

# Parar todos os containers de produção primeiro
echo -e "${YELLOW}🛑 Parando containers de produção...${NC}"
docker-compose -f docker-compose.prod.yml down

# Aguardar um pouco
sleep 2

# Iniciar apenas containers de produção
echo -e "${YELLOW}🚀 Iniciando apenas containers de produção...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
echo -e "${YELLOW}⏳ Aguardando containers iniciarem...${NC}"
sleep 5

# Listar containers finais
echo ""
echo -e "${GREEN}📋 Containers finais (apenas produção):${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo ""
echo -e "${YELLOW}💡 Agora você tem apenas os containers de produção:${NC}"
echo "   - primeira-troca-db-prod"
echo "   - primeira-troca-backend-prod"
echo "   - primeira-troca-frontend-prod"
echo "   - primeira-troca-admin-prod"
echo ""
echo -e "${YELLOW}🔍 Verificar status:${NC}"
echo "   docker-compose -f docker-compose.prod.yml ps"

