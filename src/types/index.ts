// Tipos compartilhados para o sistema
import type React from 'react';

// Endereço do usuário
export interface UserAddress {
  id: number;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  reference?: string;
  isDefault: boolean;
  recipientName?: string;
  phone?: string;
}

// Opção de frete
export interface ShippingOption {
  service: string;
  name: string;
  price: number;
  estimatedDays: number;
  carrier: string;
}

// Erro da API
export interface ApiError {
  message: string;
  status?: number;
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      details?: string;
      cause?: Array<{
        description?: string;
        message?: string;
      }> | {
        description?: string;
        message?: string;
      };
    };
  };
}

// Erro de cartão
export interface CardError extends ApiError {
  status_detail?: string;
}

// Produto
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: Array<{ url: string; isPrimary: boolean }>;
  category: {
    id: number;
    name: string;
  };
  sizes?: string[];
  colors?: string[];
  stock: number;
  featured?: boolean;
}

// Item do carrinho
export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

// Cupom aplicado
export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  finalTotal: number;
}

// Produto com imagens
export interface ProductWithImages extends Product {
  images?: Array<{ url: string; isPrimary: boolean; order?: number }>;
  detailedDescription?: string;
}

// Pedido do dashboard
export interface DashboardOrder {
  id: number;
  status: string;
  total: number;
  createdAt: string | Date;
}

// Produto do dashboard
export interface DashboardProduct {
  id: number;
  name: string;
  totalSold: number;
}

// Estatísticas do dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: DashboardOrder[];
  topProducts: DashboardProduct[];
}

// Pagamento
export interface Payment {
  id: number;
  orderId: number;
  gateway: string;
  gatewayPaymentId?: string;
  gatewayTransactionId?: string;
  paymentMethod: string;
  amount: number;
  status: string;
  statusDetail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Item de rastreamento
export interface TrackingItem {
  id: number;
  orderId: number;
  carrier: string;
  trackingCode: string;
  status: string;
  statusDetail?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  shippedAt?: string | Date;
  estimatedDelivery?: string | Date;
  deliveredAt?: string | Date;
  events?: Array<{
    date: string | Date;
    location: string;
    status: string;
  }>;
  deliveryProof?: string;
  recipientName?: string;
}

// Dados de pagamento para criação
export interface PaymentData {
  gateway: string;
  paymentMethod: string;
  installments: number;
  amount: number;
}

// Parâmetros de busca de produtos
export interface ProductSearchParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Variante de produto
export interface ProductVariant {
  id: number;
  size?: string;
  color?: string;
  price?: number;
  stock?: number;
  sku?: string;
}

// Configuração de status
export interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Parâmetros de busca de tickets
export interface TicketSearchParams {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

// Parâmetros de busca de FAQs
export interface FAQSearchParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Dados de produto para criação/atualização
export interface ProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  categoryId: number;
  image: string;
  stock: number;
  sizes: string[];
  colors: string[];
  featured: boolean;
}

// Item de pedido
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  product?: {
    id: number;
    name: string;
    image: string;
  };
}

// Pedido completo
export interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  items?: OrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
  shippingAddress?: string;
  trackingCode?: string;
}

