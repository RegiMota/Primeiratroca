#!/bin/bash
# Script para corrigir a configuração do Nginx para WebSocket

cd "$(dirname "$0")"

DOMAIN="primeiratrocaecia.com.br"

echo "🔧 Corrigindo configuração do Nginx para WebSocket..."
echo ""

# Detectar diretório de configuração do Nginx
if [ -d "/etc/nginx/conf.d" ]; then
    NGINX_CONFIG_DIR="/etc/nginx/conf.d"
    API_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-api.conf"
elif [ -d "/etc/nginx/sites-available" ]; then
    NGINX_CONFIG_DIR="/etc/nginx/sites-available"
    API_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-api"
else
    echo "❌ Diretório de configuração do Nginx não encontrado!"
    exit 1
fi

echo "📝 Atualizando configuração da API em: $API_CONFIG"
echo ""

# Criar/atualizar configuração da API com suporte completo a WebSocket
cat > "$API_CONFIG" << EOF
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name api.$DOMAIN;
    client_max_body_size 10M;

    # Timeouts aumentados para WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # Headers padrão
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    # WebSocket support - DEVE vir ANTES da location /
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        
        # Headers essenciais para WebSocket
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts específicos para WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # Desabilitar buffering para WebSocket
        proxy_buffering off;
    }

    # API routes - DEVE vir DEPOIS da location /socket.io/
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Suporte para upgrade de conexão (fallback)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Mapeamento de conexão para upgrade
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    '' close;
}
EOF

echo "✅ Configuração atualizada!"
echo ""

# Se for Debian-based, habilitar o site
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "🔗 Habilitando site..."
    ln -sf "$API_CONFIG" /etc/nginx/sites-enabled/primeira-troca-api 2>/dev/null || true
fi

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
echo "✅ Configuração do WebSocket atualizada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique se o backend está rodando: docker-compose -f docker-compose.prod.yml ps"
echo "   2. Teste a conexão WebSocket no navegador"
echo "   3. Se ainda houver problemas, verifique os logs:"
echo "      - Nginx: tail -f /var/log/nginx/error.log"
echo "      - Backend: docker-compose -f docker-compose.prod.yml logs -f backend"

