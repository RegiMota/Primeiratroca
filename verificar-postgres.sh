#!/bin/bash
# Script para verificar e corrigir a senha do PostgreSQL

cd "$(dirname "$0")"

echo "🔍 Verificando configuração do PostgreSQL..."
echo ""

# Carregar variáveis do .env.prod
if [ -f .env.prod ]; then
    source .env.prod
    echo "✅ Arquivo .env.prod encontrado"
    echo "   POSTGRES_USER: ${POSTGRES_USER:-primeiratroca}"
    echo "   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:10}..." # Mostrar apenas primeiros 10 caracteres
    echo "   POSTGRES_DB: ${POSTGRES_DB:-primeiratroca}"
    echo ""
else
    echo "❌ Arquivo .env.prod não encontrado!"
    exit 1
fi

# Verificar se o container do PostgreSQL está rodando
if docker ps | grep -q "primeira-troca-db-prod"; then
    echo "✅ Container do PostgreSQL está rodando"
    
    # Tentar conectar ao PostgreSQL
    echo ""
    echo "🔐 Testando conexão com PostgreSQL..."
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    if docker exec primeira-troca-db-prod psql -U "${POSTGRES_USER:-primeiratroca}" -d "${POSTGRES_DB:-primeiratroca}" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Conexão com PostgreSQL bem-sucedida!"
    else
        echo "❌ Erro ao conectar ao PostgreSQL"
        echo ""
        echo "🔧 Tentando verificar a senha atual do container..."
        docker exec primeira-troca-db-prod env | grep POSTGRES
        echo ""
        echo "💡 Se a senha estiver incorreta, você pode:"
        echo "   1. Parar os containers: docker-compose -f docker-compose.prod.yml down"
        echo "   2. Remover o volume: docker volume rm primeiratroca_postgres_data"
        echo "   3. Reiniciar: ./restart-backend.sh"
    fi
else
    echo "❌ Container do PostgreSQL não está rodando"
    echo "   Execute: docker-compose -f docker-compose.prod.yml up -d postgres"
fi

