#!/bin/bash

echo "🔧 RESOLVENDO CONFLITO E TESTANDO ROTA /api/auth/me"
echo "==================================================="

# 1. Resolver conflito do git
echo -e "\n1️⃣ Resolvendo conflito do git..."
cd /root/Primeiratroca
git stash
git pull
git stash pop

# 2. Tornar scripts executáveis
echo -e "\n2️⃣ Tornando scripts executáveis..."
chmod +x TESTAR_ROTA_AUTH_ME.sh CORRIGIR_NGINX_API_ROUTES.sh RECARREGAR_NGINX.sh 2>/dev/null || true

# 3. Testar rota localmente (backend direto)
echo -e "\n3️⃣ Testando rota localmente (backend direto):"
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
echo "   Status local: $LOCAL_STATUS"
if [ "$LOCAL_STATUS" = "401" ] || [ "$LOCAL_STATUS" = "200" ]; then
    echo "   ✅ Backend está funcionando corretamente"
else
    echo "   ❌ Backend retornou status inesperado: $LOCAL_STATUS"
fi

# 4. Testar rota via HTTPS (através do Nginx)
echo -e "\n4️⃣ Testando rota via HTTPS (através do Nginx):"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
echo "   Status HTTPS: $HTTPS_STATUS"

if [ "$HTTPS_STATUS" = "404" ]; then
    echo "   ❌ Nginx está retornando 404 - problema de configuração!"
    echo "   Verificando configuração do Nginx..."
    
    # Verificar se location /api/ existe
    if grep -q "location /api/" /etc/nginx/conf.d/primeira-troca-frontend.conf; then
        echo "   ✅ Location /api/ encontrado no Nginx"
        echo "   Conteúdo do location /api/:"
        grep -A 10 "location /api/" /etc/nginx/conf.d/primeira-troca-frontend.conf | head -n 12
    else
        echo "   ❌ Location /api/ NÃO encontrado no Nginx!"
    fi
    
    # Recarregar Nginx
    echo -e "\n   Recarregando Nginx..."
    systemctl reload nginx
    
    # Testar novamente
    sleep 2
    HTTPS_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
    echo "   Status HTTPS após recarregar: $HTTPS_STATUS2"
    
elif [ "$HTTPS_STATUS" = "401" ] || [ "$HTTPS_STATUS" = "200" ]; then
    echo "   ✅ Nginx está fazendo proxy corretamente!"
elif [ "$HTTPS_STATUS" = "502" ]; then
    echo "   ❌ Nginx retornou 502 - backend pode não estar acessível"
    echo "   Verificando status do backend..."
    docker-compose ps backend
else
    echo "   ⚠️  Status inesperado: $HTTPS_STATUS"
fi

# 5. Verificar logs do Nginx para erros
echo -e "\n5️⃣ Verificando logs do Nginx (últimas 5 linhas de erro):"
tail -n 5 /var/log/nginx/error.log 2>/dev/null | grep -i "error\|warn" || echo "   Nenhum erro recente encontrado"

# 6. Verificar se o backend está recebendo requisições via Nginx
echo -e "\n6️⃣ Verificando logs do backend (últimas 10 linhas):"
docker-compose logs backend --tail=10 | grep -E "GET.*auth|error" | tail -n 5 || echo "   Nenhuma requisição recente encontrada"

echo -e "\n✅ Processo concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Backend local: $LOCAL_STATUS"
echo "   - Via HTTPS: $HTTPS_STATUS"

