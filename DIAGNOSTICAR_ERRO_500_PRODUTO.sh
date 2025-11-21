#!/bin/bash

echo "🔍 Diagnosticando erro 500 ao criar produto..."
echo "============================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ❌ Backend não está rodando!"
    exit 1
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar logs recentes do backend
echo -e "\n2️⃣ Verificando logs recentes do backend (últimas 50 linhas)..."
echo "   Procurando por erros relacionados a produtos..."
docker-compose logs backend --tail=50 | grep -i "error\|product\|500\|create" | tail -20 || docker-compose logs backend --tail=30

# 3. Verificar se o campo keywords existe
echo -e "\n3️⃣ Verificando se o campo keywords existe no banco..."
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
      console.log('   ✅ Campo keywords existe no banco');
      console.log('   Tipo:', result[0].data_type);
    } else {
      console.log('   ❌ Campo keywords NÃO existe no banco!');
      console.log('   💡 Execute: ./APLICAR_MIGRACAO_KEYWORDS_FINAL.sh');
    }
  } catch (error) {
    console.error('   ⚠️  Erro ao verificar:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 4. Verificar se há categorias no banco
echo -e "\n4️⃣ Verificando se há categorias no banco..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });
    console.log('   Categorias encontradas:', categories.length);
    if (categories.length > 0) {
      console.log('   Primeiras 5 categorias:');
      categories.slice(0, 5).forEach(cat => {
        console.log('   - ID:', cat.id, '| Nome:', cat.name);
      });
    } else {
      console.log('   ⚠️  Nenhuma categoria encontrada!');
      console.log('   💡 Crie categorias antes de criar produtos');
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 5. Verificar estrutura da tabela products
echo -e "\n5️⃣ Verificando estrutura da tabela products..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const columns = await prisma.\$queryRaw\`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    \`;
    console.log('   Colunas da tabela products:');
    columns.forEach(col => {
      console.log('   -', col.column_name, '(' + col.data_type + ')', col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL');
    });
  } catch (error) {
    console.error('   ⚠️  Erro ao verificar estrutura:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 6. Testar criação de produto simples (se possível)
echo -e "\n6️⃣ Testando conexão com banco e Prisma..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Testar se consegue acessar produtos
    const count = await prisma.product.count();
    console.log('   ✅ Conexão com banco OK');
    console.log('   Total de produtos:', count);
    
    // Verificar se consegue acessar categorias
    const catCount = await prisma.category.count();
    console.log('   Total de categorias:', catCount);
  } catch (error) {
    console.error('   ❌ Erro ao conectar:', error.message);
    console.error('   Código:', error.code);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

echo -e "\n✅ Diagnóstico concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Se o campo keywords não existe, execute: ./APLICAR_MIGRACAO_KEYWORDS_FINAL.sh"
echo "   2. Se não houver categorias, crie categorias primeiro"
echo "   3. Verifique os logs em tempo real: docker-compose logs backend -f"
echo "   4. Tente criar o produto novamente e observe os logs"
echo ""

