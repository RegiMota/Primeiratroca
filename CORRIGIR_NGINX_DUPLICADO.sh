#!/bin/bash

# Script para corrigir diretiva duplicada no nginx.conf

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Corrigindo diretiva duplicada no nginx.conf...${NC}"
echo ""

NGINX_CONF="/etc/nginx/nginx.conf"

if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}❌ Arquivo $NGINX_CONF não encontrado!${NC}"
    exit 1
fi

# Fazer backup
echo -e "${YELLOW}📋 Fazendo backup...${NC}"
cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Backup criado${NC}"
echo ""

# Verificar quantas vezes client_max_body_size aparece
COUNT=$(grep -c "client_max_body_size" "$NGINX_CONF" || echo "0")
echo -e "${YELLOW}📊 Encontradas $COUNT ocorrências de client_max_body_size${NC}"

if [ "$COUNT" -le 1 ]; then
    echo -e "${GREEN}✅ Não há duplicatas${NC}"
    nginx -t && echo -e "${GREEN}✅ Configuração está correta${NC}"
    exit 0
fi

# Remover todas as ocorrências de client_max_body_size
echo -e "${YELLOW}📝 Removendo todas as ocorrências de client_max_body_size...${NC}"
sed -i '/client_max_body_size/d' "$NGINX_CONF"

# Adicionar uma única ocorrência no bloco http, antes do primeiro server ou include
echo -e "${YELLOW}📝 Adicionando client_max_body_size no local correto...${NC}"

# Verificar se existe bloco http
if grep -q "^http {" "$NGINX_CONF" || grep -q "^http{" "$NGINX_CONF"; then
    # Adicionar após a linha "http {" ou "{"
    sed -i '/^http[[:space:]]*{/a\    client_max_body_size 100M;' "$NGINX_CONF"
else
    # Se não houver bloco http explícito, adicionar no início
    sed -i '1i\client_max_body_size 100M;' "$NGINX_CONF"
fi

# Verificar sintaxe
echo ""
echo -e "${YELLOW}🔍 Verificando sintaxe...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Sintaxe OK${NC}"
    
    # Recarregar Nginx
    echo ""
    echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
    systemctl reload nginx || systemctl restart nginx
    echo -e "${GREEN}✅ Nginx recarregado${NC}"
else
    echo -e "${RED}❌ Erro na sintaxe!${NC}"
    echo "Restaurando backup..."
    cp "${NGINX_CONF}.backup."* "$NGINX_CONF" 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Correção concluída!${NC}"
echo ""
echo -e "${YELLOW}📋 Verificando configuração final:${NC}"
grep "client_max_body_size" "$NGINX_CONF" || echo "Nenhuma ocorrência encontrada (pode estar em arquivos incluídos)"

