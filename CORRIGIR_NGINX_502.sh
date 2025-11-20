#!/bin/bash

echo "🔧 Corrigindo 502 Bad Gateway - Nginx"
echo "===================================="
echo ""

# Fazer backup
echo "📋 Fazendo backup..."
cp /etc/nginx/conf.d/primeira-troca-frontend.conf /etc/nginx/conf.d/primeira-troca-frontend.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

# Corrigir arquivo (sem upstream, usando localhost:5000 diretamente)
echo "📝 Corrigindo configuração do frontend..."
cat > /etc/nginx/conf.d/primeira-troca-frontend.conf <<'EOF'
# Upstream já definido em primeira-troca-api.conf
# Usando localhost:5000 diretamente para evitar duplicação

server {
    server_name primeiratrocaecia.com.br www.primeiratrocaecia.com.br;
    client_max_body_size 10M;
    
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
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
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
    ssl_certificate /etc/letsencrypt/live/primeiratrocaecia.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/primeiratrocaecia.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.primeiratrocaecia.com.br) {
        return 301 https://$host$request_uri;
    }
    if ($host = primeiratrocaecia.com.br) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name primeiratrocaecia.com.br www.primeiratrocaecia.com.br;
    return 404;
}
EOF

echo "✅ Frontend corrigido"
echo ""

# Testar sintaxe
echo "🔍 Testando sintaxe do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sintaxe OK! Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
    echo ""
    echo "🧪 Testando configuração..."
    echo ""
    echo "Teste API local:"
    curl -s http://localhost:5000/api/health | head -1
    echo ""
    echo "Teste API via HTTPS:"
    curl -s https://primeiratrocaecia.com.br/api/health | head -1
    echo ""
    echo "===================================="
    echo "✅ Configuração corrigida!"
else
    echo ""
    echo "❌ Erro na sintaxe! Verifique os arquivos."
    exit 1
fi

