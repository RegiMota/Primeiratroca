#!/bin/bash

echo "🔄 REGENERANDO PRISMA CLIENT E REINICIANDO BACKEND"
echo "=================================================="

# 1. Regenerar Prisma Client
echo -e "\n1️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "✅ Prisma Client regenerado com sucesso!"

# 2. Reiniciar backend para usar o novo client
echo -e "\n2️⃣ Reiniciando backend..."
docker-compose restart backend

# 3. Aguardar backend inicializar
echo -e "\n3️⃣ Aguardando backend inicializar (15 segundos)..."
sleep 15

# 4. Verificar logs
echo -e "\n4️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30

# 5. Testar endpoint
echo -e "\n5️⃣ Testando endpoint /api/products?featured=true&limit=1:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/products?featured=true&limit=1 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Endpoint está respondendo (Status: $RESPONSE)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $RESPONSE)"
        sleep 3
    fi
done

echo -e "\n✅ Processo concluído!"

