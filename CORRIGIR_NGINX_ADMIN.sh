#!/bin/bash

echo "🔧 Corrigindo Nginx do Admin - Adicionando rota /api/"
echo "===================================================="
echo ""

# Fazer backup
echo "📋 Fazendo backup..."
if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
    cp /etc/nginx/conf.d/primeira-troca-admin.conf /etc/nginx/conf.d/primeira-troca-admin.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
else
    echo "⚠️  Arquivo não existe, será criado"
fi
echo ""

# Corrigir Admin - adicionar rota /api/ para o backend
echo "📝 Corrigindo configuração do Admin..."
cat > /etc/nginx/conf.d/primeira-troca-admin.conf <<'EOF'
# Upstream já definido em primeira-troca-api.conf
# Usando localhost:5000 diretamente para evitar duplicação

server {
    server_name admin.primeiratrocaecia.com.br;
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

echo "✅ Configuração criada"
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
    echo "Teste admin local:"
    curl -s http://localhost:8081 | head -1
    echo ""
    echo "Teste API via admin:"
    curl -s http://localhost:5000/api/health | head -1
    echo ""
    echo "===================================="
    echo "✅ Configuração corrigida!"
    echo ""
    echo "🌐 Agora teste pela internet:"
    echo "   curl https://admin.primeiratrocaecia.com.br/api/health"
    echo ""
    echo "💡 Limpe o cache do navegador e tente fazer login novamente!"
else
    echo ""
    echo "❌ Erro na sintaxe! Verifique os arquivos."
    exit 1
fi

