// ShippingService - Serviço para gerenciamento de frete e entregas
// Versão 2.0 - Integração com Correios e outras transportadoras

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';
import axios from 'axios';

const prisma = new PrismaClient();

// Configuração da API dos Correios
const CORREIOS_API_URL = process.env.CORREIOS_API_URL || 'https://api.correios.com.br';
const CORREIOS_API_USER = process.env.CORREIOS_API_USER || '';
const CORREIOS_API_PASSWORD = process.env.CORREIOS_API_PASSWORD || '';
const CORREIOS_API_CODE = process.env.CORREIOS_API_CODE || ''; // Código de contrato
const CORREIOS_ORIGIN_CEP = process.env.CORREIOS_ORIGIN_CEP || '01310-100'; // CEP de origem (padrão: Av. Paulista, SP)
const USE_CORREIOS_API = process.env.USE_CORREIOS_API === 'true' && !!CORREIOS_API_USER && !!CORREIOS_API_PASSWORD;

// Cache simples para cálculos de frete (em produção, usar Redis)
const shippingCache = new Map<string, { data: ShippingOption[]; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export interface CalculateShippingData {
  originZipCode: string;  // CEP de origem
  destinationZipCode: string;  // CEP de destino
  weight: number;  // Peso em gramas
  dimensions: {
    height: number;  // Altura em cm
    width: number;  // Largura em cm
    length: number;  // Comprimento em cm
  };
  value?: number;  // Valor declarado (opcional)
}

export interface ShippingOption {
  service: string;  // 'PAC', 'SEDEX', 'SEDEX10', etc.
  name: string;  // Nome descritivo
  price: number;  // Preço em reais
  estimatedDays: number;  // Prazo estimado em dias
  carrier: string;  // 'correios', 'jadlog', etc.
}

export interface CreateTrackingData {
  orderId: number;
  carrier: string;
  trackingCode: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export class ShippingService {
  /**
   * Calcula opções de frete para um pedido
   * Tenta usar API dos Correios se configurada, caso contrário usa cálculo simulado
   */
  static async calculateShipping(data: CalculateShippingData): Promise<ShippingOption[]> {
    try {
      const { originZipCode, destinationZipCode, weight, dimensions, value } = data;
      
      // Validar CEP (formato brasileiro: 00000-000)
      const zipCodeRegex = /^\d{5}-?\d{3}$/;
      if (!zipCodeRegex.test(destinationZipCode)) {
        throw new Error('CEP de destino inválido');
      }

      // Verificar cache
      const cacheKey = `${originZipCode || CORREIOS_ORIGIN_CEP}-${destinationZipCode}-${weight}-${dimensions.height}-${dimensions.width}-${dimensions.length}`;
      const cached = shippingCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log('[ShippingService] Retornando cálculo de frete do cache');
        return cached.data;
      }

      // Tentar usar API dos Correios se configurada
      if (USE_CORREIOS_API) {
        try {
          const options = await this.calculateShippingWithCorreiosAPI({
            originZipCode: originZipCode || CORREIOS_ORIGIN_CEP,
            destinationZipCode,
            weight,
            dimensions,
            value,
          });
          
          // Salvar no cache
          shippingCache.set(cacheKey, {
            data: options,
            expiresAt: Date.now() + CACHE_TTL,
          });

          // Limpar cache antigo (manter apenas últimas 100 entradas)
          if (shippingCache.size > 100) {
            const oldestKey = Array.from(shippingCache.keys())[0];
            shippingCache.delete(oldestKey);
          }

          return options;
        } catch (apiError: any) {
          console.warn('[ShippingService] Erro ao usar API dos Correios, usando cálculo simulado:', apiError.message);
          // Continua para cálculo simulado
        }
      }

      // Usar cálculo simulado (fallback)
      const normalizedZipCode = destinationZipCode.replace(/-/g, '');
      const baseDistance = this.estimateDistance(normalizedZipCode);
      const weightKg = weight / 1000;

      const options: ShippingOption[] = [
        {
          service: 'PAC',
          name: 'PAC - Prazo de Entrega: 10 a 15 dias úteis',
          price: this.calculatePACPrice(weightKg, baseDistance),
          estimatedDays: 12,
          carrier: 'correios',
        },
        {
          service: 'SEDEX',
          name: 'SEDEX - Prazo de Entrega: 3 a 5 dias úteis',
          price: this.calculateSEDEXPrice(weightKg, baseDistance),
          estimatedDays: 4,
          carrier: 'correios',
        },
        {
          service: 'SEDEX10',
          name: 'SEDEX 10 - Prazo de Entrega: Até 1 dia útil',
          price: this.calculateSEDEX10Price(weightKg, baseDistance),
          estimatedDays: 1,
          carrier: 'correios',
        },
      ];

      const filteredOptions = options.filter(opt => opt.price > 0 && opt.price < 1000);
      
      // Salvar no cache
      shippingCache.set(cacheKey, {
        data: filteredOptions,
        expiresAt: Date.now() + CACHE_TTL,
      });

      return filteredOptions;
    } catch (error) {
      console.error('Error calculating shipping:', error);
      throw error;
    }
  }

  /**
   * Calcula frete usando API dos Correios
   * Nota: Esta é uma implementação baseada na API REST dos Correios
   * Adapte conforme a documentação oficial da sua conta contratual
   */
  private static async calculateShippingWithCorreiosAPI(data: CalculateShippingData): Promise<ShippingOption[]> {
    const { originZipCode, destinationZipCode, weight, dimensions, value } = data;
    
    // Normalizar CEPs
    const originCEP = originZipCode.replace(/-/g, '');
    const destCEP = destinationZipCode.replace(/-/g, '');

    // Preparar dados para API dos Correios
    // Nota: A estrutura da API pode variar dependendo do tipo de conta
    const requestData = {
      cepOrigem: originCEP,
      cepDestino: destCEP,
      peso: weight, // em gramas
      formato: 1, // 1 = Caixa/Pacote, 2 = Rolo/Cilindro, 3 = Envelope
      comprimento: dimensions.length,
      altura: dimensions.height,
      largura: dimensions.width,
      valorDeclarado: value || 0,
      codigoServico: ['04014', '04510', '40126'], // PAC, SEDEX, SEDEX 10
    };

    try {
      // Chamada para API dos Correios
      // Nota: A URL e estrutura podem variar dependendo da sua conta
      const response = await axios.post(
        `${CORREIOS_API_URL}/preco/v1/nacional`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${CORREIOS_API_USER}:${CORREIOS_API_PASSWORD}`).toString('base64')}`,
            'User-Agent': 'PrimeiraTroca/2.0',
          },
          timeout: 10000, // 10 segundos
        }
      );

      // Processar resposta da API
      const options: ShippingOption[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item.valor && item.valor > 0) {
            const serviceCode = item.codigo || item.codServico || '';
            const serviceName = this.getServiceName(serviceCode);
            
            options.push({
              service: serviceCode,
              name: serviceName,
              price: parseFloat(item.valor) || parseFloat(item.preco) || 0,
              estimatedDays: parseInt(item.prazoEntrega) || parseInt(item.prazo) || 0,
              carrier: 'correios',
            });
          }
        }
      }

      if (options.length === 0) {
        throw new Error('API dos Correios não retornou opções válidas');
      }

      return options;
    } catch (error: any) {
      if (error.response) {
        console.error('[ShippingService] Erro na resposta da API dos Correios:', error.response.status, error.response.data);
        throw new Error(`Erro na API dos Correios: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('[ShippingService] Erro de conexão com API dos Correios:', error.message);
        throw new Error('Erro de conexão com API dos Correios');
      } else {
        throw error;
      }
    }
  }

  /**
   * Retorna nome descritivo do serviço baseado no código
   */
  private static getServiceName(code: string): string {
    const services: { [key: string]: string } = {
      '04014': 'SEDEX - Prazo de Entrega: 3 a 5 dias úteis',
      '04510': 'PAC - Prazo de Entrega: 10 a 15 dias úteis',
      '40126': 'SEDEX 10 - Prazo de Entrega: Até 1 dia útil',
      '40169': 'SEDEX 12 - Prazo de Entrega: Até 12 horas',
      '40215': 'SEDEX Hoje - Prazo de Entrega: No mesmo dia',
    };
    
    return services[code] || `Serviço ${code}`;
  }

  /**
   * Estima distância baseada no CEP (simulado)
   * Em produção, usar API de geolocalização ou API dos Correios
   */
  private static estimateDistance(zipCode: string): number {
    // Simulação: CEPs começando com 0-2 são mais próximos (região metropolitana)
    // CEPs começando com 6-9 são mais distantes (interior)
    const firstDigit = parseInt(zipCode[0]);
    
    if (firstDigit <= 2) {
      return 50; // ~50km (região metropolitana)
    } else if (firstDigit <= 5) {
      return 200; // ~200km (estado)
    } else {
      return 800; // ~800km (outros estados)
    }
  }

  /**
   * Calcula preço PAC (simulado)
   */
  private static calculatePACPrice(weightKg: number, distance: number): number {
    // Fórmula simplificada: base + peso + distância
    const basePrice = 15.0;
    const weightPrice = weightKg * 2.5;
    const distancePrice = distance * 0.1;
    
    return Math.round((basePrice + weightPrice + distancePrice) * 100) / 100;
  }

  /**
   * Calcula preço SEDEX (simulado)
   */
  private static calculateSEDEXPrice(weightKg: number, distance: number): number {
    // SEDEX é mais caro que PAC
    const pacPrice = this.calculatePACPrice(weightKg, distance);
    return Math.round(pacPrice * 2.5 * 100) / 100;
  }

  /**
   * Calcula preço SEDEX 10 (simulado)
   */
  private static calculateSEDEX10Price(weightKg: number, distance: number): number {
    // SEDEX 10 é mais caro que SEDEX
    const sedexPrice = this.calculateSEDEXPrice(weightKg, distance);
    return Math.round(sedexPrice * 1.8 * 100) / 100;
  }

  /**
   * Cria rastreamento para um pedido
   */
  static async createTracking(data: CreateTrackingData) {
    try {
      const tracking = await prisma.shippingTracking.create({
        data: {
          orderId: data.orderId,
          carrier: data.carrier,
          trackingCode: data.trackingCode,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          status: 'pending',
        },
      });

      // Atualizar pedido com código de rastreamento
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          trackingCode: data.trackingCode,
        },
      });

      return tracking;
    } catch (error) {
      console.error('Error creating tracking:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de rastreamento
   * TODO: Integrar com API de rastreamento dos Correios
   */
  static async updateTrackingStatus(
    trackingId: number,
    status: string,
    statusDetail?: string,
    events?: any[]
  ) {
    try {
      const updateData: any = {
        status,
        statusDetail,
        updatedAt: new Date(),
      };

      // Atualizar datas baseadas no status
      if (status === 'in_transit' && !updateData.shippedAt) {
        updateData.shippedAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      // Salvar eventos se fornecidos
      if (events && events.length > 0) {
        updateData.events = JSON.stringify(events);
      }

      const tracking = await prisma.shippingTracking.update({
        where: { id: trackingId },
        data: updateData,
      });

      // Atualizar status do pedido se necessário
      if (status === 'delivered') {
        // Buscar status anterior do pedido
        const oldOrder = await prisma.order.findUnique({
          where: { id: tracking.orderId },
          select: { status: true },
        });

        const oldStatus = oldOrder?.status || 'shipped';

        const order = await prisma.order.update({
          where: { id: tracking.orderId },
          data: { status: 'delivered' },
          include: {
            user: true,
          },
        });

        // Notificar usuário sobre entrega
        try {
          await NotificationService.notifyOrderStatusUpdate(
            order.userId,
            order.id,
            oldStatus,
            'delivered'
          );
        } catch (error) {
          console.error('Error sending delivery notification:', error);
        }
      } else if (status === 'out_for_delivery') {
        // Notificar usuário que pedido saiu para entrega
        const order = await prisma.order.findUnique({
          where: { id: tracking.orderId },
          include: { user: true },
        });

        if (order) {
          try {
            await NotificationService.createNotification(
              order.userId,
              'order',
              'Pedido Saiu para Entrega',
              `Seu pedido #${order.id} saiu para entrega e deve chegar em breve!`,
              { orderId: order.id }
            );
          } catch (error) {
            console.error('Error sending delivery notification:', error);
          }
        }
      }

      return tracking;
    } catch (error) {
      console.error('Error updating tracking status:', error);
      throw error;
    }
  }

  /**
   * Busca rastreamento por código
   */
  static async getTrackingByCode(trackingCode: string) {
    try {
      return await prisma.shippingTracking.findFirst({
        where: { trackingCode },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting tracking by code:', error);
      throw error;
    }
  }

  /**
   * Busca rastreamento por pedido
   */
  static async getTrackingByOrder(orderId: number) {
    try {
      return await prisma.shippingTracking.findUnique({
        where: { orderId },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting tracking by order:', error);
      throw error;
    }
  }

  /**
   * Lista todos os rastreamentos com filtros
   */
  static async listTrackings(filters?: {
    status?: string;
    carrier?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.carrier) {
        where.carrier = filters.carrier;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [trackings, total] = await Promise.all([
        prisma.shippingTracking.findMany({
          where,
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.shippingTracking.count({ where }),
      ]);

      return {
        trackings,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error listing trackings:', error);
      throw error;
    }
  }

  /**
   * Atualiza rastreamento usando API externa (simulado) - por ID
   * TODO: Integrar com API real dos Correios
   */
  static async syncTrackingWithExternalAPI(trackingId: number) {
    try {
      // TODO: Implementar chamada real à API dos Correios
      // Por enquanto, retorna dados simulados
      
      console.log(`[ShippingService] Simulando sincronização de rastreamento: ID ${trackingId}`);
      
      // Buscar tracking atual
      const tracking = await prisma.shippingTracking.findUnique({
        where: { id: trackingId },
      });

      if (!tracking) {
        throw new Error('Rastreamento não encontrado');
      }
      
      // Simular resposta da API
      const mockEvents = [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          location: 'Centro de Distribuição - SP',
          status: 'Objeto postado',
        },
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
          location: 'Centro de Distribuição - RJ',
          status: 'Objeto em trânsito',
        },
        {
          date: new Date(),
          location: 'Aguardando coleta',
          status: 'Objeto aguardando retirada',
        },
      ];

      // Atualizar tracking com dados simulados
      await this.updateTrackingStatus(
        trackingId,
        'in_transit',
        'Objeto em trânsito',
        mockEvents
      );

      return {
        status: 'in_transit',
        statusDetail: 'Objeto em trânsito',
        events: mockEvents,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      };
    } catch (error) {
      console.error('Error syncing tracking from API:', error);
      throw error;
    }
  }

  /**
   * Atualiza rastreamento usando API externa - por código
   * Tenta usar API dos Correios se configurada, caso contrário usa dados simulados
   */
  static async syncTrackingFromAPI(trackingCode: string) {
    try {
      // Tentar usar API dos Correios se configurada
      if (USE_CORREIOS_API) {
        try {
          const trackingData = await this.getTrackingFromCorreiosAPI(trackingCode);
          return trackingData;
        } catch (apiError: any) {
          console.warn('[ShippingService] Erro ao usar API dos Correios para rastreamento, usando dados simulados:', apiError.message);
          // Continua para dados simulados
        }
      }

      // Usar dados simulados (fallback)
      console.log(`[ShippingService] Usando dados simulados para rastreamento: ${trackingCode}`);
      
      const mockEvents = [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          location: 'Centro de Distribuição - SP',
          status: 'Objeto postado',
        },
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
          location: 'Centro de Distribuição - RJ',
          status: 'Objeto em trânsito',
        },
        {
          date: new Date(),
          location: 'Aguardando coleta',
          status: 'Objeto aguardando retirada',
        },
      ];

      return {
        status: 'in_transit',
        statusDetail: 'Objeto em trânsito',
        events: mockEvents,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      };
    } catch (error) {
      console.error('Error syncing tracking from API:', error);
      throw error;
    }
  }

  /**
   * Busca informações de rastreamento na API dos Correios
   * Nota: Esta é uma implementação baseada na API REST dos Correios
   * Adapte conforme a documentação oficial da sua conta contratual
   */
  private static async getTrackingFromCorreiosAPI(trackingCode: string) {
    try {
      // Chamada para API de rastreamento dos Correios
      // Nota: A URL e estrutura podem variar dependendo da sua conta
      const response = await axios.get(
        `${CORREIOS_API_URL}/rastreamento/v1/objetos/${trackingCode}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${CORREIOS_API_USER}:${CORREIOS_API_PASSWORD}`).toString('base64')}`,
            'User-Agent': 'PrimeiraTroca/2.0',
          },
          timeout: 10000, // 10 segundos
        }
      );

      // Processar resposta da API
      const data = response.data;
      
      if (!data || !data.eventos) {
        throw new Error('API dos Correios não retornou dados de rastreamento válidos');
      }

      // Converter eventos da API para formato interno
      const events = data.eventos.map((evento: any) => ({
        date: new Date(evento.data || evento.dtHrCriado || Date.now()),
        location: evento.unidade?.endereco?.logradouro || evento.unidade?.nome || evento.local || '',
        status: evento.descricao || evento.status || '',
      }));

      // Determinar status atual baseado no último evento
      const lastEvent = events[events.length - 1];
      let status = 'pending';
      let statusDetail = 'Aguardando postagem';
      
      if (lastEvent) {
        const statusLower = lastEvent.status.toLowerCase();
        if (statusLower.includes('entregue') || statusLower.includes('entregue ao destinatário')) {
          status = 'delivered';
          statusDetail = 'Objeto entregue';
        } else if (statusLower.includes('saiu para entrega') || statusLower.includes('saiu para entrega ao destinatário')) {
          status = 'out_for_delivery';
          statusDetail = 'Objeto saiu para entrega';
        } else if (statusLower.includes('em trânsito') || statusLower.includes('em trânsito')) {
          status = 'in_transit';
          statusDetail = 'Objeto em trânsito';
        } else if (statusLower.includes('postado') || statusLower.includes('objeto postado')) {
          status = 'pending';
          statusDetail = 'Objeto postado';
        }
      }

      // Calcular data estimada de entrega (baseado no tipo de serviço)
      const estimatedDelivery = data.prazoEntrega 
        ? new Date(data.prazoEntrega)
        : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // Padrão: 5 dias

      return {
        status,
        statusDetail,
        events,
        estimatedDelivery,
      };
    } catch (error: any) {
      if (error.response) {
        console.error('[ShippingService] Erro na resposta da API de rastreamento dos Correios:', error.response.status, error.response.data);
        throw new Error(`Erro na API de rastreamento dos Correios: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('[ShippingService] Erro de conexão com API de rastreamento dos Correios:', error.message);
        throw new Error('Erro de conexão com API de rastreamento dos Correios');
      } else {
        throw error;
      }
    }
  }
}

