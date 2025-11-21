#!/bin/bash

# Script para diagnosticar o erro 500 na rota de produtos

echo "🔍 Diagnosticando erro 500 na rota /api/products..."
echo ""

# 1. Verificar status dos containers
echo "1️⃣ Verificando status dos containers..."
docker-compose ps
echo ""

# 2. Verificar logs recentes do backend
echo "2️⃣ Últimas 50 linhas dos logs do backend (erros):"
docker-compose logs --tail=50 backend | grep -i "error\|exception\|failed" || echo "Nenhum erro encontrado nos logs recentes"
echo ""

# 3. Verificar se a tabela product_categories existe
echo "3️⃣ Verificando estrutura do banco de dados..."
docker-compose exec -T backend npx prisma db execute --stdin <<EOF
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND (table_name = 'products' OR table_name = 'product_categories')
ORDER BY table_name, ordinal_position;
EOF

echo ""
echo "4️⃣ Verificando se há produtos sem categorias..."
docker-compose exec -T backend npx prisma db execute --stdin <<EOF
SELECT 
  p.id,
  p.name,
  COUNT(pc.id) as category_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc."productId"
GROUP BY p.id, p.name
HAVING COUNT(pc.id) = 0
LIMIT 10;
EOF

echo ""
echo "5️⃣ Testando query de produtos diretamente..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testando busca de produtos...');
    const products = await prisma.product.findMany({
      take: 1,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log('✅ Query executada com sucesso!');
    console.log('Produtos encontrados:', products.length);
    if (products.length > 0) {
      console.log('Primeiro produto:', {
        id: products[0].id,
        name: products[0].name,
        categoriesCount: products[0].categories?.length || 0,
      });
    }
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.\$disconnect();
  }
}

test();
"

echo ""
echo "6️⃣ Testando endpoint da API..."
curl -s "http://localhost:5000/api/products?featured=true&limit=1" | head -c 500
echo ""
echo ""

echo "✅ Diagnóstico concluído!"

