// Rota de teste para diagnóstico
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Teste de conexão com banco de dados
router.get('/db', async (req, res) => {
  try {
    // Testar conexão básica
    await prisma.$queryRaw`SELECT 1`;
    
    // Testar se tabela users existe
    const userCount = await prisma.user.count();
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      tables: {
        users: userCount,
      },
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;
