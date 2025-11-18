#!/bin/bash

# Script para instalar Docker e Docker Compose na VPS

set -e

echo "🐳 Instalando Docker e Docker Compose..."
echo ""

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update

# Instalar dependências
echo "📦 Instalando dependências..."
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Instalar Docker
echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker instalado!"
else
    echo "✅ Docker já está instalado"
fi

# Adicionar usuário ao grupo docker
echo "👤 Configurando permissões..."
usermod -aG docker $USER || true

# Instalar Docker Compose
echo "📦 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado!"
else
    echo "✅ Docker Compose já está instalado"
fi

# Iniciar e habilitar Docker
echo "🚀 Iniciando serviço Docker..."
systemctl start docker
systemctl enable docker

# Verificar instalação
echo ""
echo "🔍 Verificando instalação..."
echo ""
docker --version
docker-compose --version

echo ""
echo "✅ Docker e Docker Compose instalados com sucesso!"
echo ""
echo "⚠️  IMPORTANTE: Se você não é root, desconecte e reconecte via SSH"
echo "   para que as permissões do grupo docker sejam aplicadas."
echo ""
echo "   Ou execute: newgrp docker"

