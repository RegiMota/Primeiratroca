#!/bin/bash

echo "🔍 VERIFICANDO ERRO 500 EM /api/products"
echo "========================================="

# 1. Verificar logs recentes do backend
echo -e "\n1️⃣ Últimos 50 logs do backend (buscando erros):"
docker-compose logs backend --tail=100 | grep -A 10 -B 5 "error\|Error\|ERROR\|500" | tail -50

# 2. Verificar se há produtos sem categorias
echo -e "\n2️⃣ Verificando produtos sem categorias na tabela de junção:"
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Buscar produtos sem categorias
    const productsWithoutCategories = await prisma.product.findMany({
      where: {
        categories: {
          none: {},
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });
    
    if (productsWithoutCategories.length > 0) {
      console.log('⚠️  Produtos sem categorias encontrados:');
      productsWithoutCategories.forEach(p => {
        console.log(\`   - ID: \${p.id}, Nome: \${p.name}\`);
      });
      console.log(\`\n   Total: \${productsWithoutCategories.length} produtos sem categorias\`);
    } else {
      console.log('✅ Todos os produtos têm pelo menos uma categoria');
    }
    
    // Testar query de produtos featured
    console.log('\n3️⃣ Testando query de produtos featured:');
    const featuredProducts = await prisma.product.findMany({
      where: { featured: true },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
      take: 1,
    });
    
    console.log(\`✅ Query executada com sucesso! Encontrados \${featuredProducts.length} produtos featured\`);
    
    if (featuredProducts.length > 0) {
      const product = featuredProducts[0];
      console.log(\`   Produto: \${product.name}\`);
      console.log(\`   Categorias: \${product.categories?.length || 0}\`);
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

check();
"

# 3. Testar endpoint diretamente
echo -e "\n4️⃣ Testando endpoint /api/products?featured=true&limit=1:"
curl -s http://localhost:5000/api/products?featured=true&limit=1 | head -c 500
echo ""

echo -e "\n✅ Verificação concluída!"

