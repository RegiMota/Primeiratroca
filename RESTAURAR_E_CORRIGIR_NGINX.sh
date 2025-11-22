#!/bin/bash

echo "🔧 Restaurando e Corrigindo Nginx"
echo "=================================="

# 1. Fazer backup do arquivo atual
echo -e "\n1️⃣ Fazendo backup do nginx.conf atual..."
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.corrupted.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup criado"

# 2. Restaurar do backup mais recente
echo -e "\n2️⃣ Restaurando do backup mais recente..."
LATEST_BACKUP=$(ls -t /etc/nginx/nginx.conf.backup.* 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" /etc/nginx/nginx.conf
    echo "   ✅ Restaurado de: $LATEST_BACKUP"
else
    echo "   ⚠️  Nenhum backup encontrado. Limpando arquivo atual..."
    
    # Remover linhas que contêm comandos ou comentários inválidos
    sed -i '/^sudo /d' /etc/nginx/nginx.conf
    sed -i '/^# Editar/d' /etc/nginx/nginx.conf
    sed -i '/^# Adicionar dentro/d' /etc/nginx/nginx.conf
    sed -i '/^# Salvar/d' /etc/nginx/nginx.conf
    sed -i '/^# Verificar/d' /etc/nginx/nginx.conf
    sed -i '/^# Recarregar/d' /etc/nginx/nginx.conf
    sed -i '/^# E também/d' /etc/nginx/nginx.conf
    sed -i '/^client_max_body_size 100M;$/d' /etc/nginx/nginx.conf
    
    echo "   ✅ Linhas inválidas removidas"
fi

# 3. Limpar linhas inválidas que possam ter sobrado
echo -e "\n3️⃣ Limpando linhas inválidas..."
sed -i '/^sudo /d' /etc/nginx/nginx.conf
sed -i '/^# Editar/d' /etc/nginx/nginx.conf
sed -i '/^# Adicionar dentro/d' /etc/nginx/nginx.conf
sed -i '/^# Salvar/d' /etc/nginx/nginx.conf
sed -i '/^# Verificar/d' /etc/nginx/nginx.conf
sed -i '/^# Recarregar/d' /etc/nginx/nginx.conf
sed -i '/^# E também/d' /etc/nginx/nginx.conf
sed -i '/^# Dentro do bloco/d' /etc/nginx/nginx.conf
sed -i '/^# Dentro de cada/d' /etc/nginx/nginx.conf

# Remover linhas client_max_body_size que estão fora do bloco http
HTTP_START_LINE=$(grep -n "^http {" /etc/nginx/nginx.conf | head -1 | cut -d: -f1)
if [ -n "$HTTP_START_LINE" ]; then
    # Remover client_max_body_size antes do bloco http
    sed -i "1,$((HTTP_START_LINE-1)){/client_max_body_size/d;}" /etc/nginx/nginx.conf
    echo "   ✅ Linhas inválidas removidas"
fi

# 4. Adicionar client_max_body_size corretamente
echo -e "\n4️⃣ Adicionando client_max_body_size corretamente..."

HTTP_START_LINE=$(grep -n "^http {" /etc/nginx/nginx.conf | head -1 | cut -d: -f1)

if [ -z "$HTTP_START_LINE" ]; then
    echo "   ❌ Bloco http { não encontrado!"
    exit 1
fi

# Verificar se já existe dentro do bloco http (nas próximas 20 linhas)
HTTP_BLOCK_HAS_LIMIT=$(sed -n "${HTTP_START_LINE},$((HTTP_START_LINE+20))p" /etc/nginx/nginx.conf | grep -c "client_max_body_size" || echo "0")

if [ "$HTTP_BLOCK_HAS_LIMIT" = "0" ]; then
    # Adicionar após a linha "http {"
    sed -i "${HTTP_START_LINE}a\    client_max_body_size 100M;" /etc/nginx/nginx.conf
    echo "   ✅ Adicionado client_max_body_size 100M dentro do bloco http"
else
    # Atualizar se já existe
    sed -i "${HTTP_START_LINE},$((HTTP_START_LINE+20)){s/client_max_body_size.*/    client_max_body_size 100M;/;}" /etc/nginx/nginx.conf
    echo "   ✅ Atualizado client_max_body_size para 100M dentro do bloco http"
fi

# 5. Adicionar nos arquivos de configuração de sites
echo -e "\n5️⃣ Adicionando client_max_body_size nas configurações de sites..."

for config_file in /etc/nginx/conf.d/*.conf /etc/nginx/sites-available/*.conf 2>/dev/null; do
    if [ -f "$config_file" ]; then
        filename=$(basename "$config_file")
        echo "   Verificando: $filename"
        
        # Encontrar linhas de server {
        SERVER_LINES=$(grep -n "^[[:space:]]*server {" "$config_file" | cut -d: -f1)
        
        if [ -z "$SERVER_LINES" ]; then
            continue
        fi
        
        for server_line in $SERVER_LINES; do
            # Verificar se já existe neste bloco server (próximas 10 linhas)
            HAS_LIMIT=$(sed -n "${server_line},$((server_line+10))p" "$config_file" | grep -c "client_max_body_size" || echo "0")
            
            if [ "$HAS_LIMIT" = "0" ]; then
                # Adicionar após a linha "server {"
                sed -i "${server_line}a\    client_max_body_size 100M;" "$config_file"
                echo "     ✅ Adicionado no bloco server (linha $server_line)"
            fi
        done
    fi
done

# 6. Verificar sintaxe
echo -e "\n6️⃣ Verificando sintaxe do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe está correta"
else
    echo "   ❌ Erro na sintaxe:"
    nginx -t 2>&1 | grep -i "error\|emerg" | head -5
    echo ""
    echo "   📝 Primeiras 20 linhas do nginx.conf:"
    head -20 /etc/nginx/nginx.conf
    exit 1
fi

# 7. Recarregar Nginx
echo -e "\n7️⃣ Recarregando Nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx recarregado com sucesso"
elif systemctl restart nginx 2>/dev/null; then
    echo "   ✅ Nginx reiniciado com sucesso"
else
    echo "   ❌ Erro ao recarregar/reiniciar Nginx"
    exit 1
fi

echo -e "\n✅✅✅ Nginx corrigido e funcionando! ✅✅✅"
echo ""
echo "📝 Limite de upload agora é de 100MB"
echo "   Tente fazer upload novamente no painel admin"
echo ""

