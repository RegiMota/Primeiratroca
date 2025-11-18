#!/bin/bash

# Script para verificar estrutura do projeto na VPS

echo "🔍 Verificando estrutura do projeto..."
echo ""

# Verificar diretório atual
echo "📁 Diretório atual:"
pwd
echo ""

# Verificar se docker-compose.prod.yml está aqui
if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ Arquivo docker-compose.prod.yml encontrado!"
    echo "   Você está no diretório correto!"
    echo ""
    echo "📋 Arquivos encontrados:"
    ls -la | head -20
    echo ""
    echo "✅ Pode executar: bash deploy-vps.sh"
elif [ -d "ecommerce-roupa-infantil" ]; then
    echo "📁 Diretório ecommerce-roupa-infantil encontrado!"
    echo "   Execute: cd ecommerce-roupa-infantil"
elif [ -f "package.json" ]; then
    echo "📦 package.json encontrado!"
    echo "   Verificando se é o projeto correto..."
    if grep -q "primeira-troca" package.json 2>/dev/null; then
        echo "   ✅ É o projeto Primeira Troca!"
        echo "   Verificando se tem docker-compose.prod.yml..."
        if [ -f "docker-compose.prod.yml" ]; then
            echo "   ✅ Tudo OK! Pode executar: bash deploy-vps.sh"
        else
            echo "   ❌ docker-compose.prod.yml não encontrado"
            echo "   Listando arquivos..."
            ls -la | grep -E "(docker|Docker|deploy)" || echo "   Nenhum arquivo Docker encontrado"
        fi
    fi
else
    echo "❌ Estrutura do projeto não encontrada aqui."
    echo ""
    echo "📋 Conteúdo atual:"
    ls -la
fi

