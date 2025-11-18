#!/bin/bash

# Script de Deploy Automatizado para VPS
# Execute este script diretamente na VPS via SSH

set -e

DOMAIN="primeiratrocaecia.com.br"
PROJECT_DIR="/var/www/primeira-troca/ecommerce-roupa-infantil"

echo "🚀 Deploy Automatizado - Primeira Troca"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para gerar senha aleatória
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Detectar gerenciador de pacotes
if command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_INSTALL="yum install -y"
    PKG_UPDATE="yum update -y"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_INSTALL="dnf install -y"
    PKG_UPDATE="dnf update -y"
elif command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
    PKG_INSTALL="apt install -y"
    PKG_UPDATE="apt update && apt upgrade -y"
else
    echo "❌ Gerenciador de pacotes não suportado!"
    exit 1
fi

# Passo 1: Atualizar sistema
echo -e "${YELLOW}📦 Passo 1: Atualizando sistema...${NC}"
if [ "$PKG_MANAGER" = "apt" ]; then
    apt update && apt upgrade -y
else
    $PKG_UPDATE
fi

# Passo 2: Instalar Docker
echo -e "${YELLOW}🐳 Passo 2: Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $USER
else
    echo "Docker já instalado"
fi

# Passo 3: Instalar Docker Compose
echo -e "${YELLOW}📦 Passo 3: Instalando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose já instalado"
fi

# Passo 4: Instalar Nginx e Certbot
echo -e "${YELLOW}🌐 Passo 4: Instalando Nginx e Certbot...${NC}"
if [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    $PKG_INSTALL epel-release
    $PKG_INSTALL nginx certbot python3-certbot-nginx
else
    $PKG_INSTALL nginx certbot python3-certbot-nginx
fi

# Passo 5: Criar diretório do projeto
echo -e "${YELLOW}📁 Passo 5: Preparando diretório do projeto...${NC}"
mkdir -p /var/www
cd /var/www

# Passo 6: Clonar repositório ou navegar para o diretório correto
echo -e "${YELLOW}📥 Passo 6: Preparando diretório do projeto...${NC}"

# Se já estamos em um diretório com docker-compose.prod.yml, usar ele
if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ Arquivo docker-compose.prod.yml encontrado no diretório atual!"
    PROJECT_DIR=$(pwd)
elif [ -d "primeira-troca" ]; then
    echo "Diretório primeira-troca encontrado, navegando..."
    cd primeira-troca
    if [ -d "ecommerce-roupa-infantil" ]; then
        cd ecommerce-roupa-infantil
    elif [ -f "docker-compose.prod.yml" ]; then
        echo "Projeto está na raiz de primeira-troca"
    else
        echo "Procurando docker-compose.prod.yml..."
        DOCKER_DIR=$(find . -name "docker-compose.prod.yml" -type f 2>/dev/null | head -1 | xargs dirname)
        if [ -n "$DOCKER_DIR" ]; then
            cd "$DOCKER_DIR"
        else
            echo "❌ docker-compose.prod.yml não encontrado!"
            exit 1
        fi
    fi
    PROJECT_DIR=$(pwd)
elif [ -d "/root/Primeiratroca" ] && [ -f "/root/Primeiratroca/docker-compose.prod.yml" ]; then
    echo "Usando diretório /root/Primeiratroca"
    cd /root/Primeiratroca
    PROJECT_DIR=$(pwd)
else
    # Clonar repositório
    echo "Clonando repositório..."
    git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca
    cd primeira-troca
    # Verificar estrutura
    if [ -d "ecommerce-roupa-infantil" ]; then
        cd ecommerce-roupa-infantil
    elif [ -f "docker-compose.prod.yml" ]; then
        echo "Projeto está na raiz do repositório"
    else
        echo "❌ Estrutura do projeto não encontrada!"
        echo "Verificando estrutura..."
        ls -la
        exit 1
    fi
    PROJECT_DIR=$(pwd)
fi

echo "📁 Trabalhando em: $PROJECT_DIR"

# Passo 7: Gerar senhas seguras
echo -e "${YELLOW}🔐 Passo 7: Gerando senhas seguras...${NC}"
POSTGRES_PASSWORD=$(generate_password)
JWT_SECRET=$(openssl rand -hex 32)

echo "Senhas geradas (salve em local seguro!)"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"

# Passo 8: Criar .env.prod
echo -e "${YELLOW}⚙️  Passo 8: Criando arquivo .env.prod...${NC}"
cat > .env.prod << EOF
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=primeiratroca

# JWT Secret
JWT_SECRET=$JWT_SECRET

# API URL
VITE_API_URL=https://api.$DOMAIN

# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000
EOF

# Passo 9: Configurar Nginx
echo -e "${YELLOW}🌐 Passo 9: Configurando Nginx...${NC}"

# Detectar estrutura do Nginx (RHEL-based usa conf.d, Debian-based usa sites-available)
if [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    # RHEL-based (AlmaLinux, CentOS, etc.) - usa /etc/nginx/conf.d/
    NGINX_CONFIG_DIR="/etc/nginx/conf.d"
    FRONTEND_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-frontend.conf"
    ADMIN_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-admin.conf"
    API_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-api.conf"
else
    # Debian-based (Ubuntu, Debian) - usa sites-available/sites-enabled
    NGINX_CONFIG_DIR="/etc/nginx/sites-available"
    mkdir -p /etc/nginx/sites-enabled
    FRONTEND_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-frontend"
    ADMIN_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-admin"
    API_CONFIG="$NGINX_CONFIG_DIR/primeira-troca-api"
fi

# Frontend
cat > $FRONTEND_CONFIG << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Admin
cat > $ADMIN_CONFIG << EOF
server {
    listen 80;
    server_name admin.$DOMAIN;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# API
cat > $API_CONFIG << EOF
upstream backend {
    server localhost:5000;
}
server {
    listen 80;
    server_name api.$DOMAIN;
    client_max_body_size 10M;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Habilitar sites (apenas para Debian-based)
if [ "$PKG_MANAGER" = "apt" ]; then
    ln -sf $FRONTEND_CONFIG /etc/nginx/sites-enabled/
    ln -sf $ADMIN_CONFIG /etc/nginx/sites-enabled/
    ln -sf $API_CONFIG /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# Remover configuração default do RHEL-based se existir
if [ -f /etc/nginx/conf.d/default.conf ]; then
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
fi

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx

# Passo 10: Configurar Firewall
echo -e "${YELLOW}🔥 Passo 10: Configurando firewall...${NC}"
if [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    # RHEL-based usa firewalld
    systemctl start firewalld 2>/dev/null || true
    systemctl enable firewalld 2>/dev/null || true
    firewall-cmd --permanent --add-service=ssh 2>/dev/null || true
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
else
    # Debian-based usa ufw
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw --force enable 2>/dev/null || true
fi

# Passo 11: Fazer deploy
echo -e "${YELLOW}🚀 Passo 11: Fazendo deploy da aplicação...${NC}"
export $(cat .env.prod | grep -v '^#' | xargs)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Aguardar containers iniciarem
echo "Aguardando containers iniciarem..."
sleep 15

# Executar migrações
echo "Executando migrações do banco de dados..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || true

# Criar usuário admin
echo "Criando usuário admin..."
docker-compose -f docker-compose.prod.yml exec -T backend node scripts/check-admin.js || true

# Passo 12: Obter certificados SSL
echo -e "${YELLOW}🔒 Passo 12: Obtendo certificados SSL...${NC}"
echo "Isso pode levar alguns minutos e requer que os DNS estejam configurados..."

# Verificar se DNS está configurado
if nslookup $DOMAIN | grep -q "69.6.221.201"; then
    echo "DNS configurado, obtendo certificados..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "Erro ao obter certificado para $DOMAIN"
    certbot --nginx -d admin.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "Erro ao obter certificado para admin.$DOMAIN"
    certbot --nginx -d api.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "Erro ao obter certificado para api.$DOMAIN"
else
    echo -e "${RED}⚠️  DNS não configurado ainda. Configure os DNS primeiro:${NC}"
    echo "   $DOMAIN → 69.6.221.201"
    echo "   www.$DOMAIN → 69.6.221.201"
    echo "   admin.$DOMAIN → 69.6.221.201"
    echo "   api.$DOMAIN → 69.6.221.201"
    echo ""
    echo "Depois execute:"
    echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "   certbot --nginx -d admin.$DOMAIN"
    echo "   certbot --nginx -d api.$DOMAIN"
fi

# Verificar status
echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📋 Informações importantes:"
echo -e "${GREEN}   Frontend: https://$DOMAIN${NC}"
echo -e "${GREEN}   Admin: https://admin.$DOMAIN${NC}"
echo -e "${GREEN}   API: https://api.$DOMAIN/api/health${NC}"
echo ""
echo "🔐 Credenciais (SALVE EM LOCAL SEGURO!):"
echo "   Admin Email: admin@primeiratroca.com.br"
echo "   Admin Senha: admin"
echo "   PostgreSQL Password: $POSTGRES_PASSWORD"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo "🔍 Verificar status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo "   docker-compose -f docker-compose.prod.yml logs -f"

