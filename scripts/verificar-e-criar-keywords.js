// Script para verificar e criar o campo keywords se não existir
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando se o campo keywords existe no banco...');
    
    // Tentar buscar um produto e verificar se o campo keywords existe
    try {
      const testProduct = await prisma.product.findFirst({
        select: {
          id: true,
          name: true,
          keywords: true,
        },
      });
      
      console.log('✅ Campo keywords existe no schema do Prisma Client');
      console.log('📦 Produto de teste:', {
        id: testProduct?.id,
        name: testProduct?.name,
        keywords: testProduct?.keywords,
      });
      
      // Verificar se o campo realmente existe no banco tentando uma query SQL direta
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'keywords'
      `;
      
      if (result && result.length > 0) {
        console.log('✅ Campo keywords existe no banco de dados!');
        console.log('📊 Estatísticas:');
        
        const stats = await prisma.$queryRaw`
          SELECT 
            COUNT(*) as total,
            COUNT(keywords) as com_keywords,
            COUNT(*) FILTER (WHERE keywords IS NOT NULL AND keywords != '') as com_keywords_preenchidas
          FROM products
        `;
        
        console.log(stats[0]);
      } else {
        console.log('❌ Campo keywords NÃO existe no banco de dados!');
        console.log('🔄 Tentando criar o campo...');
        
        // Tentar criar o campo usando SQL direto
        await prisma.$executeRaw`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS keywords TEXT
        `;
        
        console.log('✅ Campo keywords criado!');
      }
    } catch (error) {
      if (error.message?.includes('Unknown column') || error.message?.includes('column') || error.code === 'P2009') {
        console.log('❌ Campo keywords NÃO existe no banco de dados!');
        console.log('🔄 Tentando criar o campo...');
        
        try {
          await prisma.$executeRaw`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS keywords TEXT
          `;
          console.log('✅ Campo keywords criado com sucesso!');
        } catch (createError) {
          console.error('❌ Erro ao criar campo:', createError);
          console.log('💡 Execute manualmente: npx prisma db push --accept-data-loss');
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

