#!/bin/bash

# Script para verificar instalação do Docker na VPS

echo "🔍 Verificando instalação do Docker..."
echo ""

# Verificar Docker
echo "📦 Docker:"
if command -v docker &> /dev/null; then
    echo "   ✅ Docker instalado"
    docker --version
else
    echo "   ❌ Docker NÃO instalado"
fi

echo ""

# Verificar Docker Compose
echo "📦 Docker Compose:"
if command -v docker-compose &> /dev/null; then
    echo "   ✅ Docker Compose instalado"
    docker-compose --version
else
    echo "   ❌ Docker Compose NÃO instalado"
fi

echo ""

# Verificar se Docker está rodando
echo "🐳 Status do Docker:"
if systemctl is-active --quiet docker; then
    echo "   ✅ Serviço Docker está rodando"
else
    echo "   ⚠️  Serviço Docker NÃO está rodando"
    echo "   Execute: sudo systemctl start docker"
fi

echo ""

# Verificar se usuário está no grupo docker
echo "👤 Permissões:"
if groups | grep -q docker; then
    echo "   ✅ Usuário está no grupo docker"
else
    echo "   ⚠️  Usuário NÃO está no grupo docker"
    echo "   Execute: sudo usermod -aG docker $USER"
    echo "   Depois desconecte e reconecte via SSH"
fi

echo ""

# Verificar containers rodando
echo "📊 Containers Docker:"
if command -v docker &> /dev/null; then
    docker ps
else
    echo "   Docker não está instalado"
fi

