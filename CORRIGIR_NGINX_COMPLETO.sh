#!/bin/bash

echo "🔧 Corrigindo Configuração do Nginx"
echo "===================================="
echo ""

# Fazer backup
echo "📋 Fazendo backup das configurações..."
cp /etc/nginx/conf.d/primeira-troca-frontend.conf /etc/nginx/conf.d/primeira-troca-frontend.conf.backup 2>/dev/null
cp /etc/nginx/conf.d/primeira-troca-api.conf /etc/nginx/conf.d/primeira-troca-api.conf.backup 2>/dev/null
cp /etc/nginx/conf.d/primeira-troca-admin.conf /etc/nginx/conf.d/primeira-troca-admin.conf.backup 2>/dev/null
echo "✅ Backup criado"
echo ""

# Corrigir frontend - adicionar rota /api/ e corrigir porta
# NOTA: Não criar upstream aqui, já existe no primeira-troca-api.conf
# Usar localhost:5000 diretamente para evitar duplicação
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
    
    # Frontend - CORRIGIDO: porta 3000 ao invés de 8080
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

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/primeiratrocaecia.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/primeiratrocaecia.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.primeiratrocaecia.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = primeiratrocaecia.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name primeiratrocaecia.com.br www.primeiratrocaecia.com.br;
    return 404; # managed by Certbot
}
EOF

echo "✅ Frontend corrigido"
echo ""

# Manter API separada (para api.primeiratrocaecia.com.br)
echo "📝 Mantendo configuração da API separada..."
# O arquivo primeira-troca-api.conf já está correto para api.primeiratrocaecia.com.br
echo "✅ API mantida"
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
echo "✅ Admin corrigido"
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
    echo "Teste local:"
    curl -s http://localhost:5000/api/health | head -1
    echo ""
    echo "Teste frontend local:"
    curl -s http://localhost:3000 | head -1
    echo ""
    echo "Teste admin local:"
    curl -s http://localhost:8081 | head -1
    echo ""
    echo "===================================="
    echo "✅ Configuração corrigida!"
    echo ""
    echo "🌐 Agora teste pela internet:"
    echo "   curl https://primeiratrocaecia.com.br/api/payments/webhook/health"
    echo "   curl https://admin.primeiratrocaecia.com.br/api/health"
else
    echo ""
    echo "❌ Erro na sintaxe! Verifique os arquivos."
    exit 1
fi

