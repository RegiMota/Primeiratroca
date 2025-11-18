// Script para verificar se existe usuário admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Verificando usuário admin...\n');
    
    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });
    
    if (existingAdmin) {
      console.log('✅ Usuário admin encontrado!');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Admin: ${existingAdmin.isAdmin}`);
      await prisma.$disconnect();
      return;
    }
    
    // Se não existe, criar
    console.log('❌ Nenhum usuário admin encontrado.');
    console.log('📝 Criando usuário admin...\n');
    
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@primeiratroca.com.br',
        password: hashedPassword,
        isAdmin: true,
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: admin`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAdmin();

