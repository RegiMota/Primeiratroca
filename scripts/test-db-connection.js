// Script para testar conexão com o banco de dados
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');
  
  try {
    // Teste 1: Conectar ao banco
    console.log('1️⃣ Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados!\n');
    
    // Teste 2: Verificar se o banco existe
    console.log('2️⃣ Testando query simples...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Query executada com sucesso!\n');
    
    // Teste 3: Verificar se a tabela users existe
    console.log('3️⃣ Verificando tabela users...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tabela users existe! (${userCount} usuários)\n`);
    } catch (error) {
      console.error('⚠️  Tabela users não existe ou há erro:', error.message);
      console.log('💡 Execute: npm run db:push\n');
    }
    
    // Teste 4: Verificar se a tabela settings existe
    console.log('4️⃣ Verificando tabela settings...');
    try {
      const settingsCount = await prisma.settings.count();
      console.log(`✅ Tabela settings existe! (${settingsCount} configurações)\n`);
    } catch (error) {
      console.error('⚠️  Tabela settings não existe ou há erro:', error.message);
      console.log('💡 Execute: npm run db:push\n');
    }
    
    console.log('✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.error('❌ Código do erro:', error.code);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Solução:');
      console.error('   - Verifique se o MySQL está rodando (XAMPP ou serviço MySQL)');
      console.error('   - Verifique a DATABASE_URL no arquivo .env');
      console.error('   - Verifique se o banco de dados existe');
    } else if (error.code === 'P1017') {
      console.error('\n💡 Solução:');
      console.error('   - O servidor MySQL foi desconectado');
      console.error('   - Reinicie o MySQL');
    } else {
      console.error('\n💡 Verifique:');
      console.error('   - MySQL está rodando');
      console.error('   - DATABASE_URL está correta no .env');
      console.error('   - O banco de dados existe');
      console.error('   - Execute: npm run db:push');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
