#!/bin/bash

echo "🔄 Atualizando e Reconstruindo Frontend"
echo "========================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "📥 Fazendo git pull..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer git pull!"
    exit 1
fi

echo "✅ Código atualizado"
echo ""

echo "🔨 Reconstruindo container do frontend..."
docker-compose up -d --build frontend

if [ $? -ne 0 ]; then
    echo "❌ Erro ao reconstruir frontend!"
    exit 1
fi

echo ""
echo "✅ Frontend reconstruído com sucesso!"
echo ""
echo "📋 Verificando status..."
docker-compose ps frontend
echo ""
echo "📝 Últimos logs (Ctrl+C para sair):"
docker-compose logs --tail=50 frontend

