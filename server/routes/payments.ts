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

    // Primeiro, tentar usar o QR code salvo no banco
    let qrCodeBase64 = (payment as any).pixQrCodeBase64 || null;
    console.log('🔍 QR Code no banco:', qrCodeBase64 ? `${qrCodeBase64.substring(0, 50)}... (${qrCodeBase64.length} chars)` : 'não encontrado');
    
    // Se não tiver no banco, buscar do Asaas
    if (!qrCodeBase64 && payment.paymentMethod === 'pix' && payment.gatewayPaymentId) {
      try {
        const { AsaasService } = await import('../services/AsaasService');
        console.log('🔍 QR Code não encontrado no banco. Buscando do Asaas:', payment.gatewayPaymentId);
        const qrCodeResult = await AsaasService.getPixQrCode(payment.gatewayPaymentId);
        if (qrCodeResult.success) {
          console.log('✅ QR Code PIX encontrado usando endpoint específico do Asaas!');
          qrCodeBase64 = qrCodeResult.qrCodeBase64 || null;
          
          // Salvar no banco para próximas consultas
          if (qrCodeResult.pixCode || qrCodeBase64) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                pixCode: qrCodeResult.pixCode || payment.pixCode,
                pixQrCodeBase64: qrCodeBase64, // Salvar QR code base64
                pixExpiresAt: qrCodeResult.pixExpiresAt || payment.pixExpiresAt,
              }
            });
            console.log('💾 QR Code salvo no banco de dados');
            payment.pixCode = qrCodeResult.pixCode || payment.pixCode;
            (payment as any).pixQrCodeBase64 = qrCodeBase64;
            payment.pixExpiresAt = qrCodeResult.pixExpiresAt || payment.pixExpiresAt;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar QR Code PIX do Asaas:', error);
      }
    } else if (qrCodeBase64) {
      console.log('✅ QR Code encontrado no banco de dados');
    }

    // Retornar pagamento com QR Code se disponível
    res.json({
      ...payment,
      qrCodeBase64: qrCodeBase64 || (payment as any).pixQrCodeBase64 || null, // Retornar QR code do banco ou do Asaas
      pixQrCodeBase64: qrCodeBase64 || (payment as any).pixQrCodeBase64 || null, // Também retornar como pixQrCodeBase64
    });
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

// POST /api/payments/process-pix/:id - Processar pagamento PIX diretamente (Checkout Transparente)
router.post('/process-pix/:id', authenticate, async (req: AuthRequest, res) => {
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
        order: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Verificar se o método de pagamento é PIX
    if (payment.paymentMethod !== 'pix') {
      return res.status(400).json({ error: 'Este pagamento não é PIX' });
    }

    const { AsaasService } = await import('../services/AsaasService');
    
    // Buscar CPF do usuário
    const user = await prisma.user.findUnique({
      where: { id: payment.order.userId },
      select: { cpf: true },
    });

    // Criar pagamento PIX direto
    const result = await AsaasService.createPayment({
      amount: Number(payment.amount),
      currency: 'BRL',
      paymentMethod: 'pix',
      orderId: payment.orderId,
      description: `Pedido #${payment.orderId}`,
      customerEmail: payment.order.user.email,
      customerName: payment.order.user.name,
      customerCpfCnpj: user?.cpf || undefined,
      metadata: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId.toString(),
      },
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Log para debug
    console.log('🔍 PIX Result:', {
      pixCode: result.pixCode,
      pixQrCodeBase64: result.pixQrCodeBase64 ? `${result.pixQrCodeBase64.substring(0, 50)}... (${result.pixQrCodeBase64.length} chars)` : null,
      pixExpiresAt: result.pixExpiresAt,
      gatewayPaymentId: result.payment?.id,
    });

    // Sempre buscar QR Code PIX usando o endpoint específico conforme documentação do Asaas
    let finalPixCode = result.pixCode;
    let finalQrCodeBase64 = result.pixQrCodeBase64;
    let finalPixExpiresAt = result.pixExpiresAt;

    if (result.payment?.id) {
      console.log('🔍 Buscando QR Code PIX do endpoint específico do Asaas...');
      try {
        // Aguardar 1 segundo antes de buscar (Asaas pode precisar de um tempo para gerar)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Usar o endpoint específico /payments/{id}/pixQrCode conforme documentação
        const qrCodeResult = await AsaasService.getPixQrCode(result.payment.id);
        if (qrCodeResult.success) {
          console.log('✅ QR Code PIX encontrado usando endpoint específico!');
          finalPixCode = qrCodeResult.pixCode || finalPixCode;
          finalQrCodeBase64 = qrCodeResult.qrCodeBase64 || finalQrCodeBase64;
          finalPixExpiresAt = qrCodeResult.pixExpiresAt || finalPixExpiresAt;
          
          // Os valores finais serão salvos no update abaixo
          console.log('✅ QR Code obtido do Asaas, será salvo no banco');
        } else {
          console.warn('⚠️ Não foi possível buscar QR Code PIX do Asaas:', qrCodeResult.error);
        }
      } catch (error) {
        console.error('Erro ao buscar QR Code PIX do Asaas:', error);
      }
    }

    // Validar e corrigir data de expiração do PIX (deve ser 5 minutos)
    const now = new Date();
    let validatedExpiresAt: Date | null = null;
    
    if (finalPixExpiresAt) {
      const expiresAtDate = new Date(finalPixExpiresAt);
      const diffMinutes = (expiresAtDate.getTime() - now.getTime()) / (1000 * 60);
      
      // Se a data de expiração estiver muito no futuro (mais de 10 minutos) ou no passado, usar 5 minutos
      if (diffMinutes > 10 || diffMinutes < 0) {
        console.warn(`⚠️ Data de expiração do Asaas parece incorreta (${diffMinutes.toFixed(2)} minutos), usando 5 minutos`);
        validatedExpiresAt = new Date();
        validatedExpiresAt.setMinutes(validatedExpiresAt.getMinutes() + 5);
      } else {
        validatedExpiresAt = expiresAtDate;
      }
    } else {
      // Se não houver data de expiração, usar 5 minutos a partir de agora
      console.log('⚠️ Data de expiração não encontrada, usando 5 minutos a partir de agora');
      validatedExpiresAt = new Date();
      validatedExpiresAt.setMinutes(validatedExpiresAt.getMinutes() + 5);
    }
    
    console.log('📅 Data de expiração validada:', {
      original: finalPixExpiresAt,
      validated: validatedExpiresAt.toISOString(),
      diffMinutes: (validatedExpiresAt.getTime() - now.getTime()) / (1000 * 60),
    });

    // Atualizar pagamento com informações do PIX (incluindo QR code)
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: result.payment?.id?.toString() || null,
        gatewayTransactionId: result.payment?.id?.toString() || null,
        status: result.payment?.status === 'pending' ? 'pending' : 'processing',
        statusDetail: result.payment?.status_detail || 'Aguardando pagamento PIX',
        pixCode: finalPixCode || null,
        pixQrCodeBase64: finalQrCodeBase64 || null, // Salvar QR code base64 no banco (pode vir do Asaas ou do resultado inicial)
        pixExpiresAt: validatedExpiresAt, // Usar data validada (sempre 5 minutos)
      }
    });
    
    console.log('💾 Pagamento atualizado no banco com QR Code:', {
      hasPixCode: !!finalPixCode,
      hasQrCodeBase64: !!finalQrCodeBase64,
      qrCodeLength: finalQrCodeBase64 ? finalQrCodeBase64.length : 0,
    });

    // Criar notificação para o usuário sobre o pagamento PIX pendente
    if (finalPixCode || finalQrCodeBase64) {
      try {
        const { NotificationService } = await import('../services/NotificationService');
        const order = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { user: true },
        });
        
        if (order && order.userId) {
          await NotificationService.createNotification(
            order.userId,
            'payment',
            'Pagamento PIX Pendente',
            `QR Code PIX gerado para o pedido #${order.id}. Complete o pagamento em até 5 minutos.`,
            {
              paymentId: payment.id,
              orderId: order.id,
              amount: payment.amount,
      }
          );
        }
      } catch (notifError) {
        console.error('Error creating payment notification:', notifError);
        // Não falhar o pagamento se a notificação falhar
      }
    }

    // Garantir que updatedPayment tenha o QR code
    const paymentResponse = {
      ...updatedPayment,
      pixQrCodeBase64: finalQrCodeBase64 || null,
    };

    res.json({
      payment: paymentResponse,
      pixCode: finalPixCode || null,
      pixExpiresAt: validatedExpiresAt || null,
      qrCodeBase64: finalQrCodeBase64 || null, // Manter compatibilidade com frontend
    });
  } catch (error: any) {
    console.error('Error processing PIX payment:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento PIX' });
  }
});

// POST /api/payments/tokenize-card - Tokenizar cartão
router.post('/tokenize-card', authenticate, async (req: AuthRequest, res) => {
  try {
    const { cardNumber, cardExpirationMonth, cardExpirationYear, securityCode, cardholderName, identificationType, identificationNumber } = req.body;

    console.log('Tokenize card request received:', {
      hasCardNumber: !!cardNumber,
      hasExpirationMonth: !!cardExpirationMonth,
      hasExpirationYear: !!cardExpirationYear,
      hasSecurityCode: !!securityCode,
      hasCardholderName: !!cardholderName,
      hasIdentificationNumber: !!identificationNumber,
    });

    if (!cardNumber || !cardExpirationMonth || !cardExpirationYear || !securityCode || !cardholderName || !identificationNumber) {
      console.error('Missing required fields:', {
        cardNumber: !cardNumber,
        cardExpirationMonth: !cardExpirationMonth,
        cardExpirationYear: !cardExpirationYear,
        securityCode: !securityCode,
        cardholderName: !cardholderName,
        identificationNumber: !identificationNumber,
      });
      return res.status(400).json({ error: 'Todos os campos do cartão são obrigatórios' });
    }

    // Para Asaas, não precisamos tokenizar o cartão separadamente
    // Retornamos os dados do cartão de forma segura para uso no frontend
    // O Asaas processa o cartão diretamente no backend
    
    // Validar e formatar dados do cartão
    const cardData = {
      number: cardNumber.replace(/\s/g, ''),
      expiryMonth: cardExpirationMonth,
      expiryYear: cardExpirationYear,
      ccv: securityCode,
      holderName: cardholderName,
      holderCpf: identificationNumber, // Adicionar CPF do portador
      cardHolderCpf: identificationNumber, // Também adicionar com nome alternativo
    };

    console.log('✅ Card data prepared for Asaas');
    res.json({
      id: JSON.stringify(cardData), // Retornar dados formatados (será usado no backend)
      cardData: cardData,
    });
  } catch (error: any) {
    console.error('❌ Error tokenizing card (route):', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ 
      error: error.message || 'Erro ao tokenizar cartão',
      details: error.message 
    });
  }
});

// POST /api/payments/process-card - Processar pagamento com cartão (Checkout Transparente)
router.post('/process-card', authenticate, async (req: AuthRequest, res) => {
  try {
    // Log completo do body antes de desestruturar
    console.log('📦 POST /process-card - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 POST /process-card - Raw req.body keys:', Object.keys(req.body || {}));
    console.log('📦 POST /process-card - req.body.installments (ANTES):', req.body?.installments);
    console.log('📦 POST /process-card - typeof req.body.installments (ANTES):', typeof req.body?.installments);
    
    // Extrair installments diretamente do req.body antes de desestruturar
    const rawInstallments = req.body?.installments;
    console.log('📦 POST /process-card - rawInstallments extraído:', rawInstallments);
    console.log('📦 POST /process-card - typeof rawInstallments:', typeof rawInstallments);
    
    const { paymentId, token, installments, paymentMethodId } = req.body;
    
    // Log imediatamente após desestruturar
    console.log('📦 POST /process-card - Após desestruturação:', {
      paymentId,
      hasToken: !!token,
      installments,
      installmentsType: typeof installments,
      installmentsValue: installments,
      installmentsEqualsRaw: installments === rawInstallments,
      paymentMethodId,
    });
    
    // Usar rawInstallments se installments estiver undefined/null
    const finalInstallmentsValue = installments !== undefined && installments !== null ? installments : rawInstallments;
    console.log('📦 POST /process-card - finalInstallmentsValue:', finalInstallmentsValue);
    
    console.log('POST /process-card - Received data:', {
      paymentId,
      hasToken: !!token,
      installments,
      installmentsType: typeof installments,
      installmentsValue: installments,
      installmentsIsUndefined: installments === undefined,
      installmentsIsNull: installments === null,
      paymentMethodId,
      bodyKeys: Object.keys(req.body),
      allBodyValues: Object.entries(req.body).map(([key, value]) => ({
        key,
        value,
        type: typeof value,
      })),
    });

    if (!paymentId || !token) {
      return res.status(400).json({ error: 'paymentId e token são obrigatórios' });
    }

    const { AsaasService } = await import('../services/AsaasService');
    
    // Buscar pagamento no banco
    const payment = await prisma.payment.findFirst({
      where: { id: parseInt(paymentId) },
      include: { 
        order: {
          include: {
            user: true,
            shippingAddressObj: true // Incluir endereço de entrega
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Verificar se o pagamento pertence ao usuário
    if (payment.order.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Determinar o método de pagamento correto
    // paymentMethodId pode ser 'credit_card' ou 'debit_card'
    // Se não fornecido, usar o método do pagamento no banco
    let paymentMethod = paymentMethodId || payment.paymentMethod || 'credit_card';
    
    // Garantir que paymentMethod está no formato correto
    if (paymentMethod !== 'credit_card' && paymentMethod !== 'debit_card') {
      paymentMethod = 'credit_card'; // Fallback
    }
    
    // Parsear dados do cartão do token (que agora contém os dados do cartão)
    let cardData;
    try {
      cardData = JSON.parse(token);
    } catch {
      return res.status(400).json({ error: 'Token de cartão inválido' });
    }
    
    console.log('Processing card payment with Asaas:', {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      paymentMethod: paymentMethod,
      installments: installments || payment.installments || 1,
    });
    
    // Preparar informações de endereço e telefone se disponíveis
    let addressData = undefined;
    let phoneData = undefined;
    
    if (payment.order.shippingAddressObj) {
      const addr = payment.order.shippingAddressObj;
      addressData = {
        street: addr.street,
        number: addr.number,
        complement: addr.complement || undefined,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country || 'BR',
      };
      
      // Usar telefone do endereço de entrega se disponível
      if (addr.phone) {
        phoneData = addr.phone;
      }
      
      console.log('📦 Endereço de entrega encontrado:', {
        street: addr.street,
        number: addr.number,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        phone: addr.phone,
      });
    } else {
      console.warn('⚠️  Nenhum endereço de entrega encontrado no pedido. Isso pode aumentar o risco de rejeição.');
    }
    
    // Buscar CPF do usuário ou usar CPF do portador do cartão
    const user = await prisma.user.findUnique({
      where: { id: payment.order.userId },
      select: { cpf: true },
    });
    
    // Usar CPF do usuário ou CPF do portador do cartão
    const customerCpf = user?.cpf || cardData.holderCpf || cardData.cardHolderCpf;

    // Validar installments antes de processar
    // Converter para número se necessário
    let finalInstallments: number | null = null;
    
    console.log('🔍 Iniciando validação de installments:', {
      installments,
      installmentsType: typeof installments,
      installmentsIsUndefined: installments === undefined,
      installmentsIsNull: installments === null,
      installmentsIsEmptyString: installments === '',
      installmentsValue: installments,
    });
    
    // Função auxiliar para converter installments para número
    const parseInstallments = (value: any): number | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      
      let parsed: number;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        parsed = parseInt(trimmed, 10);
      } else if (typeof value === 'number') {
        parsed = Math.floor(value);
      } else {
        parsed = Number(value);
      }
      
      if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
        return null;
      }
      
      return parsed;
    };
    
    // Primeiro, tentar usar installments da requisição (usar finalInstallmentsValue que pode vir de rawInstallments)
    // Tentar múltiplas fontes para garantir que capturamos o valor
    const installmentsToProcess = 
      (finalInstallmentsValue !== undefined && finalInstallmentsValue !== null) ? finalInstallmentsValue :
      (installments !== undefined && installments !== null) ? installments :
      (rawInstallments !== undefined && rawInstallments !== null) ? rawInstallments :
      null;
    
    console.log('📦 POST /process-card - installmentsToProcess (múltiplas fontes):', {
      finalInstallmentsValue,
      installments,
      rawInstallments,
      installmentsToProcess,
    });
    
    if (installmentsToProcess !== undefined && installmentsToProcess !== null && installmentsToProcess !== '') {
      const parsed = parseInstallments(installmentsToProcess);
      if (parsed !== null) {
        finalInstallments = parsed;
        console.log('✅ Installments da requisição processado:', finalInstallments);
      } else {
        console.warn('⚠️ Installments da requisição inválido após parse:', {
          installmentsToProcess,
          parsed,
        });
      }
    } else {
      console.warn('⚠️ Installments não encontrado em nenhuma fonte:', {
        finalInstallmentsValue,
        installments,
        rawInstallments,
      });
    }
    
    // Se não veio na requisição, tentar usar do pagamento
    if (finalInstallments === null && payment.installments !== undefined && payment.installments !== null && payment.installments !== '') {
      const parsed = parseInstallments(payment.installments);
      if (parsed !== null) {
        finalInstallments = parsed;
        console.log('✅ Installments do pagamento:', finalInstallments);
      }
    }
    
    // Se ainda não foi definido, verificar método de pagamento
    if (finalInstallments === null) {
      if (paymentMethod === 'credit_card') {
        console.error('❌ Installments não informado para cartão de crédito');
        return res.status(400).json({ 
          error: 'O valor da parcela deve ser informado.',
          details: 'Para pagamento com cartão de crédito, é necessário informar o número de parcelas.',
        });
      } else {
        finalInstallments = 1; // Débito sempre 1 parcela
        console.log('✅ Installments não informado, usando padrão 1 para débito');
      }
    }
    
    console.log('🔍 Processing card payment - installments analysis:', {
      installmentsFromRequest: installments,
      installmentsFromRequestType: typeof installments,
      installmentsFromRequestIsUndefined: installments === undefined,
      installmentsFromRequestIsNull: installments === null,
      installmentsFromPayment: payment.installments,
      finalInstallments: finalInstallments,
      finalInstallmentsType: typeof finalInstallments,
      finalInstallmentsIsNull: finalInstallments === null,
      finalInstallmentsIsNaN: finalInstallments !== null ? isNaN(finalInstallments) : 'N/A',
      finalInstallmentsIsValid: finalInstallments !== null ? (!isNaN(finalInstallments) && finalInstallments > 0) : false,
      paymentMethod: paymentMethod,
    });
    
    // Validar installments para cartão de crédito
    // A validação deve verificar se é um número válido e maior que 0
    if (paymentMethod === 'credit_card') {
      // Garantir que finalInstallments seja um número inteiro válido
      if (finalInstallments === null || finalInstallments === undefined) {
        console.error('❌ Installments é null/undefined para cartão de crédito');
        return res.status(400).json({ 
          error: 'O valor da parcela deve ser informado.',
          details: 'Para pagamento com cartão de crédito, é necessário informar o número de parcelas.',
        });
      }
      
      const installmentsInt = Math.floor(finalInstallments);
      
      console.log('🔍 Validação de installments para crédito:', {
        finalInstallments,
        installmentsInt,
        isNaN: isNaN(installmentsInt),
        isLessThan1: installmentsInt < 1,
        isGreaterThan12: installmentsInt > 12,
        willFail: isNaN(installmentsInt) || installmentsInt < 1 || installmentsInt > 12,
      });
      
      // Verificar se finalInstallments é um número válido (entre 1 e 12)
      if (isNaN(installmentsInt) || installmentsInt < 1 || installmentsInt > 12) {
        console.error('❌ Invalid installments for credit_card:', {
          finalInstallments,
          installmentsInt,
          installmentsFromRequest: installments,
          installmentsFromRequestType: typeof installments,
          installmentsFromPayment: payment.installments,
          paymentMethod,
          bodyKeys: Object.keys(req.body),
          fullBody: JSON.stringify(req.body),
        });
        return res.status(400).json({ 
          error: 'O valor da parcela deve ser informado.',
          details: `Installments inválido: ${finalInstallments} (convertido: ${installmentsInt}). O número de parcelas deve estar entre 1 e 12. Valor recebido: ${installments} (tipo: ${typeof installments}).`,
        });
      }
      
      // Usar o valor inteiro
      finalInstallments = installmentsInt;
      
      console.log('✅ Installments validado para cartão de crédito:', {
        finalInstallments,
        installmentsFromRequest: installments,
        paymentMethod,
      });
    } else {
      // Para débito, sempre usar 1 parcela
      finalInstallments = 1;
      console.log('✅ Installments definido como 1 para débito');
    }
    
    // Garantir que finalInstallments seja um número válido antes de usar
    if (finalInstallments === null || finalInstallments === undefined) {
      console.error('❌ finalInstallments é null/undefined antes de criar pagamento');
      console.error('❌ Debug completo:', {
        installmentsFromRequest: installments,
        installmentsType: typeof installments,
        finalInstallmentsValue,
        installmentsToProcess,
        paymentMethod,
      });
      return res.status(400).json({ 
        error: 'O valor da parcela deve ser informado.',
        details: 'Para pagamento com cartão de crédito, é necessário informar o número de parcelas.',
      });
    }
    
    if (isNaN(finalInstallments) || finalInstallments < 1 || finalInstallments > 12) {
      console.error('❌ finalInstallments inválido antes de criar pagamento:', finalInstallments);
      return res.status(400).json({ 
        error: 'O valor da parcela deve ser informado.',
        details: `Installments inválido: ${finalInstallments}. Deve ser um número entre 1 e 12.`,
      });
    }
    
    console.log('✅ finalInstallments validado antes de enviar para Asaas:', finalInstallments);
    
    // Criar pagamento direto com dados do cartão no Asaas
    const result = await AsaasService.createPayment({
      amount: Number(payment.amount),
      paymentMethod: paymentMethod as 'credit_card' | 'debit_card',
      installments: finalInstallments as number,
      orderId: payment.orderId,
      customerEmail: payment.order.user.email,
      customerName: payment.order.user.name,
      customerCpfCnpj: customerCpf,
      description: `Pedido #${payment.orderId}`,
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      },
      address: addressData,
      customerPhone: phoneData,
      metadata: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId.toString(),
      },
    });

    if (!result.success) {
      console.error('❌ Payment creation failed:', result.error);
      console.error('❌ Full result:', JSON.stringify(result, null, 2));
      return res.status(400).json({ 
        error: result.error || 'Erro ao processar pagamento com cartão',
        details: result.error 
      });
    }

    // Atualizar pagamento no banco
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: result.payment?.id?.toString(),
        gatewayTransactionId: result.payment?.transaction_details?.transaction_id?.toString(),
        status: result.payment?.status || 'pending',
        statusDetail: result.payment?.status_detail || null,
      },
    });

    // Atualizar status do pedido se pagamento foi aprovado
    if (result.payment?.status === 'approved') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' },
      });
    }

    res.json({
      payment: result.payment,
      updatedPayment,
    });
  } catch (error: any) {
    console.error('Error processing card payment:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar pagamento com cartão' });
  }
});

// POST /api/payments/confirm - Confirmar pagamento no Asaas (Checkout Transparente) - DEPRECATED
router.post('/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { paymentId, token, installments, paymentMethodId } = req.body;

    if (!paymentId || !token) {
      return res.status(400).json({ error: 'paymentId e token são obrigatórios' });
    }

    const { AsaasService } = await import('../services/AsaasService');
    
    // Buscar pagamento no banco
    const payment = await prisma.payment.findFirst({
      where: { id: parseInt(paymentId) },
      include: { order: { include: { user: true } } }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Parsear dados do cartão do token
    let cardData;
    try {
      cardData = JSON.parse(token);
    } catch {
      return res.status(400).json({ error: 'Token de cartão inválido' });
    }

    // Buscar CPF do usuário ou usar CPF do portador do cartão
    const user = await prisma.user.findUnique({
      where: { id: payment.order.userId },
      select: { cpf: true },
    });
    
    // Usar CPF do usuário ou CPF do portador do cartão
    const customerCpf = user?.cpf || cardData.cardHolderCpf || cardData.holderCpf;

    // Criar pagamento direto
    const result = await AsaasService.createPayment({
      amount: Number(payment.amount),
      paymentMethod: paymentMethodId || 'credit_card',
      installments: installments || payment.installments,
      orderId: payment.orderId,
      customerEmail: payment.order.user.email,
      customerName: payment.order.user.name,
      customerCpfCnpj: customerCpf,
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
// IMPORTANTE: Esta rota NÃO deve ter autenticação, pois o Asaas chama diretamente
router.post('/webhook/:gateway', express.json(), async (req, res) => {
  try {
    const { gateway } = req.params;
    
    // Log detalhado para debug
    console.log(`🔔 Webhook recebido do gateway: ${gateway}`);
    console.log('📦 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('📦 IP de origem:', req.ip || req.connection.remoteAddress);

    // Validação básica de segurança para Asaas
    if (gateway === 'asaas') {
      // Verificar token de autenticação se configurado
      const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
      if (webhookToken) {
        const authToken = req.headers['asaas-access-token'] || req.headers['x-asaas-token'] || req.body?.token;
        if (authToken !== webhookToken) {
          console.warn('⚠️ Token de autenticação inválido ou ausente');
          return res.status(401).json({ error: 'Token de autenticação inválido' });
        }
        console.log('✅ Token de autenticação validado');
      }

      // Validar que o body tem estrutura esperada
      if (!req.body || (typeof req.body !== 'object')) {
        console.error('❌ Body inválido ou vazio');
        return res.status(400).json({ error: 'Body inválido' });
      }
    }

    // Processar webhook via PaymentService
    const { PaymentService } = await import('../services/PaymentService');
    
    // Para Asaas, o body já vem como JSON
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = await PaymentService.handleWebhook(gateway, '', bodyString);

    if (!result.success) {
      console.error('❌ Erro ao processar webhook:', result.error);
      // Retornar 200 para evitar retentativas desnecessárias do Asaas em alguns casos
      // Mas logar o erro para investigação
      return res.status(200).json({ 
        received: true, 
        success: false, 
        error: result.error,
        message: 'Webhook recebido mas houve erro no processamento. Verifique os logs.'
      });
    }

    console.log('✅ Webhook processado com sucesso');
    res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    console.error('Stack:', error.stack);
    // Retornar 200 para evitar retentativas excessivas do Asaas
    res.status(200).json({ 
      received: true, 
      success: false, 
      error: 'Erro ao processar webhook', 
      message: error.message 
    });
  }
});

// GET /api/payments/webhook/health - Health check para webhook
router.get('/webhook/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gateway: 'asaas',
    webhookUrl: '/api/payments/webhook/asaas'
  });
});

export default router;

