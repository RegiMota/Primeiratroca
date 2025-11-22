#!/bin/bash

# Script para corrigir a configuração do Nginx do admin para fazer proxy da API
# Adiciona a rota /api/ que faz proxy para o backend

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Corrigindo Nginx do Admin - Adicionando rota /api/${NC}"
echo ""

# Determinar onde está a configuração do Nginx
if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
    CONFIG_FILE="/etc/nginx/conf.d/primeira-troca-admin.conf"
    echo -e "${GREEN}✅ Usando /etc/nginx/conf.d/primeira-troca-admin.conf${NC}"
elif [ -f /etc/nginx/sites-available/primeira-troca-admin ]; then
    CONFIG_FILE="/etc/nginx/sites-available/primeira-troca-admin"
    echo -e "${GREEN}✅ Usando /etc/nginx/sites-available/primeira-troca-admin${NC}"
else
    echo -e "${RED}❌ Arquivo de configuração do admin não encontrado!${NC}"
    echo "Procurando arquivos relacionados ao admin..."
    find /etc/nginx -name "*admin*" -type f 2>/dev/null || true
    exit 1
fi

# Fazer backup
echo -e "${YELLOW}📋 Fazendo backup...${NC}"
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Backup criado${NC}"
echo ""

# Verificar se já tem a rota /api/
if grep -q "location /api/" "$CONFIG_FILE"; then
    echo -e "${YELLOW}⚠️  A rota /api/ já existe na configuração${NC}"
    echo "Verificando se está correta..."
    
    # Verificar se está fazendo proxy para o backend
    if grep -q "proxy_pass.*5000" "$CONFIG_FILE"; then
        echo -e "${GREEN}✅ Configuração parece correta${NC}"
        echo ""
        echo -e "${YELLOW}📋 Verificando se o backend está rodando...${NC}"
        if docker-compose -f /root/Primeiratroca/docker-compose.prod.yml ps backend | grep -q "Up"; then
            echo -e "${GREEN}✅ Backend está rodando${NC}"
        else
            echo -e "${RED}❌ Backend não está rodando!${NC}"
            echo "Iniciando backend..."
            cd /root/Primeiratroca
            docker-compose -f docker-compose.prod.yml up -d backend
            sleep 5
        fi
        
        echo ""
        echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
        nginx -t && systemctl reload nginx
        echo -e "${GREEN}✅ Nginx recarregado${NC}"
        exit 0
    fi
fi

# Criar configuração correta
echo -e "${YELLOW}📝 Criando configuração correta...${NC}"

cat > "$CONFIG_FILE" <<'EOF'
server {
    server_name admin.primeiratrocaecia.com.br;
    client_max_body_size 100M;
    
    # API e Webhook - IMPORTANTE: Deve vir ANTES da rota /
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin Frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/admin.primeiratrocaecia.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.primeiratrocaecia.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = admin.primeiratrocaecia.com.br) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name admin.primeiratrocaecia.com.br;
    return 404;
}
EOF

echo -e "${GREEN}✅ Configuração criada${NC}"
echo ""

# Verificar sintaxe
echo -e "${YELLOW}🔍 Verificando sintaxe do Nginx...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Sintaxe OK${NC}"
else
    echo -e "${RED}❌ Erro na sintaxe!${NC}"
    echo "Restaurando backup..."
    cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null || true
    exit 1
fi

# Verificar se backend está rodando
echo ""
echo -e "${YELLOW}📋 Verificando se o backend está rodando...${NC}"
cd /root/Primeiratroca 2>/dev/null || cd /var/www/primeira-troca/ecommerce-roupa-infantil 2>/dev/null || cd $(dirname $(readlink -f docker-compose.prod.yml)) 2>/dev/null || pwd

if docker-compose -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${YELLOW}⚠️  Backend não está rodando, iniciando...${NC}"
    docker-compose -f docker-compose.prod.yml up -d backend
    sleep 5
    echo -e "${GREEN}✅ Backend iniciado${NC}"
fi

# Recarregar Nginx
echo ""
echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
systemctl reload nginx || systemctl restart nginx
echo -e "${GREEN}✅ Nginx recarregado${NC}"

# Testar conexão
echo ""
echo -e "${YELLOW}🧪 Testando conexão com o backend...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -q "200\|401"; then
    echo -e "${GREEN}✅ Backend está respondendo${NC}"
else
    echo -e "${YELLOW}⚠️  Backend pode não estar respondendo corretamente${NC}"
    echo "Verifique os logs: docker-compose -f docker-compose.prod.yml logs backend"
fi

echo ""
echo -e "${GREEN}✅ Correção concluída!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "   1. Acesse: https://admin.primeiratrocaecia.com.br"
echo "   2. Tente fazer login novamente"
echo "   3. A rota /api/ agora faz proxy para o backend na porta 5000"
echo ""
echo -e "${YELLOW}🔍 Se ainda houver problemas, verifique:${NC}"
echo "   - Logs do Nginx: tail -f /var/log/nginx/error.log"
echo "   - Logs do backend: docker-compose -f docker-compose.prod.yml logs -f backend"
echo "   - Status do backend: docker-compose -f docker-compose.prod.yml ps backend"

