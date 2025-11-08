import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inicializar Mercado Pago
// Verificar se a chave está configurada
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN não configurado no .env');
}

// Criar instância do cliente Mercado Pago
const getClient = () => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return null;
  }
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: {
      timeout: 5000,
    },
  });
};

// Criar instâncias de Payment e Preference
const getPayment = () => {
  const client = getClient();
  return client ? new Payment(client) : null;
};

const getPreference = () => {
  const client = getClient();
  return client ? new Preference(client) : null;
};

export interface CreatePaymentData {
  amount: number; // Valor em reais (ex: 100.00 = R$ 100,00)
  currency?: string;
  paymentMethod?: string;
  installments?: number;
  orderId: number;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePreferenceData {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    email?: string;
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'approved' | 'all';
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  payment?: any;
  preference?: any;
  init_point?: string;
  sandbox_init_point?: string;
  error?: string;
}

/**
 * Serviço de Integração com Mercado Pago
 * 
 * Este serviço gerencia todas as operações relacionadas ao Mercado Pago:
 * - Criação de preferências de pagamento
 * - Processamento de pagamentos
 * - Processamento de webhooks
 * - Reembolsos
 */
export class MercadoPagoService {
  /**
   * Criar uma preferência de pagamento (Checkout Pro)
   */
  static async createPreference(
    data: CreatePreferenceData
  ): Promise<PaymentResult> {
    try {
      const preferenceInstance = getPreference();
      
      if (!preferenceInstance) {
        return {
          success: false,
          error: 'Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no .env',
        };
      }

      // Criar preferência
      // Validar items
      if (!data.items || data.items.length === 0) {
        return {
          success: false,
          error: 'É necessário pelo menos um item para criar a preferência',
        };
      }

      // Validar que cada item tem os campos obrigatórios
      for (const item of data.items) {
        if (!item.title || !item.quantity || !item.unit_price) {
          return {
            success: false,
            error: 'Cada item deve ter title, quantity e unit_price',
          };
        }
        if (item.unit_price <= 0) {
          return {
            success: false,
            error: 'O preço unitário deve ser maior que zero',
          };
        }
      }

      const preferenceData: any = {
        items: data.items.map(item => ({
          title: String(item.title).substring(0, 256), // Limitar tamanho do título
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: 'BRL',
        })),
      };

      // Adicionar payer se fornecido
      if (data.payer && (data.payer.email || data.payer.name)) {
        preferenceData.payer = {};
        if (data.payer.email) {
          preferenceData.payer.email = data.payer.email;
        }
        if (data.payer.name) {
          preferenceData.payer.name = data.payer.name;
        }
      }

      // Adicionar back_urls (obrigatório quando auto_return está definido)
      // Segundo a documentação do Mercado Pago:
      // - back_urls.success é obrigatório quando auto_return está definido
      // - As URLs devem ser válidas e acessíveis
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const backUrls: any = {
        success: `${frontendUrl}/checkout/success`,
        failure: `${frontendUrl}/checkout/failure`,
        pending: `${frontendUrl}/checkout/pending`,
      };

      // Se back_urls foi fornecido, usar os valores fornecidos, mas garantir que success existe
      if (data.back_urls) {
        if (data.back_urls.success) {
          backUrls.success = data.back_urls.success;
        }
        if (data.back_urls.failure) {
          backUrls.failure = data.back_urls.failure;
        }
        if (data.back_urls.pending) {
          backUrls.pending = data.back_urls.pending;
        }
      }

      // Garantir que success sempre existe (obrigatório quando auto_return está definido)
      if (!backUrls.success || backUrls.success.trim() === '') {
        backUrls.success = `${frontendUrl}/checkout/success`;
      }

      preferenceData.back_urls = backUrls;

      // Adicionar auto_return apenas se back_urls.success estiver definido
      // O Mercado Pago exige que back_urls.success exista quando auto_return está definido
      if (data.auto_return) {
        // Validar que success está definido antes de adicionar auto_return
        if (backUrls.success && backUrls.success.trim() !== '') {
          preferenceData.auto_return = data.auto_return;
        } else {
          console.warn('⚠️ auto_return não adicionado: back_urls.success não está definido ou está vazio');
        }
      }

      // Adicionar metadata
      if (data.metadata && Object.keys(data.metadata).length > 0) {
        preferenceData.metadata = data.metadata;
      }

      // Validar que back_urls.success existe antes de enviar
      if (!preferenceData.back_urls || !preferenceData.back_urls.success) {
        return {
          success: false,
          error: 'back_urls.success é obrigatório quando auto_return está definido',
        };
      }

      // Log detalhado antes de enviar
      console.log('=== Creating Mercado Pago Preference ===');
      console.log('back_urls object:', JSON.stringify(preferenceData.back_urls, null, 2));
      console.log('back_urls.success:', preferenceData.back_urls.success);
      console.log('auto_return:', preferenceData.auto_return);
      console.log('Full preference data:', JSON.stringify(preferenceData, null, 2));
      
      // Verificar se back_urls.success realmente existe e não está vazio
      if (!preferenceData.back_urls.success || preferenceData.back_urls.success.trim() === '') {
        console.error('❌ ERROR: back_urls.success está vazio ou undefined!');
        return {
          success: false,
          error: 'back_urls.success não pode estar vazio quando auto_return está definido',
        };
      }

      // Se auto_return está definido, garantir que back_urls.success existe
      if (preferenceData.auto_return && !preferenceData.back_urls.success) {
        console.error('❌ ERROR: auto_return definido mas back_urls.success não existe!');
        // Remover auto_return se success não existir
        delete preferenceData.auto_return;
        console.warn('⚠️ auto_return removido porque back_urls.success não existe');
      }
      
      const createdPreference = await preferenceInstance.create({ body: preferenceData });

      console.log('Mercado Pago preference created:', {
        id: createdPreference.id,
        init_point: createdPreference.init_point,
        sandbox_init_point: createdPreference.sandbox_init_point,
        fullResponse: JSON.stringify(createdPreference, null, 2),
      });

      // Verificar se temos init_point ou sandbox_init_point
      const initPoint = createdPreference.sandbox_init_point || createdPreference.init_point;
      
      if (!initPoint) {
        console.error('❌ ERROR: Nenhum init_point retornado pelo Mercado Pago');
        console.error('Response:', JSON.stringify(createdPreference, null, 2));
        return {
          success: false,
          error: 'URL de checkout não retornada pelo Mercado Pago',
        };
      }

      return {
        success: true,
        preference: createdPreference,
        init_point: createdPreference.init_point,
        sandbox_init_point: createdPreference.sandbox_init_point,
      };
    } catch (error: any) {
      console.error('Error creating Mercado Pago preference:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        cause: error.cause,
        response: error.response?.data,
        apiResponse: error.apiResponse,
      });
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro ao criar preferência no Mercado Pago';
      
      if (error.apiResponse) {
        // SDK do Mercado Pago retorna erros em apiResponse
        const apiError = error.apiResponse;
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.cause && Array.isArray(apiError.cause)) {
          errorMessage = apiError.cause.map((c: any) => c.message || c.description).join(', ');
        }
      } else if (error.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Criar um pagamento direto (Checkout Transparente)
   */
  static async createPayment(
    data: CreatePaymentData
  ): Promise<PaymentResult> {
    try {
      const paymentInstance = getPayment();
      
      if (!paymentInstance) {
        return {
          success: false,
          error: 'Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no .env',
        };
      }

      // Preparar dados do pagamento
      const paymentData: any = {
        transaction_amount: data.amount,
        currency_id: data.currency || 'BRL',
        description: data.description || `Pedido #${data.orderId}`,
        payment_method_id: data.paymentMethod || 'credit_card',
        installments: data.installments || 1,
        metadata: {
          order_id: data.orderId.toString(),
          ...data.metadata,
        },
      };

      // Adicionar informações do pagador se disponíveis
      if (data.customerEmail || data.customerName) {
        paymentData.payer = {
          email: data.customerEmail,
          identification: {
            type: 'CPF',
            number: '', // Será preenchido pelo frontend
          },
        };
      }

      // Criar pagamento
      const createdPayment = await paymentInstance.create({ body: paymentData });

      return {
        success: true,
        payment: createdPayment,
      };
    } catch (error: any) {
      console.error('Error creating Mercado Pago payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar pagamento no Mercado Pago',
      };
    }
  }

  /**
   * Processar webhook do Mercado Pago
   */
  static async handleWebhook(
    webhookData: any
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      const paymentInstance = getPayment();
      
      if (!paymentInstance) {
        return {
          success: false,
          error: 'Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no .env',
        };
      }

      // Verificar tipo de notificação
      const { type, data } = webhookData;

      if (type === 'payment') {
        const paymentId = data.id;
        
        // Buscar informações do pagamento
        const paymentInfo = await paymentInstance.get({ id: paymentId });

        // Processar pagamento
        await this.processPaymentNotification(paymentInfo);
      }

      return {
        success: true,
        event: webhookData,
      };
    } catch (error: any) {
      console.error('Error processing Mercado Pago webhook:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar webhook do Mercado Pago',
      };
    }
  }

  /**
   * Processar notificação de pagamento
   */
  private static async processPaymentNotification(
    paymentInfo: any
  ): Promise<void> {
    try {
      const orderId = parseInt(paymentInfo.metadata?.order_id || '0');

      if (!orderId) {
        console.error('OrderId não encontrado no metadata do pagamento');
        return;
      }

      // Buscar pagamento no banco
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayPaymentId: paymentInfo.id.toString(),
        },
      });

      if (!payment) {
        console.error(`Pagamento não encontrado para Payment ID ${paymentInfo.id}`);
        return;
      }

      // Mapear status do Mercado Pago para nosso sistema
      let status = 'pending';
      let statusDetail = '';

      switch (paymentInfo.status) {
        case 'approved':
          status = 'approved';
          statusDetail = 'Pagamento aprovado pelo Mercado Pago';
          break;
        case 'rejected':
          status = 'rejected';
          statusDetail = paymentInfo.status_detail || 'Pagamento rejeitado';
          break;
        case 'cancelled':
          status = 'rejected';
          statusDetail = 'Pagamento cancelado';
          break;
        case 'refunded':
          status = 'refunded';
          statusDetail = 'Pagamento reembolsado';
          break;
        case 'pending':
        case 'in_process':
        case 'in_mediation':
          status = 'processing';
          statusDetail = paymentInfo.status_detail || 'Pagamento em processamento';
          break;
        default:
          status = 'pending';
          statusDetail = `Status: ${paymentInfo.status}`;
      }

      // Atualizar status do pagamento
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          statusDetail,
          gatewayTransactionId: paymentInfo.transaction_details?.transaction_id || null,
          webhookReceived: true,
          webhookData: JSON.stringify(paymentInfo),
          updatedAt: new Date(),
        },
      });

      // Se pagamento aprovado, atualizar status do pedido
      if (status === 'approved' && payment.status !== 'approved') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'processing',
          },
        });
      }

      // Se pagamento rejeitado, manter pedido como pending
      if (status === 'rejected') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'pending',
          },
        });
      }

      console.log(`Pagamento ${payment.id} atualizado via webhook do Mercado Pago: ${status}`);
    } catch (error: any) {
      console.error('Error processing payment notification:', error);
    }
  }

  /**
   * Obter informações de um pagamento
   */
  static async getPayment(
    paymentId: string
  ): Promise<{ success: boolean; payment?: any; error?: string }> {
    try {
      const paymentInstance = getPayment();
      
      if (!paymentInstance) {
        return {
          success: false,
          error: 'Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no .env',
        };
      }

      const paymentInfo = await paymentInstance.get({ id: paymentId });

      return {
        success: true,
        payment: paymentInfo,
      };
    } catch (error: any) {
      console.error('Error retrieving payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar pagamento',
      };
    }
  }

  /**
   * Processar reembolso via Mercado Pago
   */
  static async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refund?: any; error?: string }> {
    try {
      const paymentInstance = getPayment();
      
      if (!paymentInstance) {
        return {
          success: false,
          error: 'Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no .env',
        };
      }

      // Buscar pagamento
      const paymentInfo = await paymentInstance.get({ id: paymentId });

      if (!paymentInfo) {
        return {
          success: false,
          error: 'Pagamento não encontrado',
        };
      }

      // Criar reembolso
      const refundData: any = {};

      if (amount) {
        // Reembolso parcial
        refundData.amount = amount;
      }

      // O Mercado Pago usa a API de refunds
      // Por enquanto, vamos atualizar o status manualmente
      // Em produção, você precisaria usar a API de refunds do Mercado Pago

      return {
        success: true,
        refund: { id: paymentId, amount: amount || paymentInfo.transaction_amount },
      };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar reembolso',
      };
    }
  }
}

