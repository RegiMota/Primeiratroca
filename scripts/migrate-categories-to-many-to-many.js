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
    // 1. Verificar se a tabela product_categories existe (PostgreSQL)
    let tableExists = false;
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_categories'
        ) as exists;
      `;
      tableExists = result[0]?.exists || false;
    } catch (error) {
      console.log('⚠️  Erro ao verificar tabela, tentando método alternativo...');
      // Tentar método alternativo: verificar se conseguimos fazer uma query na tabela
      try {
        await prisma.$queryRaw`SELECT 1 FROM product_categories LIMIT 1`;
        tableExists = true;
      } catch (e) {
        tableExists = false;
      }
    }

    if (!tableExists) {
      console.log('❌ Tabela product_categories não existe!');
      console.log('   Tentando criar a tabela manualmente...');
      
      try {
        // Criar tabela manualmente
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS product_categories (
            id SERIAL PRIMARY KEY,
            "productId" INTEGER NOT NULL,
            "categoryId" INTEGER NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE("productId", "categoryId")
          );
        `;
        
        // Criar índices
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
          ON product_categories("productId");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS idx_product_categories_category_id 
          ON product_categories("categoryId");
        `;
        
        // Criar foreign keys
        await prisma.$executeRaw`
          ALTER TABLE product_categories
          ADD CONSTRAINT IF NOT EXISTS fk_product_categories_product
          FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE product_categories
          ADD CONSTRAINT IF NOT EXISTS fk_product_categories_category
          FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE CASCADE;
        `;
        
        console.log('✅ Tabela product_categories criada com sucesso!');
        tableExists = true;
      } catch (createError) {
        console.error('❌ Erro ao criar tabela:', createError.message);
        console.log('   Execute manualmente: npx prisma db push --force-reset');
        process.exit(1);
      }
    } else {
      console.log('✅ Tabela product_categories encontrada!');
    }

    // 2. Verificar se ainda existe o campo categoryId na tabela products
    let columnExists = false;
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'categoryId'
        ) as exists;
      `;
      columnExists = result[0]?.exists || false;
    } catch (error) {
      console.log('⚠️  Erro ao verificar coluna categoryId, assumindo que não existe...');
      columnExists = false;
    }
    
    console.log(`   Campo categoryId existe: ${columnExists}\n`);

    if (!columnExists) {
      console.log('⚠️  Campo categoryId não existe mais na tabela products.');
      console.log('   A migração pode já ter sido executada ou o schema foi atualizado.');
      console.log('   Verificando se há produtos sem categorias...\n');
    } else {
      console.log('✅ Campo categoryId encontrado. Iniciando migração...\n');
    }

    // 3. Buscar todos os produtos que ainda têm categoryId
    // Se o campo não existir mais, buscar produtos sem categorias na tabela de junção
    let productsToMigrate = [];

    if (columnExists) {
      try {
        // Buscar produtos com categoryId (usando query raw porque o Prisma pode não ter o campo)
        productsToMigrate = await prisma.$queryRaw`
          SELECT id, "categoryId" 
          FROM products 
          WHERE "categoryId" IS NOT NULL
        `;
      } catch (error) {
        console.log('⚠️  Erro ao buscar produtos com categoryId:', error.message);
        console.log('   Tentando método alternativo...');
        productsToMigrate = [];
      }
    }
    
    // Se não encontrou produtos com categoryId, verificar produtos sem categorias
    if (productsToMigrate.length === 0) {
      try {
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
      } catch (error) {
        console.log('⚠️  Erro ao buscar produtos sem categorias:', error.message);
        productsToMigrate = [];
      }
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

