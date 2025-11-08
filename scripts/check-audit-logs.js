// Script para verificar se a tabela audit_logs existe
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    const count = await prisma.auditLog.count();
    console.log(`✅ Tabela audit_logs existe! (${count} logs)`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'P2025' || error.message.includes('does not exist')) {
      console.log('💡 Tabela audit_logs não existe. Execute: npm run db:push');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAuditLogs();
