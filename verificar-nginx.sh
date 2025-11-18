#!/bin/bash
# Script para verificar e corrigir configuração do Nginx

cd "$(dirname "$0")"

DOMAIN="primeiratrocaecia.com.br"
NGINX_CONFIG_DIR="/etc/nginx/conf.d"
API_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-api.conf"

echo "🔍 Verificando configuração do Nginx..."
echo ""

# Verificar se o arquivo existe
if [ ! -f "$API_CONFIG" ]; then
    echo "⚠️  Arquivo de configuração da API não encontrado!"
    echo "📝 Criando configuração do Nginx para API..."
    
    # Criar configuração da API
    cat > "$API_CONFIG" << EOF
upstream backend {
    server localhost:5000;
}
server {
    listen 80;
    server_name api.$DOMAIN;
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    echo "✅ Configuração criada!"
else
    echo "✅ Arquivo de configuração encontrado: $API_CONFIG"
    echo ""
    echo "📄 Conteúdo do arquivo:"
    cat "$API_CONFIG"
fi

echo ""
echo "🔍 Verificando sintaxe do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sintaxe do Nginx está correta!"
    echo ""
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx recarregado com sucesso!"
    else
        echo "❌ Erro ao recarregar Nginx. Tentando reiniciar..."
        systemctl restart nginx
    fi
else
    echo ""
    echo "❌ Erro na sintaxe do Nginx! Verifique o arquivo de configuração."
    exit 1
fi

echo ""
echo "📋 Verificando se o backend está respondendo na porta 5000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null | grep -q "200\|404"; then
    echo "✅ Backend está respondendo na porta 5000"
else
    echo "⚠️  Backend não está respondendo na porta 5000"
    echo "   Verifique se o container está rodando: docker-compose -f docker-compose.prod.yml ps"
fi

