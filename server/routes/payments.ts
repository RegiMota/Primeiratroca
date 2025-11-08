import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/PaymentService';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/payments - Listar pagamentos do usuário autenticado
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    const payments = await prisma.payment.findMany({
      where: {
        order: {
          userId
        }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

// GET /api/payments/:id - Obter detalhes de um pagamento
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const payment = await prisma.payment.findFirst({
      where: {
        id: parseInt(id),
        order: {
          userId
        }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(payment);
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamento' });
  }
});

// POST /api/payments - Criar novo pagamento
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { orderId, paymentData } = req.body;

    // Validar dados
    if (!orderId || !paymentData) {
      return res.status(400).json({ error: 'Dados de pagamento incompletos' });
    }

    // Verificar se o pedido pertence ao usuário
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Usar PaymentService para criar pagamento
    const result = await PaymentService.createPayment(orderId, paymentData);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.payment);
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
});

// PATCH /api/payments/:id/status - Atualizar status do pagamento (webhook ou admin)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, statusDetail, webhookData } = req.body;
    const userId = req.userId!;

    // Verificar se o pagamento existe e pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        id: parseInt(id),
        order: {
          userId
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Usar PaymentService para atualizar status
    const result = await PaymentService.updatePaymentStatus(
      parseInt(id),
      status || payment.status,
      statusDetail,
      webhookData
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.payment);
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pagamento' });
  }
});

// POST /api/payments/process/:id - Processar pagamento (criar PaymentIntent no Stripe)
router.post('/process/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verificar se o pagamento existe e pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        id: parseInt(id),
        order: {
          userId
        }
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Processar pagamento via PaymentService
    const { PaymentService } = await import('../services/PaymentService');
    const result = await PaymentService.processPayment(parseInt(id));

    if (!result.success) {
      console.error('Payment processing failed:', result.error);
      return res.status(400).json({ 
        error: result.error,
        details: result.error 
      });
    }

    res.json(result.payment);
  } catch (error: any) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao processar pagamento',
      details: error.message 
    });
  }
});

// POST /api/payments/confirm - Confirmar pagamento no Mercado Pago (Checkout Transparente)
router.post('/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { paymentId, token, installments, paymentMethodId } = req.body;

    if (!paymentId || !token) {
      return res.status(400).json({ error: 'paymentId e token são obrigatórios' });
    }

    const { MercadoPagoService } = await import('../services/MercadoPagoService');
    
    // Buscar pagamento no banco
    const payment = await prisma.payment.findFirst({
      where: { id: parseInt(paymentId) },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Criar pagamento direto
    const result = await MercadoPagoService.createPayment({
      amount: Number(payment.amount),
      currency: 'BRL',
      paymentMethod: paymentMethodId || 'credit_card',
      installments: installments || payment.installments,
      orderId: payment.orderId,
      description: `Pedido #${payment.orderId}`,
      metadata: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId.toString(),
      },
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
});

// POST /api/payments/webhook/:gateway - Webhook para receber notificações do gateway
router.post('/webhook/:gateway', express.json(), async (req, res) => {
  try {
    const { gateway } = req.params;

    // Processar webhook via PaymentService
    const { PaymentService } = await import('../services/PaymentService');
    
    // Para Mercado Pago, o body já vem como JSON
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = await PaymentService.handleWebhook(gateway, '', bodyString);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;

