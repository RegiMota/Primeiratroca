// Script para sincronizar produtos existentes com estoque para criar variações padrão
// Este script cria ProductVariant para produtos que têm Product.stock > 0 mas não têm variação padrão

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function syncProductsToStock() {
  try {
    console.log('🔄 Iniciando sincronização de produtos para estoque...\n');

    // Buscar todos os produtos com estoque > 0
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
        // Se existe mas o estoque está diferente, atualizar
        if (defaultVariant.stock !== product.stock) {
          await prisma.productVariant.update({
            where: { id: defaultVariant.id },
            data: { stock: product.stock },
          });
          console.log(`✅ Atualizado: Produto #${product.id} - "${product.name}" (Estoque: ${product.stock})`);
          updated++;
        } else {
          console.log(`⏭️  Já sincronizado: Produto #${product.id} - "${product.name}"`);
          skipped++;
        }
      } else {
        // Criar variação padrão
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

    console.log('\n📊 Resumo:');
    console.log(`   ✨ Variações criadas: ${created}`);
    console.log(`   ✅ Variações atualizadas: ${updated}`);
    console.log(`   ⏭️  Produtos já sincronizados: ${skipped}`);
    console.log(`\n✅ Sincronização concluída!`);

    // Estatísticas finais
    const totalVariants = await prisma.productVariant.count();
    const totalProductsWithStock = await prisma.product.count({
      where: { stock: { gt: 0 } },
    });

    console.log(`\n📈 Estatísticas:`);
    console.log(`   Total de variações no sistema: ${totalVariants}`);
    console.log(`   Total de produtos com estoque: ${totalProductsWithStock}`);
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar sincronização
syncProductsToStock()
  .then(() => {
    console.log('\n🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

