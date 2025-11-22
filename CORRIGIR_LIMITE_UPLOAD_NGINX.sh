#!/bin/bash

echo "🔧 Corrigindo Limite de Upload no Nginx"
echo "======================================="

# 1. Verificar configuração atual do Nginx
echo -e "\n1️⃣ Verificando configuração atual do Nginx..."
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "   Verificando client_max_body_size..."
    grep -i "client_max_body_size" /etc/nginx/nginx.conf || echo "   ⚠️  client_max_body_size não encontrado em nginx.conf"
fi

# 2. Verificar configurações de sites
echo -e "\n2️⃣ Verificando configurações de sites..."
for config_file in /etc/nginx/sites-available/*; do
    if [ -f "$config_file" ]; then
        echo "   Verificando: $config_file"
        grep -i "client_max_body_size" "$config_file" || echo "     ⚠️  client_max_body_size não encontrado"
    fi
done

# 3. Adicionar client_max_body_size nas configurações
echo -e "\n3️⃣ Adicionando client_max_body_size nas configurações..."

# Adicionar no nginx.conf se não existir
if [ -f "/etc/nginx/nginx.conf" ]; then
    if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
        echo "   Adicionando client_max_body_size no nginx.conf..."
        # Adicionar dentro do bloco http
        sed -i '/^http {/a\    client_max_body_size 100M;' /etc/nginx/nginx.conf
        echo "   ✅ Adicionado no nginx.conf"
    else
        echo "   ⚠️  client_max_body_size já existe no nginx.conf, atualizando..."
        sed -i 's/client_max_body_size.*/client_max_body_size 100M;/i' /etc/nginx/nginx.conf
        echo "   ✅ Atualizado no nginx.conf"
    fi
fi

# Adicionar nas configurações de sites
for config_file in /etc/nginx/sites-available/*; do
    if [ -f "$config_file" ]; then
        if ! grep -q "client_max_body_size" "$config_file"; then
            echo "   Adicionando client_max_body_size em $config_file..."
            # Adicionar no início do bloco server
            sed -i '/^[[:space:]]*server {/a\    client_max_body_size 100M;' "$config_file"
            echo "   ✅ Adicionado em $config_file"
        else
            echo "   ⚠️  client_max_body_size já existe em $config_file, atualizando..."
            sed -i 's/client_max_body_size.*/client_max_body_size 100M;/i' "$config_file"
            echo "   ✅ Atualizado em $config_file"
        fi
    fi
done

# 4. Verificar sintaxe do Nginx
echo -e "\n4️⃣ Verificando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe do Nginx está correta"
else
    echo "   ❌ Erro na sintaxe do Nginx:"
    nginx -t
    exit 1
fi

# 5. Recarregar Nginx
echo -e "\n5️⃣ Recarregando Nginx..."
if systemctl reload nginx; then
    echo "   ✅ Nginx recarregado com sucesso"
else
    echo "   ⚠️  Erro ao recarregar Nginx, tentando reiniciar..."
    systemctl restart nginx
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reiniciado com sucesso"
    else
        echo "   ❌ Erro ao reiniciar Nginx"
        exit 1
    fi
fi

# 6. Verificar configuração final
echo -e "\n6️⃣ Verificando configuração final..."
echo "   client_max_body_size encontrado em:"
grep -r "client_max_body_size" /etc/nginx/ 2>/dev/null | grep -v ".dpkg" || echo "   ⚠️  Nenhum encontrado"

echo -e "\n✅ Limite de upload corrigido!"
echo ""
echo "📝 O limite agora é de 100MB para uploads"
echo "   Se ainda houver problemas, verifique:"
echo "   1. Logs do Nginx: tail -f /var/log/nginx/error.log"
echo "   2. Logs do backend: docker-compose logs backend | grep upload"
echo ""
