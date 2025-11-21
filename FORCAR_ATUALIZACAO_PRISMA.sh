#!/bin/bash

echo "🔄 FORÇANDO ATUALIZAÇÃO COMPLETA DO PRISMA"
echo "=========================================="

# 1. Parar o backend
echo -e "\n1️⃣ Parando backend..."
docker-compose stop backend

# 2. Verificar schema do Prisma
echo -e "\n2️⃣ Verificando schema do Prisma..."
docker-compose run --rm backend npx prisma validate

# 3. Aplicar mudanças do schema ao banco (db push)
echo -e "\n3️⃣ Aplicando mudanças do schema ao banco (db push)..."
docker-compose run --rm backend npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar schema. Tentando forçar..."
    docker-compose run --rm backend npx prisma db push --force-reset --skip-generate
fi

# 4. Regenerar Prisma Client
echo -e "\n4️⃣ Regenerando Prisma Client..."
docker-compose run --rm backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao regenerar Prisma Client"
    exit 1
fi

# 5. Verificar se o client foi gerado corretamente
echo -e "\n5️⃣ Verificando se o relacionamento 'categories' existe no client..."
docker-compose run --rm backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tentar uma query simples para verificar se categories existe
prisma.product.findFirst({
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
}).then(() => {
  console.log('✅ Relacionamento categories está disponível no Prisma Client!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Erro:', err.message);
  if (err.message.includes('categories')) {
    console.error('   O relacionamento categories NÃO está disponível no Prisma Client');
    console.error('   O schema pode não ter sido atualizado corretamente');
  }
  process.exit(1);
});
"

# 6. Reiniciar backend
echo -e "\n6️⃣ Reiniciando backend..."
docker-compose restart backend

# 7. Aguardar inicialização
echo -e "\n7️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 8. Verificar logs
echo -e "\n8️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30

# 9. Testar endpoint
echo -e "\n9️⃣ Testando endpoint /api/products?featured=true&limit=1:"
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

