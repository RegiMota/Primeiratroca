#!/bin/bash

echo "🔧 Corrigindo Limite de Upload no Nginx (Correto)"
echo "================================================="

# 1. Verificar e corrigir nginx.conf
echo -e "\n1️⃣ Corrigindo nginx.conf..."

if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo "   ❌ Arquivo nginx.conf não encontrado!"
    exit 1
fi

# Fazer backup
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup criado"

# Remover todas as linhas client_max_body_size que estão FORA do bloco http
# Primeiro, encontrar onde começa o bloco http
HTTP_START_LINE=$(grep -n "^http {" /etc/nginx/nginx.conf | head -1 | cut -d: -f1)

if [ -z "$HTTP_START_LINE" ]; then
    echo "   ❌ Bloco http { não encontrado!"
    exit 1
fi

echo "   Bloco http começa na linha: $HTTP_START_LINE"

# Remover client_max_body_size que estão antes do bloco http
sed -i "1,$((HTTP_START_LINE-1)){/client_max_body_size/d;}" /etc/nginx/nginx.conf

# Verificar se já existe dentro do bloco http (após a linha http {)
HTTP_BLOCK_HAS_LIMIT=$(sed -n "$HTTP_START_LINE,${HTTP_START_LINE}+20p" /etc/nginx/nginx.conf | grep -c "client_max_body_size" || echo "0")

if [ "$HTTP_BLOCK_HAS_LIMIT" = "0" ]; then
    # Adicionar após a linha "http {"
    sed -i "${HTTP_START_LINE}a\    client_max_body_size 100M;" /etc/nginx/nginx.conf
    echo "   ✅ Adicionado client_max_body_size 100M dentro do bloco http"
else
    # Se já existe, garantir que está correto
    sed -i "${HTTP_START_LINE},${HTTP_START_LINE}+20{s/client_max_body_size.*/client_max_body_size 100M;/;}" /etc/nginx/nginx.conf
    echo "   ✅ Atualizado client_max_body_size para 100M dentro do bloco http"
fi

# 2. Verificar e corrigir configurações de sites
echo -e "\n2️⃣ Corrigindo configurações de sites..."

# Encontrar arquivos de configuração
SITE_CONFIGS=$(find /etc/nginx -name "*.conf" -type f 2>/dev/null | grep -E "(sites-available|conf.d)" | head -10)

if [ -z "$SITE_CONFIGS" ]; then
    echo "   ⚠️  Nenhum arquivo de configuração de site encontrado em sites-available ou conf.d"
    echo "   Verificando em /etc/nginx/conf.d..."
    SITE_CONFIGS=$(ls /etc/nginx/conf.d/*.conf 2>/dev/null || echo "")
fi

if [ -z "$SITE_CONFIGS" ]; then
    echo "   ⚠️  Nenhum arquivo de configuração encontrado"
else
    for config_file in $SITE_CONFIGS; do
        if [ -f "$config_file" ]; then
            filename=$(basename "$config_file")
            echo "   Verificando: $filename"
            
            # Fazer backup
            cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Encontrar linhas de server {
            SERVER_LINES=$(grep -n "^[[:space:]]*server {" "$config_file" | cut -d: -f1)
            
            if [ -z "$SERVER_LINES" ]; then
                echo "     ⚠️  Nenhum bloco server encontrado"
                continue
            fi
            
            for server_line in $SERVER_LINES; do
                # Verificar se já existe client_max_body_size neste bloco server
                HAS_LIMIT=$(sed -n "${server_line},${server_line}+10p" "$config_file" | grep -c "client_max_body_size" || echo "0")
                
                if [ "$HAS_LIMIT" = "0" ]; then
                    # Adicionar após a linha "server {"
                    sed -i "${server_line}a\    client_max_body_size 100M;" "$config_file"
                    echo "     ✅ Adicionado client_max_body_size 100M no bloco server (linha $server_line)"
                else
                    # Atualizar se já existe
                    sed -i "${server_line},${server_line}+10{s/client_max_body_size.*/client_max_body_size 100M;/;}" "$config_file"
                    echo "     ✅ Atualizado client_max_body_size para 100M no bloco server (linha $server_line)"
                fi
            done
        fi
    done
fi

# 3. Verificar sintaxe
echo -e "\n3️⃣ Verificando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe está correta"
    nginx -t 2>&1 | grep "successful"
else
    echo "   ❌ Erro na sintaxe:"
    nginx -t 2>&1 | grep -i "error\|emerg"
    echo ""
    echo "   ⚠️  Verificando linha 3 do nginx.conf..."
    sed -n '1,10p' /etc/nginx/nginx.conf
    echo ""
    echo "   💡 Se ainda houver erro, restaure o backup:"
    echo "      sudo cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf"
    exit 1
fi

# 4. Recarregar Nginx
echo -e "\n4️⃣ Recarregando Nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx recarregado com sucesso"
elif systemctl restart nginx 2>/dev/null; then
    echo "   ✅ Nginx reiniciado com sucesso"
else
    echo "   ❌ Erro ao recarregar/reiniciar Nginx"
    echo "   Verifique os logs: sudo journalctl -xeu nginx.service"
    exit 1
fi

# 5. Verificar configuração final
echo -e "\n5️⃣ Verificando configuração final..."
echo "   client_max_body_size encontrado em:"
grep -n "client_max_body_size" /etc/nginx/nginx.conf 2>/dev/null | head -5

echo -e "\n✅ Correção aplicada com sucesso!"
echo ""
echo "📝 Limite de upload agora é de 100MB"
echo "   Tente fazer upload novamente no painel admin"
echo ""

