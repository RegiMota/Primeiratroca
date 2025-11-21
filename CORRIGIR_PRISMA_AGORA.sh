#!/bin/bash

echo "🔄 CORRIGINDO PRISMA CLIENT AGORA"
echo "================================="

# Garantir que o backend está rodando
echo -e "\n1️⃣ Iniciando backend se necessário..."
docker-compose up -d backend
sleep 10

# Aplicar schema
echo -e "\n2️⃣ Aplicando schema ao banco..."
docker-compose exec backend npx prisma db push --accept-data-loss

# Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

# Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# Aguardar
echo -e "\n5️⃣ Aguardando 20 segundos..."
sleep 20

# Verificar logs
echo -e "\n6️⃣ Logs do backend:"
docker-compose logs backend --tail=20 | grep -i "error\|categories\|prisma" || docker-compose logs backend --tail=20

# Testar
echo -e "\n7️⃣ Testando endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:5000/api/products?featured=true&limit=1"

echo -e "\n✅ Concluído!"

