#!/bin/bash

echo "🔧 Corrigindo Painel Admin"
echo "=========================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando containers..."
docker-compose ps
echo ""

echo "2️⃣ Verificando se admin está no docker-compose.yml..."
if grep -q "primeira-troca-admin" docker-compose.yml; then
    echo "✅ Serviço admin encontrado no docker-compose.yml"
else
    echo "❌ Serviço admin NÃO encontrado no docker-compose.yml"
    echo "   Execute: git pull origin main para atualizar"
    exit 1
fi
echo ""

echo "3️⃣ Verificando configuração do Nginx para admin..."
if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
    echo "✅ Arquivo de configuração encontrado"
    echo ""
    echo "📄 Configuração atual:"
    cat /etc/nginx/conf.d/primeira-troca-admin.conf
else
    echo "❌ Arquivo de configuração NÃO encontrado!"
    echo "   Criando configuração..."
    
    # Fazer backup se existir
    if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
        cp /etc/nginx/conf.d/primeira-troca-admin.conf /etc/nginx/conf.d/primeira-troca-admin.conf.backup
    fi
    
    # Criar configuração
    cat > /etc/nginx/conf.d/primeira-troca-admin.conf <<'EOF'
server {
    server_name admin.primeiratrocaecia.com.br;
    client_max_body_size 10M;
    
    # Admin Panel
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
fi
echo ""

echo "4️⃣ Iniciando/Reconstruindo container do admin..."
docker-compose up -d --build admin

if [ $? -eq 0 ]; then
    echo "✅ Container do admin iniciado"
else
    echo "❌ Erro ao iniciar container do admin"
    exit 1
fi
echo ""

echo "5️⃣ Aguardando admin iniciar..."
sleep 15

echo "6️⃣ Verificando se admin está respondendo..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 | grep -q "200\|301\|302"; then
    echo "✅ Admin está respondendo na porta 8081"
else
    echo "⚠️  Admin ainda não está respondendo (pode levar mais tempo)"
    echo "   Verifique os logs: docker-compose logs admin"
fi
echo ""

echo "7️⃣ Testando sintaxe do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Sintaxe OK! Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
else
    echo "❌ Erro na sintaxe do Nginx!"
    exit 1
fi
echo ""

echo "8️⃣ Testando acesso via HTTPS..."
sleep 2
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://admin.primeiratrocaecia.com.br)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d' | head -5)

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ Admin acessível via HTTPS!"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "⚠️  502 Bad Gateway - Admin pode estar iniciando ainda"
    echo "   Aguarde alguns segundos e tente novamente"
    echo "   Verifique: docker-compose logs admin"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  404 - Verifique se o certificado SSL está configurado para admin.primeiratrocaecia.com.br"
else
    echo "⚠️  Status: $HTTP_CODE"
fi

echo ""
echo "===================================="
echo "✅ Correção aplicada!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique se o container está rodando: docker-compose ps admin"
echo "   2. Verifique os logs: docker-compose logs -f admin"
echo "   3. Teste acessar: https://admin.primeiratrocaecia.com.br"
echo ""
echo "💡 Se o certificado SSL não estiver configurado para admin.primeiratrocaecia.com.br:"
echo "   certbot --nginx -d admin.primeiratrocaecia.com.br"

