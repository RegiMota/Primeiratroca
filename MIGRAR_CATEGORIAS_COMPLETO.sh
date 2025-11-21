#!/bin/bash

# Script completo para migrar categorias de one-to-many para many-to-many

echo "🔄 Iniciando migração completa de categorias..."
echo ""

cd /root/Primeiratroca || exit 1

# 1. Atualizar código
echo "1️⃣ Atualizando código do repositório..."
git pull
echo ""

# 2. Aplicar migração do Prisma
echo "2️⃣ Aplicando migração do Prisma (db push)..."
docker-compose exec -T backend npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar migração do Prisma"
    exit 1
fi
echo "✅ Migração do Prisma aplicada"
echo ""

# 3. Executar script de migração de dados
echo "3️⃣ Migrando dados existentes..."
docker-compose exec -T backend node scripts/migrate-categories-to-many-to-many.js
if [ $? -ne 0 ]; then
    echo "⚠️  Aviso: Erro ao migrar dados. Continuando..."
fi
echo ""

# 4. Reiniciar backend
echo "4️⃣ Reiniciando backend..."
docker-compose restart backend
sleep 5
echo ""

# 5. Verificar se backend está rodando
echo "5️⃣ Verificando status do backend..."
if docker-compose ps | grep -q "backend.*Up"; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend não está rodando. Verifique os logs:"
    docker-compose logs --tail=50 backend
    exit 1
fi
echo ""

# 6. Testar endpoint
echo "6️⃣ Testando endpoint /api/products..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?featured=true&limit=1")
if [ "$response" = "200" ]; then
    echo "✅ Endpoint funcionando corretamente!"
else
    echo "❌ Endpoint retornou código $response"
    echo "Verificando logs do backend..."
    docker-compose logs --tail=20 backend | grep -i "error\|exception"
fi
echo ""

echo "✅ Migração concluída!"

