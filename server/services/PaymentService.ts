import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePaymentData {
  gateway?: string;
  gatewayPaymentId?: string;
  gatewayTransactionId?: string;
  paymentMethod: string;
  installments?: number;
  cardLastDigits?: string;
  cardBrand?: string;
  pixCode?: string;
  pixExpiresAt?: Date | string | null;
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoExpiresAt?: Date | string | null;
  statusDetail?: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: any;
  error?: string;
}

/**
 * Serviço de Pagamento
 * 
 * Este serviço gerencia todas as operações relacionadas a pagamentos.
 * Por enquanto, implementa apenas a estrutura básica.
 * A integração com gateway de pagamento será adicionada posteriormente.
 */
export class PaymentService {
  /**
   * Criar um novo pagamento para um pedido
   */
  static async createPayment(
    orderId: number,
    paymentData: CreatePaymentData
  ): Promise<PaymentResult> {
    try {
      // Verificar se o pedido existe
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return {
          success: false,
          error: 'Pedido não encontrado'
        };
      }

      // Verificar se já existe pagamento aprovado
      const existingPayment = await prisma.payment.findFirst({
        where: {
          orderId,
          status: 'approved'
        }
      });

      if (existingPayment) {
        return {
          success: false,
          error: 'Pedido já possui pagamento aprovado'
        };
      }

      // Criar pagamento
      const payment = await prisma.payment.create({
        data: {
          orderId,
          gateway: paymentData.gateway || 'mercadopago',
          gatewayPaymentId: paymentData.gatewayPaymentId || '',
          gatewayTransactionId: paymentData.gatewayTransactionId || null,
          paymentMethod: paymentData.paymentMethod,
          installments: paymentData.installments || 1,
          amount: order.total,
          status: 'pending',
          statusDetail: paymentData.statusDetail || null,
          cardLastDigits: paymentData.cardLastDigits || null,
          cardBrand: paymentData.cardBrand || null,
          pixCode: paymentData.pixCode || null,
          pixExpiresAt: paymentData.pixExpiresAt ? new Date(paymentData.pixExpiresAt) : null,
          boletoUrl: paymentData.boletoUrl || null,
          boletoBarcode: paymentData.boletoBarcode || null,
          boletoExpiresAt: paymentData.boletoExpiresAt ? new Date(paymentData.boletoExpiresAt) : null,
          webhookReceived: false,
          webhookData: null
        },
        include: {
          order: {
            include: {
              items: true,
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

      return {
        success: true,
        payment
      };
    } catch (error: any) {
      console.error('Error creating payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar pagamento'
      };
    }
  }

  /**
   * Processar um pagamento (chamar gateway)
   * Agora integrado com Stripe
   */
  static async processPayment(paymentId: number): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        return {
          success: false,
          error: 'Pagamento não encontrado'
        };
      }

      if (payment.status === 'approved') {
        return {
          success: false,
          error: 'Pagamento já foi aprovado'
        };
      }

      // Se for Mercado Pago, criar preferência ou pagamento
      if (payment.gateway === 'mercadopago') {
        const { MercadoPagoService } = await import('./MercadoPagoService');
        
        // Buscar dados do pedido
        const order = payment.order;
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { email: true, name: true }
        });

        // Buscar itens do pedido
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          include: { product: true }
        });

        // Validar se há itens no pedido
        if (!orderItems || orderItems.length === 0) {
          return {
            success: false,
            error: 'Pedido não possui itens para pagamento'
          };
        }

        // Criar preferência de pagamento (Checkout Pro)
        const preferenceResult = await MercadoPagoService.createPreference({
          items: orderItems.map(item => {
            const unitPrice = Number(item.price);
            if (isNaN(unitPrice) || unitPrice <= 0) {
              throw new Error(`Preço inválido para o item: ${item.product.name}`);
            }
            return {
              title: item.product.name || 'Produto',
              quantity: item.quantity || 1,
              unit_price: unitPrice,
            };
          }),
          payer: {
            name: user?.name || undefined,
            email: user?.email || undefined,
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
            failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/failure`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/pending`,
          },
          // auto_return temporariamente removido para testar
          // auto_return: 'approved', // Requer que back_urls.success esteja definido
          metadata: {
            paymentId: payment.id.toString(),
            orderId: order.id.toString(),
          },
        });

        if (!preferenceResult.success || !preferenceResult.preference) {
          return {
            success: false,
            error: preferenceResult.error || 'Erro ao criar preferência no Mercado Pago'
          };
        }

        // Atualizar pagamento com Preference ID
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            gatewayPaymentId: preferenceResult.preference.id,
            status: 'processing',
            statusDetail: 'Aguardando confirmação do pagamento',
            gatewayTransactionId: preferenceResult.preference.id,
          }
        });

        // Log detalhado da resposta
        console.log('=== Preference Result ===');
        console.log('success:', preferenceResult.success);
        console.log('hasPreference:', !!preferenceResult.preference);
        console.log('preferenceResult.init_point:', preferenceResult.init_point);
        console.log('preferenceResult.sandbox_init_point:', preferenceResult.sandbox_init_point);
        console.log('preferenceResult.preference?.init_point:', preferenceResult.preference?.init_point);
        console.log('preferenceResult.preference?.sandbox_init_point:', preferenceResult.preference?.sandbox_init_point);
        console.log('preferenceResult.preference:', JSON.stringify(preferenceResult.preference, null, 2));
        console.log('Full preferenceResult:', JSON.stringify(preferenceResult, null, 2));

        // Tentar acessar init_point de diferentes formas
        const initPoint = 
          preferenceResult.sandbox_init_point || 
          preferenceResult.init_point ||
          preferenceResult.preference?.sandbox_init_point ||
          preferenceResult.preference?.init_point;

        console.log('initPoint encontrado:', initPoint);

        if (!initPoint) {
          console.error('❌ Nenhum init_point encontrado na resposta do Mercado Pago');
          return {
            success: false,
            error: 'URL de checkout não retornada pelo Mercado Pago. Verifique os logs do servidor.',
          };
        }

        return {
          success: true,
          payment: {
            ...updatedPayment,
            init_point: preferenceResult.preference?.init_point || preferenceResult.init_point,
            sandbox_init_point: preferenceResult.preference?.sandbox_init_point || preferenceResult.sandbox_init_point,
          }
        };
      }

      // Para outros gateways, manter comportamento antigo
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'processing',
          statusDetail: 'Processando pagamento...'
        }
      });

      return {
        success: true,
        payment: updatedPayment
      };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento'
      };
    }
  }

  /**
   * Atualizar status do pagamento (via webhook)
   */
  static async updatePaymentStatus(
    paymentId: number,
    status: string,
    statusDetail?: string,
    webhookData?: any
  ): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        return {
          success: false,
          error: 'Pagamento não encontrado'
        };
      }

      // Atualizar status do pagamento
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          statusDetail: statusDetail || payment.statusDetail,
          webhookReceived: webhookData ? true : payment.webhookReceived,
          webhookData: webhookData ? JSON.stringify(webhookData) : payment.webhookData,
          updatedAt: new Date()
        },
        include: {
          order: true
        }
      });

      // Se pagamento aprovado, atualizar status do pedido
      if (status === 'approved' && payment.status !== 'approved') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'processing'
          }
        });
      }

      // Se pagamento rejeitado, manter pedido como pending
      if (status === 'rejected') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'pending'
          }
        });
      }

      return {
        success: true,
        payment: updatedPayment
      };
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar status do pagamento'
      };
    }
  }

  /**
   * Obter status do pagamento
   */
  static async getPaymentStatus(paymentId: number): Promise<any> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
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
        }
      });

      return payment;
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }

  /**
   * Reembolsar um pagamento
   * Agora integrado com Stripe
   */
  static async refundPayment(paymentId: number, amount?: number): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        return {
          success: false,
          error: 'Pagamento não encontrado'
        };
      }

      if (payment.status !== 'approved') {
        return {
          success: false,
          error: 'Apenas pagamentos aprovados podem ser reembolsados'
        };
      }

      // Se for Mercado Pago, processar reembolso via Mercado Pago
      if (payment.gateway === 'mercadopago' && payment.gatewayPaymentId) {
        const { MercadoPagoService } = await import('./MercadoPagoService');
        
        const refundResult = await MercadoPagoService.refundPayment(
          payment.gatewayPaymentId,
          amount
        );

        if (!refundResult.success) {
          return {
            success: false,
            error: refundResult.error || 'Erro ao processar reembolso no Mercado Pago'
          };
        }

        const refundAmount = amount || payment.amount.toNumber();

        // Atualizar pagamento
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'refunded',
            statusDetail: `Reembolso de R$ ${refundAmount.toFixed(2)} processado via Mercado Pago`,
            webhookData: refundResult.refund ? JSON.stringify(refundResult.refund) : null,
          }
        });

        // Atualizar status do pedido para cancelled
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'cancelled'
          }
        });

        return {
          success: true,
          payment: updatedPayment
        };
      }

      // Para outros gateways, manter comportamento antigo
      const refundAmount = amount || payment.amount.toNumber();

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
          statusDetail: `Reembolso de R$ ${refundAmount.toFixed(2)} processado`
        }
      });

      // Atualizar status do pedido para cancelled
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'cancelled'
        }
      });

      return {
        success: true,
        payment: updatedPayment
      };
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar reembolso'
      };
    }
  }

  /**
   * Processar webhook do gateway
   * Agora integrado com Stripe
   */
  static async handleWebhook(gateway: string, signature: string, body: string | Buffer): Promise<PaymentResult> {
    try {
      console.log(`Processando webhook de ${gateway}`);

      // Se for Mercado Pago, usar MercadoPagoService
      if (gateway === 'mercadopago') {
        const { MercadoPagoService } = await import('./MercadoPagoService');
        
        // Converter body para JSON se for string
        let webhookData: any;
        if (typeof body === 'string') {
          webhookData = JSON.parse(body);
        } else if (Buffer.isBuffer(body)) {
          webhookData = JSON.parse(body.toString());
        } else {
          webhookData = body;
        }
        
        const webhookResult = await MercadoPagoService.handleWebhook(webhookData);

        if (!webhookResult.success) {
          return {
            success: false,
            error: webhookResult.error || 'Erro ao processar webhook do Mercado Pago'
          };
        }

        return {
          success: true,
        };
      }

      // Para outros gateways, manter comportamento antigo
      console.log(`Webhook de ${gateway} recebido, mas processamento não implementado`);
      return {
        success: true,
        error: `Webhook de ${gateway} recebido, mas processamento não implementado`
      };
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar webhook'
      };
    }
  }
}

