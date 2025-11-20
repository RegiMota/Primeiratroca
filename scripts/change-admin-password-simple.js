// Script para alterar a senha do usuário admin (versão simples com parâmetros)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function changeAdminPassword() {
  try {
    // Obter parâmetros da linha de comando
    const email = process.argv[2] || 'admin@primeiratroca.com.br';
    const newPassword = process.argv[3];
    
    if (!newPassword) {
      console.log('❌ Uso: node change-admin-password-simple.js [email] [nova_senha]');
      console.log('   Exemplo: node change-admin-password-simple.js admin@primeiratroca.com.br MinhaNovaSenha123');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    if (newPassword.length < 6) {
      console.log('❌ A senha deve ter pelo menos 6 caracteres!');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log('🔐 Alterar Senha do Admin\n');
    console.log(`Email: ${email}`);
    
    // Verificar se o usuário existe e é admin
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log(`❌ Usuário com email "${email}" não encontrado!`);
      await prisma.$disconnect();
      process.exit(1);
    }
    
    if (!user.isAdmin) {
      console.log(`❌ O usuário "${email}" não é um administrador!`);
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Usuário admin encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}\n`);
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Senha alterada com sucesso!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nova senha: ${newPassword}\n`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

changeAdminPassword();

