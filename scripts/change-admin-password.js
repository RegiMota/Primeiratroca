// Script para alterar a senha do usuário admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function changeAdminPassword() {
  try {
    console.log('🔐 Alterar Senha do Admin\n');
    
    // Solicitar email do admin
    const email = await question('Digite o email do admin: ');
    
    if (!email) {
      console.log('❌ Email não pode estar vazio!');
      await prisma.$disconnect();
      rl.close();
      return;
    }
    
    // Verificar se o usuário existe e é admin
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log(`❌ Usuário com email "${email}" não encontrado!`);
      await prisma.$disconnect();
      rl.close();
      return;
    }
    
    if (!user.isAdmin) {
      console.log(`❌ O usuário "${email}" não é um administrador!`);
      await prisma.$disconnect();
      rl.close();
      return;
    }
    
    console.log(`\n✅ Usuário admin encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}\n`);
    
    // Solicitar nova senha
    const newPassword = await question('Digite a nova senha: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.log('❌ A senha deve ter pelo menos 6 caracteres!');
      await prisma.$disconnect();
      rl.close();
      return;
    }
    
    // Confirmar senha
    const confirmPassword = await question('Confirme a nova senha: ');
    
    if (newPassword !== confirmPassword) {
      console.log('❌ As senhas não coincidem!');
      await prisma.$disconnect();
      rl.close();
      return;
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    console.log('\n✅ Senha alterada com sucesso!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nova senha: ${newPassword}\n`);
    
    await prisma.$disconnect();
    rl.close();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await prisma.$disconnect();
    rl.close();
    process.exit(1);
  }
}

changeAdminPassword();

