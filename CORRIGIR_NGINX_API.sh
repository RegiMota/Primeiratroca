#!/bin/bash

echo "=========================================="
echo "🔧 CORRIGIR CONFIGURAÇÃO NGINX PARA /api/"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/primeira-troca-frontend.conf"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

echo "1️⃣ Fazendo backup da configuração atual..."
echo "--------------------------------------------"
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado"
echo ""

echo "2️⃣ Verificando se já existe configuração /api/..."
echo "--------------------------------------------"
if grep -q "location /api/" "$NGINX_CONFIG"; then
    echo "⚠️  Configuração /api/ já existe. Verificando se está correta..."
    grep -A 10 "location /api/" "$NGINX_CONFIG"
    echo ""
    read -p "Deseja substituir? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
    # Remover configuração antiga
    sudo sed -i '/location \/api\/ {/,/}/d' "$NGINX_CONFIG"
fi

echo "3️⃣ Adicionando configuração /api/..."
echo "--------------------------------------------"

# Verificar se existe um bloco server
if ! grep -q "server {" "$NGINX_CONFIG"; then
    echo "❌ Arquivo não contém bloco server. Verifique manualmente."
    exit 1
fi

# Adicionar configuração /api/ antes do fechamento do bloco server
# Procurar por "location /" e adicionar antes dele, ou no final do bloco server
if grep -q "location / {" "$NGINX_CONFIG"; then
    # Adicionar antes de "location /"
    sudo sed -i '/location \/ {/i\
    # Proxy para API do backend\
    location /api/ {\
        proxy_pass http://localhost:5000;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_cache_bypass $http_upgrade;\
        proxy_read_timeout 300s;\
        proxy_connect_timeout 75s;\
    }\
' "$NGINX_CONFIG"
else
    # Adicionar antes do fechamento do bloco server
    sudo sed -i '/^}$/i\
    # Proxy para API do backend\
    location /api/ {\
        proxy_pass http://localhost:5000;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_cache_bypass $http_upgrade;\
        proxy_read_timeout 300s;\
        proxy_connect_timeout 75s;\
    }\
' "$NGINX_CONFIG"
fi

echo "✅ Configuração adicionada"
echo ""

echo "4️⃣ Verificando sintaxe do Nginx..."
echo "--------------------------------------------"
if sudo nginx -t; then
    echo "✅ Sintaxe correta!"
    echo ""
    echo "5️⃣ Recarregando Nginx..."
    echo "--------------------------------------------"
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado"
    echo ""
    echo "6️⃣ Testando conexão..."
    echo "--------------------------------------------"
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://primeiratrocaecia.com.br/api/health)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ API está respondendo corretamente!"
    else
        echo "⚠️  Código HTTP: $HTTP_CODE"
        echo "   Verifique se o backend está rodando: docker-compose ps backend"
    fi
else
    echo "❌ Erro na sintaxe do Nginx!"
    echo "   Restaurando backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || echo "   Não foi possível restaurar backup automaticamente"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ CONCLUÍDO"
echo "=========================================="

