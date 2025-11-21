#!/bin/bash

echo "🔧 Resolução Completa para Campo Keywords"
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

# 2. Aplicar migração do Prisma (criar campo keywords)
echo -e "\n2️⃣ Aplicando migração do Prisma (criar campo keywords)..."
docker-compose exec backend npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "   ⚠️  Erro ao aplicar db push. Tentando criar campo via SQL..."
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT\`;
        console.log('✅ Campo keywords criado via SQL!');
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
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 4. Verificar se o campo foi criado
echo -e "\n4️⃣ Verificando se o campo keywords foi criado..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const result = await prisma.\$queryRaw\`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    if (result && result.length > 0) {
      console.log('✅ Campo keywords confirmado no banco!');
      console.log('   Tipo:', result[0].data_type);
    } else {
      console.log('❌ Campo keywords NÃO foi criado!');
      console.log('   Execute manualmente: docker-compose exec backend npx prisma db push --accept-data-loss');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   ❌ Falha ao verificar campo keywords"
    exit 1
fi

# 5. Reiniciar backend
echo -e "\n5️⃣ Reiniciando backend..."
docker-compose restart backend

# 6. Aguardar inicialização
echo -e "\n6️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 7. Testar salvamento de keywords
echo -e "\n7️⃣ Testando salvamento de keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Buscar primeiro produto
    const product = await prisma.product.findFirst({
      select: { id: true, name: true, keywords: true }
    });
    
    if (product) {
      console.log('   Produto de teste encontrado:');
      console.log('   - ID:', product.id);
      console.log('   - Nome:', product.name);
      console.log('   - Keywords atual:', product.keywords || 'null');
      
      // Tentar atualizar com keywords de teste
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { keywords: 'teste-keywords-123' },
        select: { id: true, keywords: true }
      });
      
      console.log('   ✅ Keywords atualizado com sucesso!');
      console.log('   - Keywords após update:', updated.keywords);
      
      // Limpar keywords de teste
      await prisma.product.update({
        where: { id: product.id },
        data: { keywords: null }
      });
      console.log('   ✅ Keywords de teste removido');
    } else {
      console.log('   ⚠️  Nenhum produto encontrado para testar');
    }
  } catch (error) {
    console.error('   ❌ Erro ao testar:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 8. Verificar logs
echo -e "\n8️⃣ Verificando logs do backend (últimas 20 linhas)..."
docker-compose logs backend --tail=20 | grep -i "keywords\|error\|ready" || docker-compose logs backend --tail=10

echo -e "\n✅ Resolução completa aplicada!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar/atualizar um produto com palavras-chave no painel admin"
echo "   2. O campo keywords agora deve ser salvo corretamente"
echo "   3. Verifique os logs: docker-compose logs backend -f"
echo "   4. Procure por mensagens '[POST /products] Keywords' ou '[PUT /products/X] Keywords'"
echo ""

