#!/bin/bash

echo "🔧 CORRIGINDO CONFIGURAÇÃO DO NGINX PARA ROTAS /api/*"
echo "====================================================="

# 1. Verificar configuração atual do frontend
echo -e "\n1️⃣ Verificando configuração atual do Nginx para frontend:"
FRONTEND_CONF="/etc/nginx/conf.d/primeira-troca-frontend.conf"

if [ ! -f "$FRONTEND_CONF" ]; then
    echo "❌ Arquivo de configuração não encontrado: $FRONTEND_CONF"
    exit 1
fi

# 2. Verificar se location /api/ está configurado corretamente
echo -e "\n2️⃣ Verificando se location /api/ está configurado:"
if grep -q "location /api/" "$FRONTEND_CONF"; then
    echo "✅ Location /api/ encontrado"
    grep -A 10 "location /api/" "$FRONTEND_CONF"
else
    echo "❌ Location /api/ NÃO encontrado!"
    exit 1
fi

# 3. Verificar se o proxy_pass está correto
echo -e "\n3️⃣ Verificando proxy_pass:"
if grep -A 5 "location /api/" "$FRONTEND_CONF" | grep -q "proxy_pass http://localhost:5000"; then
    echo "✅ proxy_pass está correto (http://localhost:5000)"
else
    echo "❌ proxy_pass pode estar incorreto"
    grep -A 5 "location /api/" "$FRONTEND_CONF" | grep "proxy_pass"
fi

# 4. Verificar ordem das locations (location /api/ deve vir ANTES de location /)
echo -e "\n4️⃣ Verificando ordem das locations:"
API_LINE=$(grep -n "location /api/" "$FRONTEND_CONF" | cut -d: -f1)
ROOT_LINE=$(grep -n "location / {" "$FRONTEND_CONF" | cut -d: -f1)

if [ -n "$API_LINE" ] && [ -n "$ROOT_LINE" ]; then
    if [ "$API_LINE" -lt "$ROOT_LINE" ]; then
        echo "✅ Ordem correta: location /api/ vem antes de location /"
    else
        echo "❌ Ordem INCORRETA: location / vem antes de location /api/"
        echo "   Isso pode causar problemas de roteamento!"
    fi
fi

# 5. Testar sintaxe do Nginx
echo -e "\n5️⃣ Testando sintaxe do Nginx:"
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na sintaxe do Nginx!"
    exit 1
fi

# 6. Recarregar Nginx
echo -e "\n6️⃣ Recarregando Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado com sucesso!"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi

# 7. Testar rota /api/auth/me
echo -e "\n7️⃣ Testando rota /api/auth/me após recarregar:"
sleep 2
TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
echo "   Status: $TEST_RESPONSE"

if [ "$TEST_RESPONSE" = "404" ]; then
    echo "   ⚠️  Ainda retornando 404. Verificando logs..."
    echo "   Últimas 10 linhas dos logs do Nginx:"
    tail -n 10 /var/log/nginx/error.log
    echo "   Últimas 10 linhas dos logs do backend:"
    docker-compose logs backend --tail=10
elif [ "$TEST_RESPONSE" = "401" ]; then
    echo "   ✅ Rota está funcionando! (401 = não autorizado, mas rota existe)"
elif [ "$TEST_RESPONSE" = "200" ]; then
    echo "   ✅ Rota está funcionando perfeitamente!"
else
    echo "   ⚠️  Status inesperado: $TEST_RESPONSE"
fi

echo -e "\n✅ Processo concluído!"

