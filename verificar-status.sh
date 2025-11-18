#!/bin/bash
# Script para verificar o status de todos os containers

cd "$(dirname "$0")"

echo "🔍 Verificando status dos containers..."
echo ""

# Verificar containers Docker
echo "📦 Containers Docker:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Verificar se os containers estão respondendo
echo "🌐 Testando conectividade:"
echo ""

# Frontend (porta 8080)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
    echo "✅ Frontend (porta 8080): OK"
else
    echo "❌ Frontend (porta 8080): Não está respondendo"
fi

# Admin (porta 8081)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 | grep -q "200\|301\|302"; then
    echo "✅ Admin (porta 8081): OK"
else
    echo "❌ Admin (porta 8081): Não está respondendo"
fi

# Backend (porta 5000)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null | grep -q "200\|404"; then
    echo "✅ Backend (porta 5000): OK"
else
    echo "❌ Backend (porta 5000): Não está respondendo"
fi

echo ""
echo "📋 Logs dos containers:"
echo "   Frontend: docker-compose -f docker-compose.prod.yml logs frontend"
echo "   Admin: docker-compose -f docker-compose.prod.yml logs admin"
echo "   Backend: docker-compose -f docker-compose.prod.yml logs backend"

