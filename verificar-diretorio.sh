#!/bin/bash

# Script para verificar onde está o projeto

echo "🔍 Verificando localização do projeto..."
echo ""

# Verificar diretório atual
echo "📁 Diretório atual:"
pwd
echo ""

# Verificar se está no diretório do projeto
if [ -f "package.json" ] && [ -d "ecommerce-roupa-infantil" ]; then
    echo "✅ Você está na raiz do repositório!"
    echo "   Execute: cd ecommerce-roupa-infantil"
elif [ -f "package.json" ] && [ -f "docker-compose.prod.yml" ]; then
    echo "✅ Você está no diretório correto (ecommerce-roupa-infantil)!"
    echo "   Pode executar: bash deploy-vps.sh"
elif [ -d "ecommerce-roupa-infantil" ]; then
    echo "📁 Diretório ecommerce-roupa-infantil encontrado!"
    echo "   Execute: cd ecommerce-roupa-infantil"
else
    echo "❌ Diretório do projeto não encontrado aqui."
    echo ""
    echo "🔍 Procurando projeto..."
    if [ -d "/var/www/primeira-troca" ]; then
        echo "   ✅ Encontrado em: /var/www/primeira-troca"
        echo "   Execute: cd /var/www/primeira-troca/ecommerce-roupa-infantil"
    elif [ -d "/root/Primeiratroca" ]; then
        echo "   ✅ Encontrado em: /root/Primeiratroca"
        echo "   Execute: cd /root/Primeiratroca/ecommerce-roupa-infantil"
    elif [ -d "$HOME/Primeiratroca" ]; then
        echo "   ✅ Encontrado em: $HOME/Primeiratroca"
        echo "   Execute: cd $HOME/Primeiratroca/ecommerce-roupa-infantil"
    else
        echo "   ❌ Projeto não encontrado."
        echo "   Clone o repositório:"
        echo "   cd /var/www"
        echo "   git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca"
    fi
fi

echo ""
echo "📋 Estrutura esperada:"
echo "   primeira-troca/"
echo "   └── ecommerce-roupa-infantil/"
echo "       ├── deploy-vps.sh"
echo "       ├── docker-compose.prod.yml"
echo "       └── ..."

