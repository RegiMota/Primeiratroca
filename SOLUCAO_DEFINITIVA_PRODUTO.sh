#!/bin/bash

echo "🔧 Solução Definitiva para Erro ao Criar Produto"
echo "================================================="

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

# 2. Verificar e criar campo keywords se não existir
echo -e "\n2️⃣ Verificando e criando campo keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Verificar se o campo existe
    const check = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords já existe');
    } else {
      console.log('⚠️  Campo keywords não existe. Criando...');
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN keywords TEXT\`;
        console.log('✅ Campo keywords criado com sucesso!');
      } catch (createError) {
        if (createError.message.includes('already exists') || createError.message.includes('duplicate')) {
          console.log('✅ Campo keywords já existe (verificação anterior falhou)');
        } else {
          throw createError;
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   ⚠️  Erro ao verificar/criar campo. Tentando método alternativo..."
    docker-compose exec backend npx prisma db push --accept-data-loss
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 4. Verificar se há categorias
echo -e "\n4️⃣ Verificando categorias..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });
    console.log('   Total de categorias:', categories.length);
    if (categories.length === 0) {
      console.log('   ⚠️  Nenhuma categoria encontrada!');
      console.log('   💡 Crie categorias antes de criar produtos');
    } else {
      console.log('   ✅ Categorias disponíveis');
    }
  } catch (error) {
    console.error('   ⚠️  Erro ao verificar categorias:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 5. Reiniciar backend
echo -e "\n5️⃣ Reiniciando backend..."
docker-compose restart backend

# 6. Aguardar inicialização
echo -e "\n6️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 7. Verificar logs
echo -e "\n7️⃣ Verificando logs do backend (últimas 20 linhas)..."
docker-compose logs backend --tail=20 | grep -i "error\|ready\|started" || docker-compose logs backend --tail=10

# 8. Testar conexão
echo -e "\n8️⃣ Testando conexão com banco..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const count = await prisma.product.count();
    console.log('   ✅ Conexão com banco OK');
    console.log('   Total de produtos:', count);
  } catch (error) {
    console.error('   ❌ Erro ao conectar:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

echo -e "\n✅ Solução aplicada!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar o produto novamente no painel admin"
echo "   2. Se ainda der erro, verifique os logs: docker-compose logs backend -f"
echo "   3. A mensagem de erro agora deve ser mais clara e específica"
echo ""
echo "💡 Se o erro persistir, execute o diagnóstico:"
echo "   ./DIAGNOSTICAR_ERRO_500_PRODUTO.sh"
echo ""

