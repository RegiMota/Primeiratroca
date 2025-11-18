#!/bin/bash

# Script para instalar Docker no AlmaLinux

set -e

echo "🐳 Instalando Docker no AlmaLinux..."
echo ""

# Atualizar sistema
echo "📦 Atualizando sistema..."
yum update -y

# Instalar dependências
echo "📦 Instalando dependências..."
yum install -y yum-utils device-mapper-persistent-data lvm2

# Adicionar repositório Docker
echo "📦 Adicionando repositório Docker..."
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
echo "🐳 Instalando Docker..."
yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar e habilitar Docker
echo "🚀 Iniciando serviço Docker..."
systemctl start docker
systemctl enable docker

# Adicionar usuário ao grupo docker
echo "👤 Configurando permissões..."
usermod -aG docker $USER || true

# Instalar Docker Compose standalone (se necessário)
echo "📦 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verificar instalação
echo ""
echo "🔍 Verificando instalação..."
echo ""
docker --version
docker-compose --version || docker compose version

echo ""
echo "✅ Docker instalado com sucesso!"
echo ""
echo "⚠️  Se você não é root, desconecte e reconecte via SSH"
echo "   para que as permissões do grupo docker sejam aplicadas."

