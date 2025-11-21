#!/bin/bash

# Script para corrigir o limite de upload no Nginx
# Resolve o erro 413 (Request Entity Too Large)

echo "🔧 Corrigindo limite de upload no Nginx..."

# Diretório de configuração do Nginx
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

# Arquivos de configuração
FRONTEND_CONF="$NGINX_CONF_DIR/primeira-troca-frontend.conf"
ADMIN_CONF="$NGINX_CONF_DIR/primeira-troca-admin.conf"
API_CONF="$NGINX_CONF_DIR/primeira-troca-api.conf"

# Função para adicionar/atualizar client_max_body_size
update_nginx_config() {
    local config_file=$1
    local server_name=$2
    
    if [ ! -f "$config_file" ]; then
        echo "⚠️  Arquivo $config_file não encontrado. Pulando..."
        return
    fi
    
    echo "📝 Atualizando $config_file..."
    
    # Verificar se client_max_body_size já existe
    if grep -q "client_max_body_size" "$config_file"; then
        # Atualizar valor existente
        sed -i 's/client_max_body_size.*/client_max_body_size 100M;/' "$config_file"
        echo "✅ Atualizado client_max_body_size em $config_file"
    else
        # Adicionar após o server_name ou no início do bloco server
        if grep -q "server_name" "$config_file"; then
            # Adicionar após server_name
            sed -i "/server_name/a\    client_max_body_size 100M;" "$config_file"
        else
            # Adicionar no início do bloco server
            sed -i "/^server {/a\    client_max_body_size 100M;" "$config_file"
        fi
        echo "✅ Adicionado client_max_body_size em $config_file"
    fi
}

# Atualizar configurações
update_nginx_config "$FRONTEND_CONF" "frontend"
update_nginx_config "$ADMIN_CONF" "admin"
update_nginx_config "$API_CONF" "api"

# Também adicionar no nginx.conf principal se necessário
NGINX_MAIN="/etc/nginx/nginx.conf"
if [ -f "$NGINX_MAIN" ]; then
    if ! grep -q "client_max_body_size" "$NGINX_MAIN"; then
        # Adicionar no bloco http
        sed -i "/^http {/a\    client_max_body_size 100M;" "$NGINX_MAIN"
        echo "✅ Adicionado client_max_body_size no nginx.conf principal"
    fi
fi

# Testar configuração do Nginx
echo ""
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração do Nginx está válida!"
    echo ""
    echo "🔄 Reiniciando Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reiniciado com sucesso!"
    else
        echo "❌ Erro ao reiniciar Nginx. Tentando restart..."
        systemctl restart nginx
    fi
else
    echo "❌ Erro na configuração do Nginx. Verifique os logs acima."
    exit 1
fi

echo ""
echo "✅ Limite de upload atualizado para 100MB!"
echo "📋 Resumo:"
echo "   - client_max_body_size: 100M"
echo "   - Limite do multer: 100MB"
echo "   - Limite do Express: 100MB"
echo ""
echo "💡 Agora você pode fazer upload de arquivos de até 100MB."

