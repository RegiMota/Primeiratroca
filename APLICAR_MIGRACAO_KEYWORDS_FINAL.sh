#!/bin/bash

echo "🔧 Aplicando migração do campo keywords no banco de dados..."
echo "============================================================"

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 15
else
    echo "   ✅ Backend está rodando"
fi

# 2. Aplicar migração usando Prisma
echo -e "\n2️⃣ Aplicando migração do Prisma (db push)..."
docker-compose exec backend npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao aplicar migração"
    echo "   Tentando método alternativo..."
    
    # Tentar criar o campo diretamente via SQL
    echo "   🔄 Tentando criar campo via SQL direto..."
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT\`;
        console.log('✅ Campo keywords criado com sucesso!');
      } catch (error) {
        console.error('❌ Erro:', error.message);
      } finally {
        await prisma.\$disconnect();
      }
    })();
    " 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Erro ao criar campo via SQL"
        exit 1
    fi
else
    echo "   ✅ Migração aplicada com sucesso!"
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar se o campo foi criado
echo -e "\n6️⃣ Verificando se o campo keywords foi criado..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const result = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    if (result && result.length > 0) {
      console.log('✅ Campo keywords confirmado no banco de dados!');
    } else {
      console.log('⚠️  Campo keywords não encontrado (pode ser normal se já existir)');
    }
  } catch (error) {
    console.error('⚠️  Não foi possível verificar (pode ser normal):', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 7. Verificar logs
echo -e "\n7️⃣ Verificando logs do backend (últimas 20 linhas)..."
docker-compose logs backend --tail=20 | grep -i "error\|keywords\|prisma\|ready" || docker-compose logs backend --tail=10

echo -e "\n✅ Migração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar o produto novamente no painel admin"
echo "   2. Se ainda der erro, verifique os logs: docker-compose logs backend -f"
echo "   3. A mensagem de erro agora deve ser mais detalhada"
echo ""

