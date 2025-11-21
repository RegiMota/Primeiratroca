// Script para criar o campo keywords de forma definitiva
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando se o campo keywords existe...');
    
    // Verificar se o campo existe no banco
    const checkResult = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    `;
    
    if (checkResult && checkResult.length > 0) {
      console.log('✅ Campo keywords já existe!');
      console.log('   Tipo:', checkResult[0].data_type);
      return;
    }
    
    console.log('⚠️  Campo keywords NÃO existe. Criando...');
    
    // Método 1: Tentar com ALTER TABLE direto
    try {
      await prisma.$executeRaw`ALTER TABLE products ADD COLUMN keywords TEXT`;
      console.log('✅ Campo keywords criado com sucesso (método 1)!');
    } catch (error1) {
      if (error1.message?.includes('already exists') || 
          error1.message?.includes('duplicate') ||
          error1.code === '42701') {
        console.log('✅ Campo keywords já existe (erro ignorado)');
        return;
      }
      
      console.log('⚠️  Método 1 falhou. Tentando método 2...');
      console.log('   Erro:', error1.message);
      
      // Método 2: Usar executeRawUnsafe
      try {
        await prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN keywords TEXT');
        console.log('✅ Campo keywords criado com sucesso (método 2)!');
      } catch (error2) {
        if (error2.message?.includes('already exists') || 
            error2.message?.includes('duplicate') ||
            error2.code === '42701') {
          console.log('✅ Campo keywords já existe (erro ignorado)');
          return;
        }
        
        console.log('⚠️  Método 2 falhou. Tentando método 3...');
        console.log('   Erro:', error2.message);
        
        // Método 3: Usar IF NOT EXISTS (PostgreSQL 9.5+)
        try {
          await prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT');
          console.log('✅ Campo keywords criado com sucesso (método 3)!');
        } catch (error3) {
          console.error('❌ Todos os métodos falharam!');
          console.error('   Erro método 3:', error3.message);
          console.error('   Código:', error3.code);
          throw error3;
        }
      }
    }
    
    // Verificar novamente
    const verifyResult = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    `;
    
    if (verifyResult && verifyResult.length > 0) {
      console.log('✅ Campo keywords confirmado no banco!');
      console.log('   Tipo:', verifyResult[0].data_type);
      
      // Testar salvamento
      console.log('\n🧪 Testando salvamento de keywords...');
      const testProduct = await prisma.product.findFirst({
        select: { id: true, name: true }
      });
      
      if (testProduct) {
        console.log('   Produto de teste:', testProduct.id, '-', testProduct.name);
        
        const updated = await prisma.product.update({
          where: { id: testProduct.id },
          data: { keywords: 'teste-keywords-123' },
          select: { id: true, keywords: true }
        });
        
        console.log('   ✅ Keywords salvo:', updated.keywords);
        
        // Limpar teste
        await prisma.product.update({
          where: { id: testProduct.id },
          data: { keywords: null }
        });
        
        console.log('   ✅ Teste concluído e limpo');
      } else {
        console.log('   ⚠️  Nenhum produto encontrado para teste');
      }
    } else {
      console.error('❌ Campo keywords NÃO foi criado!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Processo falhou:', error);
    process.exit(1);
  });

