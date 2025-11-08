// Script para migrar produtos existentes que têm estoque mas não têm variação
// Este script cria variações padrão para todos os produtos que têm estoque > 0

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProductsToVariants() {
  try {
    console.log('🔄 Iniciando migração de produtos para variações...\n');

    // Buscar todos os produtos que têm estoque > 0
    const productsWithStock = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      include: {
        variants: true,
      },
    });

    console.log(`📦 Encontrados ${productsWithStock.length} produtos com estoque > 0\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of productsWithStock) {
      // Verificar se já existe uma variação padrão (sem tamanho/cor)
      const defaultVariant = product.variants.find(
        (v) => v.size === null && v.color === null
      );

      if (defaultVariant) {
        // Se já existe, atualizar o estoque
        if (defaultVariant.stock !== product.stock) {
          await prisma.productVariant.update({
            where: { id: defaultVariant.id },
            data: { stock: product.stock },
          });
          console.log(`✅ Atualizado: Produto #${product.id} - "${product.name}" (Estoque: ${product.stock})`);
          updated++;
        } else {
          console.log(`⏭️  Ignorado: Produto #${product.id} - "${product.name}" (já sincronizado)`);
          skipped++;
        }
      } else {
        // Se não existe, criar uma variação padrão
        try {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              size: null,
              color: null,
              stock: product.stock,
              minStock: 5,
              price: null,
              isActive: true,
            },
          });
          console.log(`✨ Criado: Produto #${product.id} - "${product.name}" (Estoque: ${product.stock})`);
          created++;
        } catch (error) {
          console.error(`❌ Erro ao criar variação para produto #${product.id}:`, error.message);
        }
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✨ Variações criadas: ${created}`);
    console.log(`   ✅ Variações atualizadas: ${updated}`);
    console.log(`   ⏭️  Produtos ignorados: ${skipped}`);
    console.log(`   📦 Total processado: ${productsWithStock.length}\n`);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateProductsToVariants();

