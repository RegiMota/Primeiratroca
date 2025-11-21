#!/bin/bash

echo "🔧 Correção Definitiva para Campo Keywords"
echo "=========================================="

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

# 2. Verificar se o campo keywords existe
echo -e "\n2️⃣ Verificando se o campo keywords existe no banco..."
KEYWORDS_EXISTS=$(docker-compose exec -T backend node -e "
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
      console.log('EXISTS');
    } else {
      console.log('NOT_EXISTS');
    }
  } catch (error) {
    console.log('ERROR');
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null | tr -d ' ')

if [ "$KEYWORDS_EXISTS" = "EXISTS" ]; then
    echo "   ✅ Campo keywords existe no banco"
else
    echo "   ❌ Campo keywords NÃO existe no banco!"
    echo "   🔄 Criando campo keywords..."
    
    # Tentar criar via SQL direto
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT\`;
        console.log('✅ Campo keywords criado!');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('✅ Campo keywords já existe');
        } else {
          console.error('❌ Erro:', error.message);
          process.exit(1);
        }
      } finally {
        await prisma.\$disconnect();
      }
    })();
    " 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "   ⚠️  Erro ao criar via SQL. Tentando db push..."
        docker-compose exec backend npx prisma db push --accept-data-loss
    fi
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar se o campo foi criado e testar salvamento
echo -e "\n6️⃣ Testando salvamento de keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Verificar se o campo existe
    const check = await prisma.\$queryRaw\`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords confirmado no banco');
      console.log('   Tipo:', check[0].data_type);
      
      // Verificar produtos existentes
      const products = await prisma.product.findMany({
        select: { id: true, name: true, keywords: true },
        take: 3
      });
      
      console.log('   Produtos de teste:');
      products.forEach(p => {
        console.log('   - ID:', p.id, '| Nome:', p.name, '| Keywords:', p.keywords || 'null');
      });
    } else {
      console.log('❌ Campo keywords ainda não existe!');
      console.log('   Execute manualmente: docker-compose exec backend npx prisma db push --accept-data-loss');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 7. Verificar logs recentes
echo -e "\n7️⃣ Verificando logs recentes do backend..."
docker-compose logs backend --tail=30 | grep -i "keywords\|error\|ready" || docker-compose logs backend --tail=15

echo -e "\n✅ Correção aplicada!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar/atualizar um produto com palavras-chave"
echo "   2. Verifique os logs: docker-compose logs backend -f"
echo "   3. Procure por mensagens '[POST /products] Keywords' ou '[PUT /products/X] Keywords'"
echo "   4. Se ainda não funcionar, o campo pode não existir - execute:"
echo "      docker-compose exec backend npx prisma db push --accept-data-loss"
echo ""

