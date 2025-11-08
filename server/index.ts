import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import os from 'os';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import cartRoutes from './routes/cart';
import reviewRoutes from './routes/reviews';
import settingsRoutes from './routes/settings';
import productImagesRoutes from './routes/productImages';
import couponsRoutes from './routes/coupons';
import paymentsRoutes from './routes/payments';
import stockRoutes from './routes/stock';
import notificationsRoutes from './routes/notifications';
import shippingRoutes from './routes/shipping';
import addressesRoutes from './routes/addresses';
import wishlistRoutes from './routes/wishlist';
import ticketsRoutes from './routes/tickets';
import chatRoutes from './routes/chat';
import faqRoutes from './routes/faq';
import testRoutes from './routes/test';
import { initSocketServer } from './socket';
import { initStockJobs } from './jobs/stockJobs';
import { initWishlistJobs } from './jobs/wishlistJobs';
import { initShippingJobs } from './jobs/shippingJobs';
import { globalRateLimiter } from './middleware/rateLimit';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Em desenvolvimento, aceitar localhost, 127.0.0.1 e IPs da rede local
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      if (!origin) {
        return callback(null, true);
      }
      
      // Aceitar localhost e 127.0.0.1
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // Aceitar IPs da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const ipPattern = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/;
      if (ipPattern.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Em produção, usar apenas origens permitidas
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000', // Site principal
      'http://localhost:3001', // Admin panel (v2.0)
      'http://localhost:3002', // Site principal (porta alternativa)
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Aumentar limite para upload de imagens base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy para obter IP real do cliente (importante para rate limiting e auditoria)
app.set('trust proxy', 1);

// Rate Limiting Global (aplicado a todas as rotas)
app.use('/api', globalRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', productImagesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/test', testRoutes);

// Error handling middleware (must be after routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Testar conexão com banco de dados
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    res.json({ 
      status: 'ok', 
      message: 'Primeira Troca API is running',
      database: 'connected'
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Primeira Troca API is running but database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
});

// Inicializar Socket.io server (opcional - requer SOCKET_IO_ENABLED=true)
initSocketServer(httpServer);

// Inicializar jobs agendados de estoque
initStockJobs();

// Inicializar jobs agendados de wishlist
initWishlistJobs();

// Inicializar jobs agendados de rastreamento
initShippingJobs();

// Obter IP da rede local
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  if (!interfaces) return 'localhost';
  
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    
    for (const iface of ifaceList) {
      // Ignorar endereços internos (não IPv4) e não-internos (ou seja, endereços locais)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const HOST = process.env.HOST || '0.0.0.0'; // Aceitar conexões de qualquer IP
const localIP = getLocalIP();

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Acesse pelo seu computador: http://localhost:${PORT}`);
  console.log(`📱 Acesse pelo celular/outros dispositivos: http://${localIP}:${PORT}`);
  
  // Mostrar status dos serviços
  console.log('\n📊 Status dos Serviços:');
  
  // Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('✅ Cloudinary: Configurado');
  } else {
    console.log('⚠️  Cloudinary: Não configurado (usando base64)');
  }
  
  // SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('✅ SendGrid: Configurado');
  } else {
    console.log('⚠️  SendGrid: Não configurado (usando log)');
  }
  
  // Socket.io
  if (process.env.SOCKET_IO_ENABLED === 'true') {
    console.log('✅ Socket.io: Habilitado');
  } else {
    console.log('⚠️  Socket.io: Desabilitado (usando polling)');
  }
  
  // Jobs Agendados
  if (process.env.ENABLE_JOBS === 'true' || process.env.NODE_ENV === 'production') {
    console.log('✅ Jobs Agendados: Habilitados');
    console.log('   - Verificação de estoque baixo: Diário às 9:00 AM');
    console.log('   - Liberação de estoque reservado: A cada 15 minutos');
    console.log('   - Atualização de rastreamentos: A cada hora');
  } else {
    console.log('⚠️  Jobs Agendados: Desabilitados (defina ENABLE_JOBS=true para habilitar)');
  }
  
  // Mercado Pago
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.log('✅ Mercado Pago: Configurado');
  } else {
    console.log('⚠️  Mercado Pago: Não configurado (defina MERCADOPAGO_ACCESS_TOKEN no .env)');
  }
  
  console.log('');
});

