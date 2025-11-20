#!/bin/bash

echo "🔍 Diagnosticando e Corrigindo Admin"
echo "===================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando configuração atual do Nginx do admin..."
echo ""
if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
    echo "📄 Conteúdo atual:"
    cat /etc/nginx/conf.d/primeira-troca-admin.conf
    echo ""
    echo "🔍 Verificando se tem location /api/..."
    if grep -q "location /api/" /etc/nginx/conf.d/primeira-troca-admin.conf; then
        echo "✅ Rota /api/ encontrada"
    else
        echo "❌ Rota /api/ NÃO encontrada - será adicionada"
    fi
else
    echo "❌ Arquivo de configuração não existe - será criado"
fi
echo ""

echo "2️⃣ Verificando status dos containers..."
docker-compose ps | grep -E "backend|admin"
echo ""

echo "3️⃣ Testando backend diretamente..."
curl -s -o /dev/null -w "Backend (localhost:5000/api/health): HTTP %{http_code}\n" http://localhost:5000/api/health
echo ""

echo "4️⃣ Testando admin diretamente..."
curl -s -o /dev/null -w "Admin (localhost:8081): HTTP %{http_code}\n" http://localhost:8081
echo ""

echo "5️⃣ Testando API via admin (simulando requisição)..."
curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' \
     -o /dev/null -w "POST /api/auth/login via localhost:8081: HTTP %{http_code}\n" \
     http://localhost:8081/api/auth/login 2>/dev/null || echo "⚠️  Erro ao testar (esperado se Nginx não está configurado)"
echo ""

echo "6️⃣ Corrigindo configuração do Nginx..."
# Fazer backup
if [ -f /etc/nginx/conf.d/primeira-troca-admin.conf ]; then
    cp /etc/nginx/conf.d/primeira-troca-admin.conf /etc/nginx/conf.d/primeira-troca-admin.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
fi

# Criar configuração corrigida
cat > /etc/nginx/conf.d/primeira-troca-admin.conf <<'EOF'
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

echo "7️⃣ Verificando sintaxe do Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na sintaxe! Verifique os logs acima."
    exit 1
fi

echo ""
echo "8️⃣ Recarregando Nginx..."
systemctl reload nginx

if [ $? -ne 0 ]; then
    echo "❌ Erro ao recarregar Nginx!"
    exit 1
fi

echo "✅ Nginx recarregado"
echo ""

echo "9️⃣ Aguardando 5 segundos para Nginx estabilizar..."
sleep 5
echo ""

echo "🔟 Testando configuração corrigida..."
echo ""
echo "Teste 1: Health check do backend via HTTPS..."
curl -s -o /dev/null -w "HTTPS /api/health: HTTP %{http_code}\n" https://admin.primeiratrocaecia.com.br/api/health
echo ""

echo "Teste 2: Verificando se POST é permitido..."
curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' \
     -o /dev/null -w "POST /api/auth/login: HTTP %{http_code}\n" \
     https://admin.primeiratrocaecia.com.br/api/auth/login
echo ""

echo "===================================="
echo "✅ Diagnóstico e correção concluídos!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+Del)"
echo "   2. Acesse: https://admin.primeiratrocaecia.com.br/login"
echo "   3. Tente fazer login"
echo ""
echo "💡 Se ainda houver erro 405:"
echo "   - Verifique logs do Nginx: tail -f /var/log/nginx/error.log"
echo "   - Verifique se o backend está rodando: docker-compose ps backend"
echo "   - Teste diretamente: curl -X POST https://admin.primeiratrocaecia.com.br/api/auth/login"

