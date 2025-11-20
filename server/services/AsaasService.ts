import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Configuração do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || 'sandbox'; // 'sandbox' ou 'production'
const ASAAS_BASE_URL = ASAAS_ENVIRONMENT === 'production' 
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

// Verificar se a chave está configurada
if (!ASAAS_API_KEY) {
  console.warn('⚠️  ASAAS_API_KEY não configurado no .env');
}

// Criar cliente HTTP para Asaas
const createAsaasClient = () => {
  if (!ASAAS_API_KEY) {
    return null;
  }
  
  return axios.create({
    baseURL: ASAAS_BASE_URL,
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
};

export interface CreatePaymentData {
  amount: number; // Valor em reais (ex: 100.00 = R$ 100,00)
  currency?: string;
  paymentMethod?: string;
  installments?: number;
  orderId: number;
  customerEmail?: string;
  customerName?: string;
  customerCpfCnpj?: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, string>;
  // Para cartão de crédito
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  // Para PIX
  pix?: {
    expirationDate?: Date;
  };
  // Endereço do cliente
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
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
    cpfCnpj?: string;
    phone?: string;
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  metadata?: Record<string, string>;
  paymentMethod?: 'credit_card' | 'debit_card' | 'pix';
}

export interface PaymentResult {
  success: boolean;
  payment?: any;
  preference?: any;
  init_point?: string;
  pixCode?: string | null;
  pixQrCodeBase64?: string | null;
  pixExpiresAt?: Date | null;
  error?: string;
}

/**
 * Serviço de Integração com Asaas
 * 
 * Este serviço gerencia todas as operações relacionadas ao Asaas:
 * - Criação de pagamentos
 * - Processamento de pagamentos (PIX, Cartão de Crédito, Boleto)
 * - Processamento de webhooks
 * - Reembolsos
 */
export class AsaasService {
  /**
   * Criar um pagamento (Checkout Transparente)
   * Suporta PIX, cartão de crédito e boleto
   */
  static async createPayment(
    data: CreatePaymentData
  ): Promise<PaymentResult> {
    console.log('AsaasService.createPayment - Received data:', {
      paymentMethod: data.paymentMethod,
      installments: data.installments,
      installmentsType: typeof data.installments,
      hasCreditCard: !!data.creditCard,
      amount: data.amount,
    });
    
    try {
      const client = createAsaasClient();
      
      if (!client) {
        return {
          success: false,
          error: 'Asaas não configurado. Configure ASAAS_API_KEY no .env',
        };
      }

      // Preparar dados do pagamento
      // NOTA: Para cartão de crédito/débito, o Asaas pode não aceitar CREDIT_CARD/DEBIT_CARD diretamente
      // Pode ser necessário usar um endpoint diferente ou formato diferente
      const paymentData: any = {
        value: data.amount,
        description: data.description || `Pedido #${data.orderId}`,
        externalReference: data.orderId.toString(),
        // billingType será definido depois baseado no método de pagamento
      };

      // Adicionar data de vencimento (obrigatório para TODOS os tipos de pagamento no Asaas)
      // Para PIX: 5 minutos a partir de agora
      // Para Boleto: 3 dias a partir de agora
      // Para Cartão: hoje (data atual)
      const dueDate = new Date();
      if (data.paymentMethod === 'pix') {
        dueDate.setMinutes(dueDate.getMinutes() + 5); // 5 minutos para PIX
      } else if (data.paymentMethod === 'boleto' || !data.paymentMethod) {
        dueDate.setDate(dueDate.getDate() + 3); // 3 dias para boleto
      }
      // Para cartão de crédito/débito, usar data atual
      paymentData.dueDate = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

      // Adicionar cliente - OBRIGATÓRIO para criar pagamento no Asaas
      // O Asaas requer CPF/CNPJ do cliente para criar pagamentos
      if (!data.customerCpfCnpj) {
        return {
          success: false,
          error: 'CPF ou CNPJ do cliente é obrigatório para criar pagamento no Asaas',
        };
      }

      // Criar ou buscar cliente no Asaas (obrigatório ter CPF/CNPJ)
      const customer = await this.createOrGetCustomer({
        name: data.customerName || 'Cliente',
        email: data.customerEmail || '',
        cpfCnpj: data.customerCpfCnpj,
        phone: data.customerPhone,
        address: data.address,
      });

      if (customer && customer.id) {
        paymentData.customer = customer.id;
      } else {
        // Se não conseguiu criar/buscar cliente, tentar criar novamente
        try {
          const newCustomer = await client.post('/customers', {
            name: data.customerName || 'Cliente',
            email: data.customerEmail || '',
            cpfCnpj: data.customerCpfCnpj.replace(/\D/g, ''),
            phone: data.customerPhone?.replace(/\D/g, ''),
            postalCode: data.address?.zipCode?.replace(/\D/g, ''),
            address: data.address?.street,
            addressNumber: data.address?.number,
            complement: data.address?.complement,
            province: data.address?.neighborhood,
            city: data.address?.city,
            state: data.address?.state,
          });
          
          if (newCustomer.data && newCustomer.data.id) {
            paymentData.customer = newCustomer.data.id;
          } else {
            return {
              success: false,
              error: 'Não foi possível criar cliente no Asaas. Verifique se o CPF/CNPJ está correto.',
            };
          }
        } catch (customerError: any) {
          console.error('Error creating customer:', customerError);
          let errorMessage = 'Erro ao criar cliente no Asaas';
          
          if (customerError.response?.data) {
            const errorData = customerError.response.data;
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.map((e: any) => e.description || e.message).join(', ');
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          }
          
          return {
            success: false,
            error: errorMessage,
          };
        }
      }

      // Configurar método de pagamento específico
      if (data.paymentMethod === 'pix') {
        paymentData.billingType = 'PIX';
      } else if (data.paymentMethod === 'credit_card' || data.paymentMethod === 'debit_card') {
        // Para cartão de crédito/débito, o Asaas não aceita CREDIT_CARD/DEBIT_CARD diretamente no endpoint /payments
        // Precisamos criar a cobrança primeiro e depois processar o pagamento com cartão
        // Por enquanto, vamos criar como BOLETO e depois processar o cartão
        // OU usar o endpoint específico para pagamentos com cartão
        // Vamos tentar usar o endpoint específico para pagamentos com cartão
        // Se tiver dados do cartão, vamos processar diretamente
        if (data.creditCard) {
          // Para pagamentos com cartão, o Asaas exige um formato diferente
          // Vamos criar a cobrança primeiro e depois processar o pagamento
          paymentData.billingType = 'CREDIT_CARD'; // Tentar CREDIT_CARD primeiro
          
          if (data.paymentMethod === 'credit_card') {
            // Validar que installments foi fornecido
            console.log('Validating installments for credit_card:', {
              installments: data.installments,
              installmentsType: typeof data.installments,
              installmentsValue: data.installments,
              hasInstallments: data.installments !== undefined && data.installments !== null,
            });
            
            // Converter para número se necessário
            let installmentsValue: number;
            if (data.installments === undefined || data.installments === null) {
              console.error('Installments is undefined or null');
              return {
                success: false,
                error: 'O valor da parcela deve ser informado.',
              };
            }
            
            if (typeof data.installments === 'string') {
              installmentsValue = parseInt(data.installments, 10);
            } else {
              installmentsValue = Number(data.installments);
            }
            
            console.log('Converted installments value:', {
              original: data.installments,
              converted: installmentsValue,
              isValid: !isNaN(installmentsValue) && installmentsValue >= 1,
            });
            
            if (isNaN(installmentsValue) || installmentsValue < 1) {
              console.error('Invalid installments value:', installmentsValue);
              return {
                success: false,
                error: 'O valor da parcela deve ser informado.',
              };
            }
            
            // Segundo a documentação do Asaas, para parcelas é necessário:
            // - installmentCount: Número total de parcelas
            // - installmentValue: Valor de cada parcela
            // Para 1x (sem parcelas), não enviar esses campos
            if (installmentsValue > 1) {
              paymentData.installmentCount = installmentsValue;
              // Calcular valor de cada parcela (valor total / número de parcelas)
              paymentData.installmentValue = Number((data.amount / installmentsValue).toFixed(2));
              console.log('InstallmentCount e InstallmentValue set:', {
                installmentCount: paymentData.installmentCount,
                installmentValue: paymentData.installmentValue,
                totalAmount: data.amount,
              });
            } else {
              // Para 1x, não enviar campos de parcelamento conforme documentação
              console.log('Pagamento à vista (1x) - não enviando campos de parcelamento');
            }
          }
          
          // Adicionar dados do cartão
          paymentData.creditCard = {
            holderName: data.creditCard.holderName,
            number: data.creditCard.number.replace(/\s/g, ''),
            expiryMonth: data.creditCard.expiryMonth,
            expiryYear: data.creditCard.expiryYear,
            ccv: data.creditCard.ccv,
          };
          
          // Adicionar CPF do portador do cartão se disponível
          if (data.customerCpfCnpj) {
            paymentData.creditCard.holderCpfCnpj = data.customerCpfCnpj.replace(/\D/g, '');
          }
        } else {
          // Se não tiver dados do cartão, criar como BOLETO
          paymentData.billingType = 'BOLETO';
        }
      } else {
        // Para boleto ou outros métodos
        paymentData.billingType = 'BOLETO';
      }

      // Adicionar metadata
      if (data.metadata) {
        paymentData.externalReference = `${data.orderId}_${JSON.stringify(data.metadata)}`;
      }

      console.log('=== Creating Asaas Payment ===');
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));

      // Para pagamentos com cartão, o Asaas pode exigir um endpoint diferente
      // Vamos tentar criar no endpoint padrão primeiro
      let response;
      try {
        response = await client.post('/payments', paymentData);
      } catch (error: any) {
        // Se falhar com "forma de pagamento não é permitida para cobranças"
        // Isso significa que o Asaas não aceita CREDIT_CARD/DEBIT_CARD diretamente
        // Vamos tentar criar como BOLETO primeiro e depois processar o cartão
        if (error.response?.data?.errors && 
            error.response.data.errors.some((e: any) => 
              e.description?.includes('não é permitida para cobranças') ||
              e.description?.includes('forma de pagamento')
            )) {
          console.log('⚠️  Asaas não aceita CREDIT_CARD/DEBIT_CARD diretamente. Tentando criar como BOLETO e processar cartão depois...');
          
          // Criar cobrança como BOLETO primeiro
          const chargeData = { ...paymentData };
          chargeData.billingType = 'BOLETO';
          const creditCardData = chargeData.creditCard;
          delete chargeData.creditCard;
          delete chargeData.installmentCount;
          
          const chargeResponse = await client.post('/payments', chargeData);
          
          // Depois processar o pagamento com cartão usando o endpoint específico
          if (creditCardData && chargeResponse.data?.id) {
            const paymentId = chargeResponse.data.id;
            
            // Processar pagamento com cartão
            const cardPaymentData: any = {
              value: data.amount,
              billingType: data.paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 'DEBIT_CARD',
              creditCard: {
                holderName: creditCardData.holderName,
                number: creditCardData.number.replace(/\s/g, ''),
                expiryMonth: creditCardData.expiryMonth,
                expiryYear: creditCardData.expiryYear,
                ccv: creditCardData.ccv,
              },
            };
            
            if (data.paymentMethod === 'credit_card') {
              // Validar que installments foi fornecido
              let installmentsValue: number;
              if (data.installments === undefined || data.installments === null) {
                console.warn('⚠️  Installments não fornecido. Usando 1 como padrão.');
                cardPaymentData.installmentCount = 1;
              } else {
                if (typeof data.installments === 'string') {
                  installmentsValue = parseInt(data.installments, 10);
                } else {
                  installmentsValue = Number(data.installments);
                }
                
                if (isNaN(installmentsValue) || installmentsValue < 1) {
                  console.warn('⚠️  Installments inválido. Usando 1 como padrão.');
                  // Para 1x, não enviar campos de parcelamento
                } else if (installmentsValue > 1) {
                  // Segundo a documentação do Asaas, para parcelas é necessário:
                  // - installmentCount: Número total de parcelas
                  // - installmentValue: Valor de cada parcela
                  cardPaymentData.installmentCount = installmentsValue;
                  cardPaymentData.installmentValue = Number((data.amount / installmentsValue).toFixed(2));
                  console.log('InstallmentCount e InstallmentValue set (fallback):', {
                    installmentCount: cardPaymentData.installmentCount,
                    installmentValue: cardPaymentData.installmentValue,
                    totalAmount: data.amount,
                  });
                }
              }
            }
            
            if (creditCardData.holderCpfCnpj) {
              cardPaymentData.creditCard.holderCpfCnpj = creditCardData.holderCpfCnpj;
            }
            
            // Tentar processar pagamento com cartão no endpoint específico
            try {
              const cardResponse = await client.post(`/payments/${paymentId}/pay`, cardPaymentData);
              response = cardResponse;
            } catch (cardError: any) {
              // Se falhar, retornar a cobrança criada
              console.warn('⚠️  Não foi possível processar pagamento com cartão. Cobrança criada como BOLETO.');
              response = chargeResponse;
            }
          } else {
            response = chargeResponse;
          }
        } else {
          throw error;
        }
      }

      console.log('Asaas payment created:', {
        id: response.data.id,
        status: response.data.status,
        billingType: response.data.billingType,
      });

      // Processar resposta baseado no tipo de pagamento
      if (data.paymentMethod === 'pix') {
        // Log da resposta completa do Asaas para debug
        console.log('🔍 Resposta completa do Asaas para PIX:', JSON.stringify(response.data, null, 2));
        
        // Listar todos os campos que contêm "pix" ou "qr" para debug
        const allKeys = Object.keys(response.data);
        const pixRelatedKeys = allKeys.filter(key => 
          key.toLowerCase().includes('pix') || 
          key.toLowerCase().includes('qr') || 
          key.toLowerCase().includes('code')
        );
        console.log('🔑 Campos relacionados a PIX/QR na resposta:', pixRelatedKeys);
        
        // Tentar diferentes estruturas possíveis da resposta do Asaas
        const pixCode = response.data.pixQrCodePayload 
          || response.data.pixQrCode 
          || response.data.pixQrCodePayload
          || response.data.pix?.qrCode 
          || response.data.pix?.payload
          || response.data.pix?.qrCodePayload
          || response.data.transactionReceiptUrl // Alguns gateways retornam o código aqui
          || null;
        
        const qrCodeBase64 = response.data.pixQrCodeBase64 
          || response.data.pixQrCodeImage
          || response.data.pixQrCodeBase64Image
          || response.data.pix?.qrCodeBase64
          || response.data.pix?.qrCodeImage
          || response.data.qrCodeBase64
          || response.data.qrCodeImage
          || response.data.encodedImage // Campo alternativo
          || null;
        
        const expiresAt = response.data.dueDate 
          || response.data.pix?.expiresAt
          || response.data.expiresAt
          || response.data.expirationDate
          || null;
        
        console.log('📦 Dados extraídos do PIX:', {
          pixCode: pixCode ? `${pixCode.substring(0, 50)}...` : null,
          qrCodeBase64: qrCodeBase64 ? `${qrCodeBase64.substring(0, 50)}... (${qrCodeBase64.length} chars)` : null,
          expiresAt: expiresAt,
          allPixKeys: pixRelatedKeys,
        });
        
        // Para PIX, retornar código QR Code
        return {
          success: true,
          payment: {
            id: response.data.id,
            status: this.mapAsaasStatusToOurStatus(response.data.status),
            statusDetail: response.data.status,
            gatewayPaymentId: response.data.id,
            gatewayTransactionId: response.data.id,
          },
          pixCode: pixCode,
          pixQrCodeBase64: qrCodeBase64,
          pixExpiresAt: expiresAt ? new Date(expiresAt) : null,
        };
      } else if (data.paymentMethod === 'credit_card' || data.paymentMethod === 'debit_card') {
        // Para cartão, retornar status do pagamento
        return {
          success: true,
          payment: {
            id: response.data.id,
            status: this.mapAsaasStatusToOurStatus(response.data.status),
            statusDetail: response.data.status,
            gatewayPaymentId: response.data.id,
            gatewayTransactionId: response.data.id,
          },
        };
      } else {
        // Para boleto ou outros métodos
        return {
          success: true,
          payment: {
            id: response.data.id,
            status: this.mapAsaasStatusToOurStatus(response.data.status),
            statusDetail: response.data.status,
            gatewayPaymentId: response.data.id,
            gatewayTransactionId: response.data.id,
          },
          init_point: response.data.invoiceUrl || null,
        };
      }
    } catch (error: any) {
      console.error('❌ Error creating Asaas payment:', error);
      
      let errorMessage = 'Erro ao criar pagamento no Asaas';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.description || e.message).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
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
   * Buscar QR Code PIX de um pagamento no Asaas
   * Usa o endpoint específico /payments/{id}/pixQrCode conforme documentação do Asaas
   */
  static async getPixQrCode(asaasPaymentId: string): Promise<{
    success: boolean;
    pixCode?: string | null;
    qrCodeBase64?: string | null;
    pixExpiresAt?: Date | null;
    error?: string;
  }> {
    const client = createAsaasClient();
    if (!client) {
      return {
        success: false,
        error: 'Asaas não configurado',
      };
    }

    try {
      // Buscar QR Code PIX usando o endpoint específico conforme documentação do Asaas
      const qrCodeResponse = await client.get(`/payments/${asaasPaymentId}/pixQrCode`);
      
      console.log('🔍 Resposta completa do Asaas ao buscar QR Code PIX:', JSON.stringify(qrCodeResponse.data, null, 2));
      
      // Segundo a documentação do Asaas, o endpoint retorna:
      // - encodedImage: QR Code em base64
      // - payload: Código PIX para copiar e colar
      // - expirationDate: Data de expiração
      const pixCode = qrCodeResponse.data.payload || null;
      const qrCodeBase64 = qrCodeResponse.data.encodedImage || null;
      const expiresAt = qrCodeResponse.data.expirationDate 
        ? new Date(qrCodeResponse.data.expirationDate) 
        : null;

      console.log('📦 Dados PIX extraídos do endpoint pixQrCode:', {
        pixCode: pixCode ? `${pixCode.substring(0, 50)}...` : null,
        qrCodeBase64: qrCodeBase64 ? `${qrCodeBase64.substring(0, 50)}... (${qrCodeBase64.length} chars)` : null,
        expiresAt: expiresAt,
      });

      return {
        success: true,
        pixCode: pixCode,
        qrCodeBase64: qrCodeBase64,
        pixExpiresAt: expiresAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching PIX QR Code from Asaas:', error);
      
      let errorMessage = 'Erro ao buscar QR Code PIX no Asaas';
      if (error.response) {
        console.error('Erro resposta Asaas:', error.response.data);
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.description || e.message).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Buscar detalhes de um pagamento no Asaas
   * Útil para buscar informações gerais do pagamento
   */
  static async getPayment(asaasPaymentId: string): Promise<PaymentResult> {
    const client = createAsaasClient();
    if (!client) {
      return {
        success: false,
        error: 'Asaas não configurado',
      };
    }

    try {
      const response = await client.get(`/payments/${asaasPaymentId}`);
      
      console.log('🔍 Resposta completa do Asaas ao buscar pagamento:', JSON.stringify(response.data, null, 2));
      
      // Se for PIX, buscar QR Code usando o endpoint específico
      let pixCode = null;
      let qrCodeBase64 = null;
      let pixExpiresAt = null;
      
      if (response.data.billingType === 'PIX') {
        const qrCodeResult = await this.getPixQrCode(asaasPaymentId);
        if (qrCodeResult.success) {
          pixCode = qrCodeResult.pixCode || null;
          qrCodeBase64 = qrCodeResult.qrCodeBase64 || null;
          pixExpiresAt = qrCodeResult.pixExpiresAt || null;
        }
      }

      return {
        success: true,
        payment: {
          id: response.data.id,
          status: this.mapAsaasStatusToOurStatus(response.data.status),
          statusDetail: response.data.status,
          gatewayPaymentId: response.data.id,
          gatewayTransactionId: response.data.id,
        },
        pixCode: pixCode,
        pixQrCodeBase64: qrCodeBase64,
        pixExpiresAt: pixExpiresAt,
      };
    } catch (error: any) {
      console.error('❌ Error fetching Asaas payment:', error);
      
      let errorMessage = 'Erro ao buscar pagamento no Asaas';
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.description || e.message).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Criar ou buscar cliente no Asaas
   */
  private static async createOrGetCustomer(data: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    address?: CreatePaymentData['address'];
  }): Promise<any> {
    try {
      const client = createAsaasClient();
      if (!client) return null;

      // Buscar cliente por CPF/CNPJ ou email
      if (data.cpfCnpj) {
        const searchResponse = await client.get('/customers', {
          params: {
            cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
          },
        });

        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          return searchResponse.data.data[0];
        }
      }

      // Se não encontrou, criar novo cliente
      const customerData: any = {
        name: data.name,
        email: data.email,
      };

      // CPF/CNPJ é obrigatório para criar cliente no Asaas
      if (data.cpfCnpj) {
        customerData.cpfCnpj = data.cpfCnpj.replace(/\D/g, '');
      } else {
        // Se não temos CPF, não podemos criar cliente no Asaas
        console.warn('⚠️  CPF/CNPJ não fornecido. Não é possível criar cliente no Asaas sem CPF/CNPJ.');
        return null;
      }

      if (data.phone) {
        customerData.phone = data.phone.replace(/\D/g, '');
      }

      if (data.address) {
        customerData.postalCode = data.address.zipCode?.replace(/\D/g, '');
        customerData.address = data.address.street;
        customerData.addressNumber = data.address.number;
        customerData.complement = data.address.complement;
        customerData.province = data.address.neighborhood;
        customerData.city = data.address.city;
        customerData.state = data.address.state;
      }

      const createResponse = await client.post('/customers', customerData);
      return createResponse.data;
    } catch (error: any) {
      console.error('Error creating/getting Asaas customer:', error);
      return null;
    }
  }

  /**
   * Mapear método de pagamento para billingType do Asaas
   */
  private static mapPaymentMethodToBillingType(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'pix':
        return 'PIX';
      case 'credit_card':
        return 'CREDIT_CARD';
      case 'debit_card':
        return 'DEBIT_CARD';
      case 'boleto':
        return 'BOLETO';
      default:
        return 'PIX';
    }
  }

  /**
   * Mapear status do Asaas para nosso sistema
   */
  private static mapAsaasStatusToOurStatus(asaasStatus: string): string {
    switch (asaasStatus?.toUpperCase()) {
      case 'PENDING':
      case 'AWAITING_RISK_ANALYSIS':
        return 'pending';
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'approved';
      case 'OVERDUE':
        return 'pending';
      case 'REFUNDED':
        return 'refunded';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Processar webhook do Asaas
   */
  static async handleWebhook(webhookData: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔔 Webhook do Asaas recebido:', JSON.stringify(webhookData, null, 2));
      
      const client = createAsaasClient();
      
      if (!client) {
        console.error('❌ Asaas não configurado');
        return {
          success: false,
          error: 'Asaas não configurado. Configure ASAAS_API_KEY no .env',
        };
      }

      // O Asaas envia webhooks em diferentes formatos dependendo do evento
      // Formato 1: { event: 'PAYMENT_RECEIVED', payment: { ... } }
      // Formato 2: { action: 'PAYMENT_RECEIVED', payment: { ... } }
      // Formato 3: { ... } (dados do pagamento diretamente)
      const event = webhookData.event || webhookData.action || webhookData.type;
      const paymentData = webhookData.payment || webhookData;
      
      // Log do evento recebido
      if (event) {
        console.log(`📋 Evento recebido: ${event}`);
      }

      console.log('📦 Dados do webhook processados:', {
        event,
        paymentId: paymentData?.id,
        paymentStatus: paymentData?.status,
        paymentDataKeys: paymentData ? Object.keys(paymentData) : [],
      });

      if (!paymentData || !paymentData.id) {
        console.error('❌ Dados do pagamento não encontrados no webhook');
        return {
          success: false,
          error: 'Dados do pagamento não encontrados no webhook',
        };
      }

      const asaasPaymentId = paymentData.id.toString();
      console.log('🔍 Buscando pagamento com gatewayPaymentId:', asaasPaymentId);

      // Buscar pagamento no banco pelo gatewayPaymentId
      let payment = await prisma.payment.findFirst({
        where: {
          gatewayPaymentId: asaasPaymentId,
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        // Tentar buscar também pelo gatewayTransactionId
        const paymentByTransaction = await prisma.payment.findFirst({
          where: {
            gatewayTransactionId: asaasPaymentId,
          },
          include: {
            order: true,
          },
        });

        if (paymentByTransaction) {
          console.log('✅ Pagamento encontrado pelo gatewayTransactionId:', paymentByTransaction.id);
          // Atualizar gatewayPaymentId se não estiver definido
          if (!paymentByTransaction.gatewayPaymentId) {
            await prisma.payment.update({
              where: { id: paymentByTransaction.id },
              data: { gatewayPaymentId: asaasPaymentId },
            });
          }
          // Continuar com o pagamento encontrado
          payment = paymentByTransaction;
        } else {
          console.warn(`⚠️  Pagamento não encontrado para gatewayPaymentId: ${asaasPaymentId}`);
          const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              gatewayPaymentId: true,
              gatewayTransactionId: true,
              status: true,
            },
          });
          console.log('🔍 Listando últimos 5 pagamentos para debug:', { payments: recentPayments });
          return {
            success: false,
            error: 'Pagamento não encontrado',
          };
        }
      } else {
        console.log('✅ Pagamento encontrado:', payment.id);
      }

      // Mapear status do Asaas para nosso sistema
      const status = this.mapAsaasStatusToOurStatus(paymentData.status);
      const statusDetail = paymentData.status || 'Status atualizado via webhook do Asaas';
      
      // Log detalhado do status
      console.log(`🔄 Mapeamento de status:`, {
        asaasStatus: paymentData.status,
        nossoStatus: status,
        evento: event,
        paymentId: payment.id,
      });
      
      // Se o status não mudou, não precisa atualizar
      if (payment.status === status) {
        console.log(`ℹ️ Status do pagamento ${payment.id} já está como "${status}". Nenhuma atualização necessária.`);
        return { success: true };
      }

      console.log('🔄 Atualizando status do pagamento:', {
        paymentId: payment.id,
        oldStatus: payment.status,
        newStatus: status,
        asaasStatus: paymentData.status,
      });

      // Atualizar pagamento usando PaymentService para garantir consistência
      const { PaymentService } = await import('./PaymentService');
      const updateResult = await PaymentService.updatePaymentStatus(
        payment.id,
        status,
        statusDetail,
        webhookData
      );

      if (!updateResult.success) {
        console.error('❌ Erro ao atualizar status do pagamento:', updateResult.error);
        // Tentar atualizar diretamente como fallback
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: status as any,
            statusDetail,
            gatewayTransactionId: paymentData.id.toString(),
          },
        });
      } else {
        console.log('✅ Status do pagamento atualizado com sucesso via PaymentService');
      }

      // Se pagamento aprovado, atualizar pedido e criar notificação
      if (status === 'approved' && payment.order) {
        await prisma.order.update({
          where: { id: payment.order.id },
          data: {
            status: 'confirmed',
          },
        });
        
        // Criar notificação de pagamento aprovado
        try {
          const { NotificationService } = await import('./NotificationService');
          await NotificationService.createNotification(
            payment.order.userId,
            'payment',
            'Pagamento Confirmado! 🎉',
            `Seu pagamento de R$ ${Number(payment.amount).toFixed(2).replace('.', ',')} foi confirmado com sucesso.`,
            {
              paymentId: payment.id,
              orderId: payment.order.id,
              amount: Number(payment.amount),
            }
          );
        } catch (notifError) {
          console.error('Error creating payment notification:', notifError);
          // Não falhar se não conseguir criar notificação
        }
        
        // Emitir evento WebSocket para atualização em tempo real
        try {
          const { getSocketServer } = await import('../socket');
          const io = getSocketServer();
          if (io) {
            // Emitir para o usuário específico
            io.to(`user:${payment.order.userId}`).emit('payment:updated', {
              paymentId: payment.id,
              status: 'approved',
              orderId: payment.order.id,
            });
            console.log(`📤 Evento de pagamento aprovado enviado via WebSocket para usuário ${payment.order.userId}`);
          }
        } catch (socketError) {
          console.error('Error emitting payment update via WebSocket:', socketError);
          // Não falhar se WebSocket não estiver disponível
        }
        
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
          
          // Filtrar notificações que correspondem a este pagamento (exceto a nova)
          const matchingNotifications = notifications.filter((notif) => {
            if (!notif.data) return false;
            try {
              const data = JSON.parse(notif.data);
              return data.paymentId === payment.id && notif.message.includes('pendente');
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

      console.log(`Pagamento ${payment.id} atualizado via webhook do Asaas: ${status}`);

      return { success: true };
    } catch (error: any) {
      console.error('Error processing Asaas webhook:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar webhook do Asaas',
      };
    }
  }

  /**
   * Processar reembolso via Asaas
   */
  static async refundPayment(
    gatewayPaymentId: string,
    amount?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = createAsaasClient();
      
      if (!client) {
        return {
          success: false,
          error: 'Asaas não configurado. Configure ASAAS_API_KEY no .env',
        };
      }

      // O Asaas usa a API de refunds
      const refundData: any = {
        value: amount,
      };

      const response = await client.post(`/payments/${gatewayPaymentId}/refund`, refundData);

      if (response.data) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Reembolso não processado pelo Asaas',
      };
    } catch (error: any) {
      console.error('Error processing Asaas refund:', error);
      
      let errorMessage = 'Erro ao processar reembolso no Asaas';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.description || e.message).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

