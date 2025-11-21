/**
 * Script de Migração: Converter relacionamento categoryId para many-to-many
 * 
 * Este script migra os dados existentes do relacionamento one-to-many (categoryId)
 * para o novo relacionamento many-to-many (ProductCategory).
 * 
 * IMPORTANTE: Execute este script APÓS executar `npx prisma db push`
 * mas ANTES de remover o campo categoryId do schema.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCategories() {
  console.log('🔄 Iniciando migração de categorias para many-to-many...\n');

  try {
    // 1. Verificar se a tabela product_categories existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_categories'
      );
    `;

    if (!tableExists[0]?.exists) {
      console.log('❌ Tabela product_categories não existe!');
      console.log('   Execute primeiro: npx prisma db push');
      process.exit(1);
    }

    // 2. Verificar se ainda existe o campo categoryId na tabela products
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'categoryId'
      );
    `;

    if (!columnExists[0]?.exists) {
      console.log('⚠️  Campo categoryId não existe mais na tabela products.');
      console.log('   A migração pode já ter sido executada ou o schema foi atualizado.');
      console.log('   Verificando se há produtos sem categorias...\n');
    } else {
      console.log('✅ Campo categoryId encontrado. Iniciando migração...\n');
    }

    // 3. Buscar todos os produtos que ainda têm categoryId
    // Se o campo não existir mais, buscar produtos sem categorias na tabela de junção
    let productsToMigrate = [];

    if (columnExists[0]?.exists) {
      // Buscar produtos com categoryId (usando query raw porque o Prisma pode não ter o campo)
      productsToMigrate = await prisma.$queryRaw`
        SELECT id, "categoryId" 
        FROM products 
        WHERE "categoryId" IS NOT NULL
      `;
    } else {
      // Buscar produtos que não têm categorias na tabela de junção
      const productsWithCategories = await prisma.productCategory.findMany({
        select: { productId: true },
        distinct: ['productId'],
      });
      const productIdsWithCategories = new Set(
        productsWithCategories.map((pc) => pc.productId)
      );

      const allProducts = await prisma.product.findMany({
        select: { id: true },
      });

      productsToMigrate = allProducts
        .filter((p) => !productIdsWithCategories.has(p.id))
        .map((p) => ({ id: p.id, categoryId: null }));
    }

    if (productsToMigrate.length === 0) {
      console.log('✅ Nenhum produto precisa ser migrado.');
      console.log('   Todos os produtos já têm categorias associadas.\n');
      return;
    }

    console.log(`📦 Encontrados ${productsToMigrate.length} produtos para migrar.\n`);

    // 4. Migrar cada produto
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of productsToMigrate) {
      try {
        // Se o produto tem categoryId, criar relação na tabela de junção
        if (product.categoryId) {
          // Verificar se a relação já existe
          const existing = await prisma.productCategory.findFirst({
            where: {
              productId: product.id,
              categoryId: product.categoryId,
            },
          });

          if (existing) {
            console.log(`⏭️  Produto ${product.id}: Relação já existe, pulando...`);
            skipped++;
            continue;
          }

          // Criar relação
          await prisma.productCategory.create({
            data: {
              productId: product.id,
              categoryId: product.categoryId,
            },
          });

          console.log(`✅ Produto ${product.id}: Categoria ${product.categoryId} associada`);
          migrated++;
        } else {
          // Produto sem categoryId - criar relação com uma categoria padrão ou pular
          console.log(`⚠️  Produto ${product.id}: Sem categoryId, pulando...`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Erro ao migrar produto ${product.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log('\n✅ Migração concluída!\n');

    // 5. Verificar se todos os produtos têm pelo menos uma categoria
    const productsWithoutCategories = await prisma.product.findMany({
      where: {
        categories: {
          none: {},
        },
      },
      select: { id: true, name: true },
    });

    if (productsWithoutCategories.length > 0) {
      console.log('⚠️  ATENÇÃO: Produtos sem categorias:');
      productsWithoutCategories.forEach((p) => {
        console.log(`   - Produto ${p.id}: ${p.name}`);
      });
      console.log('\n   Esses produtos precisam ter pelo menos uma categoria associada.');
    } else {
      console.log('✅ Todos os produtos têm pelo menos uma categoria associada.\n');
    }
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateCategories()
  .then(() => {
    console.log('🎉 Migração finalizada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal na migração:', error);
    process.exit(1);
  });

