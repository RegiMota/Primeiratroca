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
          gateway: paymentData.gateway || 'asaas',
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

      // Se for Asaas, criar pagamento
      if (payment.gateway === 'asaas') {
        const { AsaasService } = await import('./AsaasService');
        
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

        // Calcular valor total
        const totalAmount = orderItems.reduce((sum, item) => {
          return sum + (Number(item.price) * item.quantity);
        }, 0);

        // Buscar CPF do usuário
        const userWithCpf = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { cpf: true },
        });

        // Criar pagamento no Asaas
        const paymentResult = await AsaasService.createPayment({
          amount: totalAmount,
          orderId: order.id,
          paymentMethod: payment.paymentMethod as 'credit_card' | 'debit_card' | 'pix' | undefined,
          customerEmail: user?.email,
          customerName: user?.name,
          customerCpfCnpj: userWithCpf?.cpf || undefined,
          description: `Pedido #${order.id}`,
          metadata: {
            paymentId: payment.id.toString(),
            orderId: order.id.toString(),
          },
        });

        if (!paymentResult.success || !paymentResult.payment) {
          return {
            success: false,
            error: paymentResult.error || 'Erro ao criar pagamento no Asaas'
          };
        }

        // Atualizar pagamento com dados do Asaas
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            gatewayPaymentId: paymentResult.payment.id,
            status: paymentResult.payment.status,
            statusDetail: paymentResult.payment.statusDetail || 'Aguardando confirmação do pagamento',
            gatewayTransactionId: paymentResult.payment.gatewayTransactionId || paymentResult.payment.id,
          }
        });

        // Log detalhado da resposta
        console.log('=== Asaas Payment Result ===');
        console.log('success:', paymentResult.success);
        console.log('payment:', paymentResult.payment);

        // Retornar URL de checkout se disponível (para boleto)
        const checkoutUrl = paymentResult.init_point;

        return {
          success: true,
          payment: {
            ...updatedPayment,
            init_point: checkoutUrl || paymentResult.init_point,
            pixCode: paymentResult.pixCode,
            pixQrCodeBase64: paymentResult.pixQrCodeBase64,
            pixExpiresAt: paymentResult.pixExpiresAt,
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

      // Se pagamento aprovado, atualizar status do pedido e marcar notificações de pagamento como lidas
      if (status === 'approved' && payment.status !== 'approved') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'processing'
          }
        });
        
        // Marcar notificações de pagamento pendente como lidas
        try {
          // Buscar notificações de pagamento não lidas do usuário
          const notifications = await prisma.notification.findMany({
            where: {
              userId: payment.order.userId,
              type: 'payment',
              isRead: false,
            },
          });
          
          // Filtrar notificações que correspondem a este pagamento
          const matchingNotifications = notifications.filter((notif) => {
            if (!notif.data) return false;
            try {
              const data = JSON.parse(notif.data);
              return data.paymentId === payment.id;
            } catch {
              return false;
            }
          });
          
          // Marcar como lidas
          if (matchingNotifications.length > 0) {
            await prisma.notification.updateMany({
              where: {
                id: {
                  in: matchingNotifications.map((n) => n.id),
                },
              },
              data: {
                isRead: true,
              },
            });
          }
        } catch (notifError) {
          console.error('Error marking payment notifications as read:', notifError);
          // Não falhar se não conseguir marcar como lida
        }
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

      // Se for Asaas, processar reembolso via Asaas
      if (payment.gateway === 'asaas' && payment.gatewayPaymentId) {
        const { AsaasService } = await import('./AsaasService');
        
        const refundResult = await AsaasService.refundPayment(
          payment.gatewayPaymentId,
          amount
        );

        if (!refundResult.success) {
          return {
            success: false,
            error: refundResult.error || 'Erro ao processar reembolso no Asaas'
          };
        }

        const refundAmount = amount || payment.amount.toNumber();

        // Atualizar pagamento
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'refunded',
            statusDetail: `Reembolso de R$ ${refundAmount.toFixed(2)} processado via Asaas`,
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

      // Se for Asaas, usar AsaasService
      if (gateway === 'asaas') {
        const { AsaasService } = await import('./AsaasService');
        
        // Converter body para JSON se for string
        let webhookData: any;
        if (typeof body === 'string') {
          webhookData = JSON.parse(body);
        } else if (Buffer.isBuffer(body)) {
          webhookData = JSON.parse(body.toString());
        } else {
          webhookData = body;
        }
        
        const webhookResult = await AsaasService.handleWebhook(webhookData);

        if (!webhookResult.success) {
          return {
            success: false,
            error: webhookResult.error || 'Erro ao processar webhook do Asaas'
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

