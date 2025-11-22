#!/bin/bash

# Script completo para diagnosticar erro 502 no admin

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnóstico completo do erro 502 no Admin${NC}"
echo "=========================================="
echo ""

cd /root/Primeiratroca 2>/dev/null || cd /var/www/primeira-troca/ecommerce-roupa-infantil 2>/dev/null || pwd

# 1. Verificar se o backend está rodando
echo -e "${YELLOW}1️⃣ Verificando se o backend está rodando...${NC}"
if docker-compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
    docker-compose -f docker-compose.prod.yml ps backend
else
    echo -e "${RED}❌ Backend NÃO está rodando!${NC}"
    echo "Iniciando backend..."
    docker-compose -f docker-compose.prod.yml up -d backend
    sleep 5
fi
echo ""

# 2. Verificar se o backend está respondendo na porta 5000
echo -e "${YELLOW}2️⃣ Testando se o backend responde na porta 5000...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -qE "200|401|404"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
    echo -e "${GREEN}✅ Backend responde com código HTTP: $HTTP_CODE${NC}"
    curl -s http://localhost:5000/api/health | head -5 || echo "Resposta vazia"
else
    echo -e "${RED}❌ Backend NÃO está respondendo na porta 5000!${NC}"
    echo "Verificando logs do backend..."
    docker-compose -f docker-compose.prod.yml logs --tail=20 backend
fi
echo ""

# 3. Verificar configuração do Nginx do admin
echo -e "${YELLOW}3️⃣ Verificando configuração do Nginx do admin...${NC}"
NGINX_ADMIN_CONF=""
if [ -f "/etc/nginx/conf.d/primeira-troca-admin.conf" ]; then
    NGINX_ADMIN_CONF="/etc/nginx/conf.d/primeira-troca-admin.conf"
elif [ -f "/etc/nginx/sites-available/primeira-troca-admin" ]; then
    NGINX_ADMIN_CONF="/etc/nginx/sites-available/primeira-troca-admin"
else
    echo -e "${RED}❌ Arquivo de configuração do admin não encontrado!${NC}"
    find /etc/nginx -name "*admin*" -type f 2>/dev/null || true
fi

if [ -n "$NGINX_ADMIN_CONF" ]; then
    echo -e "${GREEN}✅ Arquivo encontrado: $NGINX_ADMIN_CONF${NC}"
    echo ""
    echo -e "${YELLOW}📋 Verificando se tem rota /api/:${NC}"
    if grep -q "location /api/" "$NGINX_ADMIN_CONF"; then
        echo -e "${GREEN}✅ Rota /api/ encontrada${NC}"
        echo ""
        echo -e "${YELLOW}📋 Configuração da rota /api/:${NC}"
        grep -A 10 "location /api/" "$NGINX_ADMIN_CONF" | head -12
    else
        echo -e "${RED}❌ Rota /api/ NÃO encontrada!${NC}"
        echo "Executando script de correção..."
        if [ -f "CORRIGIR_NGINX_ADMIN_API.sh" ]; then
            chmod +x CORRIGIR_NGINX_ADMIN_API.sh
            ./CORRIGIR_NGINX_ADMIN_API.sh
        fi
    fi
fi
echo ""

# 4. Verificar sintaxe do Nginx
echo -e "${YELLOW}4️⃣ Verificando sintaxe do Nginx...${NC}"
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✅ Sintaxe do Nginx está OK${NC}"
else
    echo -e "${RED}❌ Erro na sintaxe do Nginx!${NC}"
    nginx -t
    echo ""
    echo "Corrigindo..."
    if [ -f "CORRIGIR_NGINX_DUPLICADO.sh" ]; then
        chmod +x CORRIGIR_NGINX_DUPLICADO.sh
        ./CORRIGIR_NGINX_DUPLICADO.sh
    fi
fi
echo ""

# 5. Verificar se o Nginx está rodando
echo -e "${YELLOW}5️⃣ Verificando status do Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está rodando${NC}"
else
    echo -e "${RED}❌ Nginx NÃO está rodando!${NC}"
    echo "Iniciando Nginx..."
    systemctl start nginx
fi
echo ""

# 6. Testar proxy do Nginx
echo -e "${YELLOW}6️⃣ Testando proxy do Nginx para o backend...${NC}"
# Testar via localhost primeiro
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null | grep -qE "200|401|404"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null)
    echo -e "${GREEN}✅ Nginx consegue fazer proxy (código: $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx não consegue fazer proxy via localhost${NC}"
    echo "Isso pode ser normal se o Nginx não estiver configurado para localhost"
fi
echo ""

# 7. Verificar logs do Nginx
echo -e "${YELLOW}7️⃣ Últimas linhas dos logs de erro do Nginx:${NC}"
tail -20 /var/log/nginx/error.log 2>/dev/null | grep -i "502\|bad gateway\|upstream\|backend" || echo "Nenhum erro relacionado encontrado"
echo ""

# 8. Verificar logs do backend
echo -e "${YELLOW}8️⃣ Últimas linhas dos logs do backend:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend | tail -20
echo ""

# 9. Verificar conectividade de rede
echo -e "${YELLOW}9️⃣ Verificando conectividade de rede...${NC}"
if docker exec primeira-troca-backend-prod ping -c 1 postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend consegue acessar o banco de dados${NC}"
else
    echo -e "${YELLOW}⚠️  Backend pode ter problemas para acessar o banco${NC}"
fi

# Verificar se o backend está escutando na porta 5000
if docker exec primeira-troca-backend-prod netstat -tuln 2>/dev/null | grep -q ":5000" || docker exec primeira-troca-backend-prod ss -tuln 2>/dev/null | grep -q ":5000"; then
    echo -e "${GREEN}✅ Backend está escutando na porta 5000${NC}"
else
    echo -e "${RED}❌ Backend NÃO está escutando na porta 5000!${NC}"
fi
echo ""

# 10. Resumo e recomendações
echo -e "${BLUE}📊 RESUMO E RECOMENDAÇÕES:${NC}"
echo "=========================================="
echo ""

# Verificar se tudo está OK
ISSUES=0

if ! docker-compose -f docker-compose.prod.yml ps backend | grep -q "Up"; then
    echo -e "${RED}❌ Backend não está rodando${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend não responde na porta 5000${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -z "$NGINX_ADMIN_CONF" ] || ! grep -q "location /api/" "$NGINX_ADMIN_CONF" 2>/dev/null; then
    echo -e "${RED}❌ Nginx não tem rota /api/ configurada${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${RED}❌ Nginx tem erros de sintaxe${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo parece estar configurado corretamente${NC}"
    echo ""
    echo -e "${YELLOW}💡 Se ainda houver erro 502, tente:${NC}"
    echo "   1. Recarregar Nginx: systemctl reload nginx"
    echo "   2. Reiniciar backend: docker-compose -f docker-compose.prod.yml restart backend"
    echo "   3. Verificar firewall: firewall-cmd --list-all (se usar firewalld)"
else
    echo -e "${RED}❌ Encontrados $ISSUES problema(s)${NC}"
    echo ""
    echo -e "${YELLOW}💡 Execute os scripts de correção:${NC}"
    echo "   ./CORRIGIR_NGINX_ADMIN_API.sh"
    echo "   ./CORRIGIR_NGINX_DUPLICADO.sh"
fi

echo ""
echo -e "${BLUE}🔍 Para mais detalhes, verifique:${NC}"
echo "   - Logs do Nginx: tail -f /var/log/nginx/error.log"
echo "   - Logs do backend: docker-compose -f docker-compose.prod.yml logs -f backend"
echo "   - Status dos containers: docker-compose -f docker-compose.prod.yml ps"

