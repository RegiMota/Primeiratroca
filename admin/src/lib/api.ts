// API Client para Admin Panel
// Versão 2.0 - Separado do site principal

import axios from 'axios';

// Interfaces para tipos de dados
interface ProductData {
  name: string;
  description: string;
  detailedDescription?: string;
  price: number | string;
  originalPrice?: number | string;
  image: string;
  categoryId: number | string;
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  stock?: number | string;
}

interface CategoryData {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

interface UserData {
  name?: string;
  email?: string;
  isAdmin?: boolean;
  birthDate?: string;
  cpf?: string;
}

interface CouponData {
  code: string;
  discount: number | string;
  type: 'percentage' | 'fixed';
  minPurchase?: number | string;
  maxDiscount?: number | string;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number | string;
  isActive?: boolean;
}

interface StockVariantData {
  productId: number;
  size?: string;
  color?: string;
  stock: number | string;
  minStock?: number | string;
  reservedStock?: number | string;
}

// Detectar automaticamente a URL da API
const getAPIUrl = () => {
  // Se houver variável de ambiente, usar ela diretamente
  if (import.meta.env.VITE_API_URL) {
    let apiUrl = import.meta.env.VITE_API_URL;
    // Garantir que termine com /api
    if (!apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/api';
    }
    return apiUrl;
  }
  
  // Se estiver em HTTPS (produção), usar caminho relativo /api (mesmo domínio via Nginx)
  // Isso evita Mixed Content (HTTPS tentando carregar HTTP)
  if (window.location.protocol === 'https:') {
    return '/api';
  }
  
  // Para desenvolvimento local, usar localhost
  return 'http://localhost:5000/api';
};

const API_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos para operações que podem demorar mais
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API (admin-specific)
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('token', response.data.token); // Compatibilidade
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getAnalyticsOverview: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  getAnalyticsTrends: async (params?: { period?: string; comparePeriod?: string }) => {
    const response = await api.get('/admin/analytics/trends', { params });
    return response.data;
  },

  getAnalyticsFunnel: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/analytics/funnel', { params });
    return response.data;
  },

  getAnalyticsBehavior: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/analytics/behavior', { params });
    return response.data;
  },

  exportAnalytics: async (params?: { startDate?: string; endDate?: string; format?: 'csv' | 'json' }) => {
    const response = await api.get('/admin/analytics/export', { 
      params,
      responseType: params?.format === 'csv' ? 'blob' : 'json',
    });
    
    // Para CSV, retornar o blob diretamente
    if (params?.format === 'csv') {
      return response.data;
    }
    
    // Para JSON, retornar os dados
    return response.data;
  },

  // Products
  getProducts: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  createProduct: async (data: ProductData) => {
    const response = await api.post('/admin/products', data);
    return response.data;
  },

  updateProduct: async (id: number, data: Partial<ProductData>) => {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  // Orders
  getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.patch(`/admin/orders/${id}`, { status });
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  // Categories API (alias para compatibilidade)
  getAllCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  createCategory: async (data: CategoryData) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<CategoryData>) => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  updateUser: async (id: number, data: Partial<UserData>) => {
    // Usando PUT conforme a rota do backend
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Coupons
  getCoupons: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  createCoupon: async (data: CouponData) => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: number, data: Partial<CouponData>) => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: number) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  // Settings
  getLogo: async () => {
    const response = await api.get('/settings/logo');
    return response.data;
  },

  updateLogo: async (logo: string, logoLink?: string, logoSize?: string) => {
    const response = await api.put('/settings/logo', { logo, logoLink, logoSize });
    return response.data;
  },

  getFavicon: async () => {
    const response = await api.get('/settings/favicon');
    return response.data;
  },

  updateFavicon: async (favicon: string) => {
    const response = await api.put('/settings/favicon', { favicon });
    return response.data;
  },

  // Products - Admin specific (get all for admin)
  getAllProducts: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  // Reports
  getSalesReport: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/reports/sales', { params });
    return response.data;
  },

  // Payments (v2.0)
  getPayments: async (params?: { status?: string; gateway?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/payments', { params });
    // A API retorna { payments: [...], pagination: {...} }
    // Retornar apenas o array de pagamentos para compatibilidade com o frontend
    return response.data.payments || response.data || [];
  },

  getPaymentById: async (id: number) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  getPaymentStats: async () => {
    const response = await api.get('/admin/payments/stats');
    return response.data;
  },

  refundPayment: async (id: number, amount?: number) => {
    const response = await api.patch(`/admin/payments/${id}/refund`, { amount });
    return response.data;
  },

  syncPayment: async (id: number) => {
    const response = await api.post(`/admin/payments/${id}/sync`);
    return response.data;
  },

  // Stock API (v2.0)
  getStockVariants: async (params?: { productId?: number; page?: number; limit?: number }) => {
    const response = await api.get('/admin/stock/variants', { params });
    return response.data;
  },

  getStockVariantById: async (id: number) => {
    const response = await api.get(`/admin/stock/variants/${id}`);
    return response.data;
  },

  createStockVariant: async (data: StockVariantData) => {
    const response = await api.post('/admin/stock/variants', data);
    return response.data;
  },

  updateStockVariant: async (id: number, data: Partial<StockVariantData>) => {
    const response = await api.put(`/admin/stock/variants/${id}`, data);
    return response.data;
  },

  deleteStockVariant: async (id: number) => {
    const response = await api.delete(`/admin/stock/variants/${id}`);
    return response.data;
  },

  adjustStock: async (variantId: number, quantity: number, reason?: string, description?: string) => {
    const response = await api.post('/admin/stock/adjust', {
      variantId,
      quantity,
      reason,
      description,
    });
    return response.data;
  },

  getStockMovements: async (params?: { variantId?: number; limit?: number; offset?: number }) => {
    const response = await api.get('/admin/stock/movements', { params });
    return response.data;
  },

  getLowStockVariants: async (minStock?: number) => {
    const response = await api.get('/admin/stock/low-stock', {
      params: minStock ? { minStock } : {},
    });
    return response.data;
  },

  getStockStats: async () => {
    const response = await api.get('/admin/stock/stats');
    return response.data;
  },

  syncProductsToStock: async () => {
    const response = await api.post('/admin/stock/sync');
    return response.data;
  },

  // Shipping API (v2.0)
  getShippingTrackings: async (params?: { status?: string; carrier?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/admin/shipping/trackings', { params });
    return response.data;
  },

  getShippingTrackingById: async (id: number) => {
    const response = await api.get(`/admin/shipping/trackings/${id}`);
    return response.data;
  },

  updateTrackingStatus: async (id: number, data: { status: string; statusDetail?: string }) => {
    const response = await api.patch(`/admin/shipping/trackings/${id}/status`, data);
    return response.data;
  },

  syncTracking: async (trackingCode: string) => {
    const response = await api.post(`/admin/shipping/trackings/${trackingCode}/sync`);
    return response.data;
  },

  getShippingStats: async () => {
    const response = await api.get('/admin/shipping/stats');
    return response.data;
  },

  // Tickets
  getTickets: async (params?: { status?: string; category?: string; assignedToId?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/tickets/admin/all', { params });
    return response.data;
  },

  getTicketStats: async () => {
    const response = await api.get('/tickets/admin/stats');
    return response.data;
  },

  getTicketById: async (id: number) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  updateTicket: async (id: number, data: {
    status?: string;
    priority?: string;
    assignedToId?: number | null;
    resolution?: string;
  }) => {
    const response = await api.patch(`/tickets/${id}`, data);
    return response.data;
  },

  // Chat
  getChatMessages: async (ticketId: number) => {
    const response = await api.get(`/chat/${ticketId}/messages`);
    return response.data;
  },

  sendChatMessage: async (ticketId: number, data: {
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    const response = await api.post(`/chat/${ticketId}/messages`, data);
    return response.data;
  },

  // FAQ
  getFAQs: async (params?: { category?: string; search?: string }) => {
    const response = await api.get('/faq/admin/all', { params });
    return response.data;
  },

  createFAQ: async (data: {
    question: string;
    answer: string;
    category: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post('/faq/admin', data);
    return response.data;
  },

  updateFAQ: async (id: number, data: {
    question?: string;
    answer?: string;
    category?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/faq/admin/${id}`, data);
    return response.data;
  },

  deleteFAQ: async (id: number) => {
    const response = await api.delete(`/faq/admin/${id}`);
    return response.data;
  },
};

// PRODUCT IMAGES API
export const productImagesAPI = {
  getAll: async (productId: number) => {
    const response = await api.get(`/products/${productId}/images`);
    return response.data;
  },
  upload: async (productId: number, url: string, isPrimary?: boolean, order?: number) => {
    const response = await api.post(`/products/${productId}/images`, {
      url,
      isPrimary: isPrimary || false,
      order: order || 0,
    });
    return response.data;
  },
  update: async (productId: number, imageId: number, data: { url?: string; isPrimary?: boolean; order?: number }) => {
    const response = await api.put(`/products/${productId}/images/${imageId}`, data);
    return response.data;
  },
  delete: async (productId: number, imageId: number) => {
    const response = await api.delete(`/products/${productId}/images/${imageId}`);
    return response.data;
  },
};

// HERO SLIDES API
export const heroSlidesAPI = {
  getAll: async () => {
    const response = await api.get('/admin/hero-slides');
    return response.data;
  },
  create: async (data: {
    title?: string;
    subtitle?: string;
    description?: string;
    price?: string;
    originalPrice?: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl?: string;
    mediaType?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post('/admin/hero-slides', data, {
      timeout: 60000, // Timeout aumentado para 60 segundos (operações com mídia podem demorar)
    });
    return response.data;
  },
  update: async (id: number, data: {
    title?: string;
    subtitle?: string;
    description?: string;
    price?: string;
    originalPrice?: string;
    buttonText?: string;
    buttonLink?: string;
    mediaUrl?: string;
    mediaType?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/admin/hero-slides/${id}`, data, {
      timeout: 60000, // Timeout aumentado para 60 segundos (operações com mídia podem demorar)
    });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/hero-slides/${id}`, {
      timeout: 30000, // Timeout específico para delete (30 segundos)
    });
    return response.data;
  },
};

// BENEFIT CARDS API
export const benefitCardsAPI = {
  getAll: async () => {
    const response = await api.get('/admin/benefit-cards');
    return response.data;
  },
  create: async (data: {
    iconName?: string;
    imageUrl?: string;
    mainText: string;
    subText: string;
    color?: string;
    link?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post('/admin/benefit-cards', data, {
      timeout: 60000, // Timeout aumentado para 60 segundos
    });
    return response.data;
  },
  update: async (id: number, data: {
    iconName?: string;
    imageUrl?: string;
    mainText?: string;
    subText?: string;
    color?: string;
    link?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/admin/benefit-cards/${id}`, data, {
      timeout: 60000, // Timeout aumentado para 60 segundos
    });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/benefit-cards/${id}`, {
      timeout: 30000, // Timeout específico para delete (30 segundos)
    });
    return response.data;
  },
};

// Menus API
export const menusAPI = {
  getAll: async () => {
    const response = await api.get('/admin/menus');
    return response.data;
  },
  create: async (data: {
    label: string;
    href?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post('/admin/menus', data);
    return response.data;
  },
  update: async (id: number, data: {
    label?: string;
    href?: string | null;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/admin/menus/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/menus/${id}`);
    return response.data;
  },
  // Menu Items
  createItem: async (menuId: number, data: {
    label: string;
    href: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post(`/admin/menus/${menuId}/items`, data);
    return response.data;
  },
  updateItem: async (itemId: number, data: {
    label?: string;
    href?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/admin/menu-items/${itemId}`, data);
    return response.data;
  },
  deleteItem: async (itemId: number) => {
    const response = await api.delete(`/admin/menu-items/${itemId}`);
    return response.data;
  },
};

// Theme/Styling API
export const themeAPI = {
  get: async () => {
    const response = await api.get('/settings/theme');
    return response.data;
  },
  update: async (theme: any) => {
    const response = await api.put('/settings/theme', theme);
    return response.data;
  },
};

// Announcements API
export const announcementsAPI = {
  getAll: async () => {
    const response = await api.get('/admin/announcements');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/admin/announcements/${id}`);
    return response.data;
  },
  create: async (data: {
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    type?: string;
    isActive?: boolean;
    order?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },
  update: async (id: number, data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    type?: string;
    isActive?: boolean;
    order?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  },
};

