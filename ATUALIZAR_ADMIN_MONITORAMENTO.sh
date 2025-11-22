#!/bin/bash

# Script específico para atualizar o admin com a nova página de monitoramento
# Este script atualiza o código, instala nova dependência e reconstrói o admin

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Atualizando Admin Panel com página de Monitoramento...${NC}"
echo ""

# Verificar diretório
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: Execute no diretório do projeto${NC}"
    exit 1
fi

# Determinar qual docker-compose usar
COMPOSE_FILE="docker-compose.prod.yml"
[ ! -f "$COMPOSE_FILE" ] && COMPOSE_FILE="docker-compose.yml"

echo -e "${GREEN}✅ Usando $COMPOSE_FILE${NC}"
echo ""

# Passo 1: Atualizar código
echo -e "${YELLOW}📥 Atualizando código do GitHub...${NC}"
git fetch origin
git pull origin main || git pull origin master
echo -e "${GREEN}✅ Código atualizado${NC}"
echo ""

# Passo 2: Parar o container do admin
echo -e "${YELLOW}🛑 Parando container do admin...${NC}"
docker-compose -f $COMPOSE_FILE stop admin || true
echo -e "${GREEN}✅ Admin parado${NC}"
echo ""

# Passo 3: Reconstruir o admin (isso instala a nova dependência e faz build)
echo -e "${YELLOW}🔨 Reconstruindo container do admin...${NC}"
echo -e "${YELLOW}   (Isso pode levar alguns minutos)${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache admin
echo -e "${GREEN}✅ Admin reconstruído${NC}"
echo ""

# Passo 4: Iniciar o admin
echo -e "${YELLOW}🚀 Iniciando admin...${NC}"
docker-compose -f $COMPOSE_FILE up -d admin
echo -e "${GREEN}✅ Admin iniciado${NC}"
echo ""

# Passo 5: Aguardar alguns segundos
echo -e "${YELLOW}⏳ Aguardando admin inicializar...${NC}"
sleep 5

# Passo 6: Verificar status
echo -e "${YELLOW}📊 Verificando status...${NC}"
docker-compose -f $COMPOSE_FILE ps admin

# Passo 7: Verificar logs (últimas 20 linhas)
echo ""
echo -e "${YELLOW}📋 Últimas linhas dos logs do admin:${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=20 admin

echo ""
echo -e "${GREEN}✅ Atualização concluída!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Acesse: https://admin.primeiratrocaecia.com.br"
echo "   2. Faça login no painel admin"
echo "   3. Procure por 'Monitoramento' no menu lateral"
echo "   4. Ou acesse diretamente: https://admin.primeiratrocaecia.com.br/monitoring"
echo ""
echo -e "${YELLOW}🔍 Se não aparecer, verifique os logs:${NC}"
echo "   docker-compose -f $COMPOSE_FILE logs -f admin"

