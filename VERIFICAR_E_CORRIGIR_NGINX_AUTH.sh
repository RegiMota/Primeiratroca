#!/bin/bash

echo "🔍 VERIFICANDO E CORRIGINDO NGINX PARA /api/auth"
echo "================================================"

# 1. Encontrar arquivos de configuração do Nginx
echo -e "\n1️⃣ Buscando arquivos de configuração do Nginx:"
NGINX_CONFIGS=$(find /etc/nginx -name "*primeira*" -o -name "*primeiratroca*" 2>/dev/null)
if [ -z "$NGINX_CONFIGS" ]; then
    echo "   Buscando em /etc/nginx/sites-available:"
    ls -la /etc/nginx/sites-available/ | grep -i "primeira\|api"
    echo "   Buscando em /etc/nginx/conf.d:"
    ls -la /etc/nginx/conf.d/ | grep -i "primeira\|api"
else
    echo "$NGINX_CONFIGS"
fi

# 2. Verificar configuração do Nginx para API
echo -e "\n2️⃣ Verificando configuração do Nginx para /api:"
if [ -f "/etc/nginx/sites-available/primeira-troca-api.conf" ]; then
    echo "   Arquivo encontrado: /etc/nginx/sites-available/primeira-troca-api.conf"
    cat /etc/nginx/sites-available/primeira-troca-api.conf | grep -A 10 "location /api"
elif [ -f "/etc/nginx/sites-available/primeiratroca-api.conf" ]; then
    echo "   Arquivo encontrado: /etc/nginx/sites-available/primeiratroca-api.conf"
    cat /etc/nginx/sites-available/primeiratroca-api.conf | grep -A 10 "location /api"
else
    echo "   Arquivo de configuração não encontrado nos caminhos padrão"
    echo "   Listando todos os arquivos em /etc/nginx/sites-available:"
    ls -la /etc/nginx/sites-available/
fi

# 3. Testar rota via HTTPS (simulando requisição do frontend)
echo -e "\n3️⃣ Testando rota /api/auth/me via HTTPS:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null || echo "   Erro ao conectar via HTTPS"

# 4. Verificar se o Nginx está rodando
echo -e "\n4️⃣ Verificando status do Nginx:"
systemctl status nginx --no-pager | head -10

# 5. Verificar logs do Nginx para erros
echo -e "\n5️⃣ Últimos erros do Nginx:"
tail -20 /var/log/nginx/error.log 2>/dev/null | grep -i "auth/me\|404\|error" | tail -10 || echo "   Nenhum erro recente encontrado"

echo -e "\n✅ Verificação concluída!"

