// Script para criar um usuário de teste
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Verificando se já existe usuário admin...\n');
    
    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });
    
    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log('\n💡 Se não lembrar a senha, você pode criar um novo usuário ou resetar a senha.');
      await prisma.$disconnect();
      return;
    }
    
    // Criar usuário admin padrão
    console.log('📝 Criando usuário admin padrão...\n');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@admin.com',
        password: hashedPassword,
        isAdmin: true,
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: admin123`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('   Código:', error.code);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestUser();
