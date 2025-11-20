// Script para criar usuário admin (versão simples com parâmetros)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Obter parâmetros da linha de comando
    const email = process.argv[2] || 'admin@primeiratroca.com.br';
    const password = process.argv[3] || 'admin';
    const name = process.argv[4] || 'Administrador';
    
    console.log('👤 Criar Usuário Admin\n');
    console.log(`Email: ${email}`);
    console.log(`Nome: ${name}`);
    console.log(`Senha: ${password}\n`);
    
    if (password.length < 6) {
      console.log('❌ A senha deve ter pelo menos 6 caracteres!');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    // Verificar se já existe admin com esse email
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingAdmin) {
      console.log('⚠️  Usuário com esse email já existe!');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   É Admin: ${existingAdmin.isAdmin ? 'Sim' : 'Não'}\n`);
      
      // Perguntar se quer tornar admin
      if (!existingAdmin.isAdmin) {
        console.log('💡 Tornando usuário existente como admin...');
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { isAdmin: true },
        });
        console.log('✅ Usuário agora é admin!');
      }
      
      await prisma.$disconnect();
      return;
    }
    
    // Criar novo admin
    console.log('📝 Criando usuário admin...\n');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: true,
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: ${password}\n`);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();

