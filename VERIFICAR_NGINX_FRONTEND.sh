#!/bin/bash

echo "🔍 VERIFICANDO CONFIGURAÇÃO DO NGINX PARA FRONTEND"
echo "==================================================="

# 1. Verificar configuração do frontend
echo -e "\n1️⃣ Verificando configuração do Nginx para frontend:"
if [ -f "/etc/nginx/conf.d/primeira-troca-frontend.conf" ]; then
    echo "   Arquivo encontrado: /etc/nginx/conf.d/primeira-troca-frontend.conf"
    echo -e "\n   Conteúdo completo:"
    cat /etc/nginx/conf.d/primeira-troca-frontend.conf
else
    echo "   ❌ Arquivo não encontrado"
fi

# 2. Verificar se há location /api/ no frontend
echo -e "\n2️⃣ Verificando se há location /api/ no frontend:"
if [ -f "/etc/nginx/conf.d/primeira-troca-frontend.conf" ]; then
    grep -A 10 "location /api" /etc/nginx/conf.d/primeira-troca-frontend.conf || echo "   ⚠️  Não encontrado location /api/"
fi

# 3. Verificar configuração da API
echo -e "\n3️⃣ Verificando configuração do Nginx para API:"
if [ -f "/etc/nginx/conf.d/primeira-troca-api.conf" ]; then
    echo "   Arquivo encontrado: /etc/nginx/conf.d/primeira-troca-api.conf"
    echo -e "\n   Conteúdo completo:"
    cat /etc/nginx/conf.d/primeira-troca-api.conf
else
    echo "   ❌ Arquivo não encontrado"
fi

# 4. Testar sintaxe do Nginx
echo -e "\n4️⃣ Testando sintaxe do Nginx:"
nginx -t

# 5. Verificar se o Nginx precisa ser recarregado
echo -e "\n5️⃣ Verificando se há mudanças não aplicadas:"
echo "   (Se houver mudanças, execute: systemctl reload nginx)"

echo -e "\n✅ Verificação concluída!"

