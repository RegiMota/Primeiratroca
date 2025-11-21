#!/bin/bash

echo "🔄 RECARREGANDO NGINX"
echo "===================="

# 1. Testar configuração
echo -e "\n1️⃣ Testando configuração do Nginx:"
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

# 2. Recarregar Nginx
echo -e "\n2️⃣ Recarregando Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx recarregado com sucesso!"
else
    echo "❌ Erro ao recarregar Nginx"
    exit 1
fi

# 3. Verificar status
echo -e "\n3️⃣ Verificando status do Nginx:"
systemctl status nginx --no-pager | head -5

# 4. Testar rotas
echo -e "\n4️⃣ Testando rotas:"
echo "   - /api/auth/me via HTTPS:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null

echo "   - /api/products via HTTPS:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://primeiratrocaecia.com.br/api/products?featured=true&limit=1" 2>/dev/null

echo -e "\n✅ Processo concluído!"

