#!/bin/bash

echo "🔄 REGENERANDO PRISMA CLIENT NO CONTAINER DO BACKEND"
echo "===================================================="

# 1. Iniciar backend se não estiver rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   Iniciando backend..."
    docker-compose up -d backend
    sleep 10
fi

# 2. Aplicar schema ao banco (se necessário)
echo -e "\n2️⃣ Aplicando schema ao banco (db push)..."
docker-compose exec backend npx prisma db push --accept-data-loss

# 3. Regenerar Prisma Client DENTRO do container em execução
echo -e "\n3️⃣ Regenerando Prisma Client no container do backend..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao regenerar Prisma Client"
    exit 1
fi

# 4. Reiniciar backend para carregar o novo client
echo -e "\n4️⃣ Reiniciando backend para carregar o novo Prisma Client..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar logs
echo -e "\n6️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30

# 7. Testar endpoint
echo -e "\n7️⃣ Testando endpoint /api/products?featured=true&limit=1:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?featured=true&limit=1" 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Endpoint está respondendo (Status: $RESPONSE)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $RESPONSE)"
        sleep 3
    fi
done

echo -e "\n✅ Processo concluído!"

