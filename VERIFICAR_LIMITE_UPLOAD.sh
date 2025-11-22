#!/bin/bash

echo "🔍 Verificando Limite de Upload"
echo "================================="

# 1. Verificar nginx.conf
echo -e "\n1️⃣ Verificando nginx.conf..."
if [ -f "/etc/nginx/nginx.conf" ]; then
    LIMIT=$(grep -i "client_max_body_size" /etc/nginx/nginx.conf | head -1)
    if [ -n "$LIMIT" ]; then
        echo "   ✅ Encontrado: $LIMIT"
    else
        echo "   ❌ client_max_body_size NÃO encontrado no nginx.conf"
    fi
else
    echo "   ⚠️  Arquivo nginx.conf não encontrado"
fi

# 2. Verificar configurações de sites
echo -e "\n2️⃣ Verificando configurações de sites..."
for config_file in /etc/nginx/sites-available/*; do
    if [ -f "$config_file" ]; then
        filename=$(basename "$config_file")
        LIMIT=$(grep -i "client_max_body_size" "$config_file" | head -1)
        if [ -n "$LIMIT" ]; then
            echo "   ✅ $filename: $LIMIT"
        else
            echo "   ❌ $filename: client_max_body_size NÃO encontrado"
        fi
    fi
done

# 3. Verificar status do Nginx
echo -e "\n3️⃣ Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx está rodando"
else
    echo "   ❌ Nginx NÃO está rodando"
fi

# 4. Testar sintaxe
echo -e "\n4️⃣ Testando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe está correta"
    nginx -t 2>&1 | grep "successful"
else
    echo "   ❌ Erro na sintaxe:"
    nginx -t 2>&1
fi

# 5. Verificar se precisa recarregar
echo -e "\n5️⃣ Recarregando Nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx recarregado"
else
    echo "   ⚠️  Erro ao recarregar, tentando reiniciar..."
    systemctl restart nginx 2>/dev/null && echo "   ✅ Nginx reiniciado" || echo "   ❌ Erro ao reiniciar"
fi

echo -e "\n✅ Verificação concluída!"
echo ""
echo "📝 Se ainda houver erro 413, execute manualmente:"
echo "   sudo nano /etc/nginx/nginx.conf"
echo "   Adicione 'client_max_body_size 100M;' dentro do bloco http {"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""

