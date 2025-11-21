#!/bin/bash

echo "🔄 Aplicando migração do Prisma para campo keywords..."
echo "======================================================"

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   Iniciando backend..."
    docker-compose up -d backend
    sleep 10
fi

# 2. Aplicar schema ao banco
echo -e "\n2️⃣ Aplicando schema ao banco (criando campo keywords)..."
docker-compose exec backend npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar schema"
    echo "Verificando logs..."
    docker-compose logs backend --tail=20
    exit 1
fi

echo "✅ Schema aplicado com sucesso!"

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "✅ Prisma Client regenerado!"

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (15 segundos)..."
sleep 15

# 6. Verificar logs
echo -e "\n6️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30 | grep -i "error\|keywords\|prisma" || docker-compose logs backend --tail=20

# 7. Testar endpoint
echo -e "\n7️⃣ Testando endpoint de produtos..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?limit=1" 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Endpoint está respondendo (Status: $RESPONSE)"
else
    echo "   ⚠️  Endpoint retornou Status: $RESPONSE"
fi

echo -e "\n✅ Migração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente atualizar o produto novamente no painel admin"
echo "   2. O campo keywords agora deve funcionar corretamente"
echo ""

