#!/bin/bash

echo "🔧 Corrigindo Erro 413 - Request Entity Too Large"
echo "================================================="

# 1. Verificar configuração atual do Nginx
echo -e "\n1️⃣ Verificando configuração atual do Nginx..."

# Verificar nginx.conf
if [ -f "/etc/nginx/nginx.conf" ]; then
    CURRENT_LIMIT=$(grep -i "client_max_body_size" /etc/nginx/nginx.conf | head -1 | awk '{print $2}' | tr -d ';' || echo "não encontrado")
    echo "   Limite atual no nginx.conf: $CURRENT_LIMIT"
    
    if [ "$CURRENT_LIMIT" = "não encontrado" ] || [ "$CURRENT_LIMIT" != "100M" ]; then
        echo "   ⚠️  Limite não configurado ou incorreto. Corrigindo..."
        
        # Se não existe, adicionar no bloco http
        if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
            # Adicionar após a linha "http {"
            sed -i '/^http {/a\    client_max_body_size 100M;' /etc/nginx/nginx.conf
            echo "   ✅ Adicionado client_max_body_size 100M no nginx.conf"
        else
            # Atualizar valor existente
            sed -i 's/client_max_body_size.*/client_max_body_size 100M;/i' /etc/nginx/nginx.conf
            echo "   ✅ Atualizado client_max_body_size para 100M no nginx.conf"
        fi
    else
        echo "   ✅ Limite já está configurado corretamente no nginx.conf"
    fi
else
    echo "   ⚠️  Arquivo nginx.conf não encontrado"
fi

# 2. Verificar e corrigir configurações de sites
echo -e "\n2️⃣ Verificando e corrigindo configurações de sites..."

for config_file in /etc/nginx/sites-available/*; do
    if [ -f "$config_file" ]; then
        filename=$(basename "$config_file")
        echo "   Verificando: $filename"
        
        CURRENT_LIMIT=$(grep -i "client_max_body_size" "$config_file" | head -1 | awk '{print $2}' | tr -d ';' || echo "não encontrado")
        
        if [ "$CURRENT_LIMIT" = "não encontrado" ] || [ "$CURRENT_LIMIT" != "100M" ]; then
            echo "     ⚠️  Limite não configurado ou incorreto. Corrigindo..."
            
            # Se não existe, adicionar no bloco server
            if ! grep -q "client_max_body_size" "$config_file"; then
                # Adicionar após a linha "server {"
                sed -i '/^[[:space:]]*server {/a\    client_max_body_size 100M;' "$config_file"
                echo "     ✅ Adicionado client_max_body_size 100M"
            else
                # Atualizar valor existente
                sed -i 's/client_max_body_size.*/client_max_body_size 100M;/i' "$config_file"
                echo "     ✅ Atualizado client_max_body_size para 100M"
            fi
        else
            echo "     ✅ Limite já está configurado corretamente"
        fi
    fi
done

# 3. Verificar sintaxe do Nginx
echo -e "\n3️⃣ Verificando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe do Nginx está correta"
else
    echo "   ❌ Erro na sintaxe do Nginx:"
    nginx -t 2>&1
    echo ""
    echo "   ⚠️  Corrigindo manualmente..."
    exit 1
fi

# 4. Recarregar Nginx
echo -e "\n4️⃣ Recarregando Nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx recarregado com sucesso"
elif systemctl restart nginx 2>/dev/null; then
    echo "   ✅ Nginx reiniciado com sucesso"
else
    echo "   ⚠️  Erro ao recarregar/reiniciar Nginx"
    echo "   Tente manualmente: sudo systemctl reload nginx"
fi

# 5. Verificar configuração final
echo -e "\n5️⃣ Verificando configuração final..."
echo "   client_max_body_size encontrado em:"
grep -r "client_max_body_size" /etc/nginx/ 2>/dev/null | grep -v ".dpkg" | head -10

# 6. Testar se o backend está configurado corretamente
echo -e "\n6️⃣ Verificando configuração do backend..."
cd /root/Primeiratroca 2>/dev/null || cd /root/Primeiratroca 2>/dev/null || echo "   ⚠️  Não foi possível navegar para o diretório do projeto"

if [ -f "server/index.ts" ]; then
    EXPRESS_LIMIT=$(grep -i "express.json.*limit" server/index.ts | grep -o "limit: '[^']*'" | head -1 || echo "não encontrado")
    echo "   Limite do Express: $EXPRESS_LIMIT"
    
    if echo "$EXPRESS_LIMIT" | grep -q "100mb\|100MB"; then
        echo "   ✅ Express já está configurado para 100MB"
    else
        echo "   ⚠️  Express pode não estar configurado corretamente"
    fi
fi

echo -e "\n✅ Correção aplicada!"
echo ""
echo "📝 O limite de upload agora é de 100MB"
echo "   Se ainda houver erro 413, verifique:"
echo "   1. Logs do Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   2. Se o arquivo realmente tem menos de 100MB"
echo "   3. Execute: sudo nginx -t (para verificar sintaxe)"
echo ""

