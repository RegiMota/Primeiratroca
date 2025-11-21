// API Client para Primeira Troca
// Versão 2.0

import axios from 'axios';

// Detectar automaticamente a URL base do servidor baseado no hostname atual
export const getServerUrl = (port: string = '5000', path: string = '') => {
  // Se houver variável de ambiente, usar ela
  if (import.meta.env.VITE_API_URL) {
    let baseUrl = import.meta.env.VITE_API_URL;
    // Remover /api do final se existir
    baseUrl = baseUrl.replace(/\/api\/?$/, '');
    // Garantir que não termine com /
    baseUrl = baseUrl.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }
  
  // Detectar o protocolo atual (http ou https)
  const protocol = window.location.protocol; // 'http:' ou 'https:'
  const hostname = window.location.hostname;
  
  // Se for localhost ou 127.0.0.1, usar http (desenvolvimento local)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}${path}`;
  }
  
  // Para produção, usar o mesmo protocolo da página atual (HTTPS se o site estiver em HTTPS)
  // Se estiver em HTTPS, usar caminho relativo (Nginx faz o proxy)
  if (protocol === 'https:') {
    // Em produção com HTTPS, a API está no mesmo domínio via Nginx
    // Retornar caminho relativo para evitar Mixed Content
    return path;
  }
  
  // Caso contrário, usar o mesmo hostname e protocolo (HTTP)
  return `${protocol}//${hostname}:${port}${path}`;
};

// Detectar automaticamente a URL da API baseado no hostname atual
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
  
  // Para desenvolvimento local, usar a porta 5000
  return getServerUrl('5000', '/api');
};

const API_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não logar erros 404 esperados (recursos não encontrados são comuns)
    const isExpected404 = error.response?.status === 404;
    
    // Log de erros para debug (exceto 404 esperados)
    if (process.env.NODE_ENV === 'development' && !isExpected404) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Se não houver resposta (erro de rede)
    if (!error.response) {
      console.error('❌ Erro de conexão com o servidor:', error.message);
      console.error('⚠️  Verifique se o servidor está rodando em http://localhost:5000');
    }

    if (error.response?.status === 401) {
      // Não redirecionar se:
      // 1. Já estiver na página de login/register
      // 2. For uma verificação de token em background (marcada com _isTokenCheck)
      // 3. For uma requisição de verificação de token (getCurrentUser)
      const isAuthCheck = error.config?._isTokenCheck || 
                         error.config?.url?.includes('/auth/me') || 
                         error.config?.url?.includes('/auth/getCurrentUser');
      const isAuthPage = window.location.pathname === '/login' || 
                        window.location.pathname === '/register' ||
                        window.location.pathname === '/forgot-password' ||
                        window.location.pathname === '/reset-password';
      
      if (!isAuthPage && !isAuthCheck) {
        // Limpar dados de autenticação
        const currentPath = window.location.pathname;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Usar setTimeout para evitar redirecionamento durante renderização
        setTimeout(() => {
          // Verificar novamente antes de redirecionar (pode ter mudado)
          const newPath = window.location.pathname;
          if (newPath !== '/login' && 
              newPath !== '/register' && 
              newPath !== '/forgot-password' && 
              newPath !== '/reset-password' &&
              newPath === currentPath) { // Só redirecionar se ainda estiver na mesma página
            window.location.href = '/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (name: string, email: string, password: string, cpf?: string, birthDate?: string) => {
    const response = await api.post('/auth/register', { 
      name, 
      email, 
      password,
      cpf: cpf || undefined,
      birthDate: birthDate || undefined,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      // Se for erro 401, não propagar para o interceptor (já será tratado no AuthContext)
      if (error.response?.status === 401) {
        // Marcar como verificação de token para evitar redirecionamento no interceptor
        if (error.config) {
          error.config._isTokenCheck = true;
        }
      }
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  updateProfile: async (data: { name?: string; birthDate?: string; cpf?: string }) => {
    const response = await api.put('/auth/profile', data);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// ============================================
// PRODUCTS API
// ============================================

export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    offset?: number;
    category?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    color?: string;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: number, silent404: boolean = false) => {
    try {
    const response = await api.get(`/products/${id}`);
    return response.data;
    } catch (error: any) {
      // Se for 404 e silent404 estiver ativado, retornar null em vez de lançar erro
      if (silent404 && error.response?.status === 404) {
        // Retornar null silenciosamente sem propagar o erro
        return null;
      }
      // Para outros erros ou quando silent404=false, propagar o erro normalmente
      // Mas não logar 404s quando silent404=true (já foi tratado acima)
      if (!silent404 || error.response?.status !== 404) {
        throw error;
      }
      return null;
    }
  },

  getBestSelling: async (limit?: number) => {
    const response = await api.get('/products/best-selling', { 
      params: limit ? { limit } : {} 
    });
    return response.data;
  },

  getSearchSuggestions: async (q: string) => {
    if (!q || q.trim().length < 1) {
      return [];
    }
    const response = await api.get('/products/search/suggestions', { params: { q } });
    return response.data;
  },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Menus API (public)
export const menusAPI = {
  getAll: async () => {
    const response = await api.get('/categories/menus');
    return response.data;
  },
};

// ============================================
// CART API
// ============================================

export const cartAPI = {
  addItem: async (productId: number, quantity: number, size: string, color: string) => {
    const response = await api.post('/cart/add', { productId, quantity, size, color });
    return response.data;
  },

  removeItem: async (productId: number, size: string, color: string) => {
    const response = await api.delete('/cart/remove', {
      data: { productId, size, color },
    });
    return response.data;
  },

  updateQuantity: async (productId: number, quantity: number, size: string, color: string) => {
    const response = await api.put('/cart/update', { productId, quantity, size, color });
    return response.data;
  },

  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};

// ============================================
// ORDERS API
// ============================================

export const ordersAPI = {
  create: async (orderData: {
    items: Array<{
      productId: number;
      quantity: number;
      size: string;
      color: string;
      price: number;
    }>;
    shippingAddress: string;
    shippingAddressId?: number;
    paymentMethod: string;
    couponCode?: string;
    shippingCost?: number;
    shippingMethod?: string;
  }) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

// ============================================
// REVIEWS API
// ============================================

export const reviewsAPI = {
  getByProduct: async (productId: number) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response.data;
  },

  getAverageRating: async (productId: number) => {
    const response = await api.get(`/reviews/product/${productId}/average`);
    return response.data;
  },

  checkPurchase: async (productId: number) => {
    const response = await api.get(`/reviews/check-purchase/${productId}`);
    return response.data;
  },

  create: async (productId: number, rating: number, comment?: string, images?: string[]) => {
    const response = await api.post('/reviews', { 
      productId, 
      rating, 
      comment: comment || '', 
      images: images && images.length > 0 ? images : undefined 
    });
    return response.data;
  },

  delete: async (reviewId: number) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

// ============================================
// COUPONS API
// ============================================

export const couponsAPI = {
  validate: async (code: string, total: number) => {
    const response = await api.post('/coupons/validate', { code, total });
    return response.data;
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsAPI = {
  getAll: async (params?: { isRead?: boolean; limit?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// ============================================
// PAYMENTS API
// ============================================

export const paymentsAPI = {
  getAll: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (orderId: number, paymentData: {
    gateway: string;
    paymentMethod: string;
    amount: number;
    installments?: number;
    [key: string]: any;
  }) => {
    const response = await api.post('/payments', { orderId, paymentData });
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/payments/${id}/status`, { status });
    return response.data;
  },

  // Asaas - Processar pagamento (criar pagamento)
  process: async (paymentId: number) => {
    const response = await api.post(`/payments/process/${paymentId}`);
    return response.data;
  },

  // Asaas - Confirmar pagamento (Checkout Transparente)
  confirm: async (paymentId: number, token: string, installments?: number, paymentMethodId?: string) => {
    const response = await api.post('/payments/confirm', {
      paymentId,
      token,
      installments,
      paymentMethodId,
    });
    return response.data;
  },

  // Asaas - Processar pagamento PIX diretamente (Checkout Transparente)
  processPix: async (paymentId: number) => {
    const response = await api.post(`/payments/process-pix/${paymentId}`);
    return response.data;
  },

  // Asaas - Preparar dados do cartão (não tokeniza, apenas formata)
  tokenizeCard: async (data: {
    cardNumber: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    cardholderName: string;
    identificationType: string;
    identificationNumber: string;
  }) => {
    try {
      const response = await api.post('/payments/tokenize-card', data);
      return response.data;
    } catch (error: any) {
      console.error('API tokenizeCard error:', error);
      console.error('Error response data:', error.response?.data);
      // Re-throw para que o CheckoutPage possa tratar
      throw error;
    }
  },

  // Asaas - Processar pagamento com cartão diretamente (Checkout Transparente)
  processCard: async (data: {
    paymentId: number;
    token: string;
    installments?: number;
    paymentMethodId?: string;
  }) => {
    try {
      // Log detalhado antes de enviar
      console.log('📤 Enviando dados para processCard:', {
        paymentId: data.paymentId,
        hasToken: !!data.token,
        installments: data.installments,
        installmentsType: typeof data.installments,
        installmentsIsUndefined: data.installments === undefined,
        installmentsIsNull: data.installments === null,
        paymentMethodId: data.paymentMethodId,
        fullData: JSON.stringify(data),
      });
      
      const response = await api.post('/payments/process-card', data);
      return response.data;
    } catch (error: any) {
      console.error('API processCard error:', error);
      console.error('Error response data:', error.response?.data);
      // Re-throw para que o CheckoutPage possa tratar
      throw error;
    }
  },
};

// ============================================
// STOCK API
// ============================================

export const stockAPI = {
  getVariantsByProduct: async (productId: number) => {
    const response = await api.get(`/stock/variants/product/${productId}`);
    return response.data;
  },

  getVariantById: async (id: number) => {
    const response = await api.get(`/stock/variants/${id}`);
    return response.data;
  },

  getVariantByProductSizeColor: async (productId: number, size: string, color: string) => {
    const response = await api.get(`/stock/variants/product/${productId}/size/${size}/color/${color}`);
    return response.data;
  },

  reserveStock: async (variantId: number, quantity: number, orderId?: number) => {
    const response = await api.post('/stock/reserve', { variantId, quantity, orderId });
    return response.data;
  },

  releaseStock: async (variantId: number, quantity: number, orderId?: number) => {
    const response = await api.post('/stock/release', { variantId, quantity, orderId });
    return response.data;
  },
};

// ============================================
// SHIPPING API
// ============================================

export const shippingAPI = {
  calculate: async (data: {
    zipCode?: string; // CEP de destino (formato antigo para compatibilidade)
    originZipCode?: string; // CEP de origem
    destinationZipCode?: string; // CEP de destino
    weight: number;
    dimensions?: { height: number; width: number; length: number };
    value?: number;
    items?: Array<{ productId: number; quantity: number }>; // Itens para calcular dimensões
  }) => {
    // Se zipCode foi fornecido, usar como destinationZipCode
    const destinationZipCode = data.destinationZipCode || data.zipCode;
    
    // Se não tiver originZipCode, usar CEP padrão (Av. Paulista, SP)
    // O backend também tem um CEP padrão, mas vamos enviar explicitamente
    const originZipCode = data.originZipCode || '01310100'; // CEP padrão: Av. Paulista, SP
    
    // Se não tiver dimensions mas tiver items, calcular dimensões padrão
    let dimensions = data.dimensions;
    if (!dimensions && data.items) {
      // Calcular dimensões baseado nos itens (dimensões padrão)
      const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
      // Dimensões padrão: 20x20x20cm por item (mínimo)
      dimensions = {
        height: Math.max(20, totalItems * 5), // Altura mínima 20cm, +5cm por item
        width: 20,
        length: 20,
      };
    } else if (!dimensions) {
      // Dimensões padrão se não tiver nem dimensions nem items
      dimensions = {
        height: 20,
        width: 20,
        length: 20,
      };
    }
    
    // Validar que destinationZipCode foi fornecido
    if (!destinationZipCode) {
      throw new Error('CEP de destino é obrigatório');
    }
    
    const requestData: {
      originZipCode: string;
      destinationZipCode: string;
      weight: number;
      dimensions: { height: number; width: number; length: number };
      value?: number;
    } = {
      originZipCode: originZipCode,
      destinationZipCode: destinationZipCode,
      weight: data.weight,
      dimensions: dimensions,
    };
    
    if (data.value) {
      requestData.value = data.value;
    }
    
    const response = await api.post('/shipping/calculate', requestData);
    return response.data;
  },

  getTrackingByCode: async (code: string) => {
    const response = await api.get(`/shipping/tracking/${code}`);
    return response.data;
  },

  getTrackingByOrder: async (orderId: number) => {
    const response = await api.get(`/shipping/tracking/order/${orderId}`);
    return response.data;
  },
};

// ============================================
// ADDRESSES API
// ============================================

export const addressesAPI = {
  getAll: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  create: async (addressData: {
    label?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    reference?: string;
    isDefault?: boolean;
    recipientName?: string;
    phone?: string;
  }) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  update: async (id: number, addressData: {
    label?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    reference?: string;
    isDefault?: boolean;
    recipientName?: string;
    phone?: string;
  }) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  setDefault: async (id: number) => {
    const response = await api.post(`/addresses/${id}/set-default`);
    return response.data;
  },
};

// ============================================
// WISHLIST API
// ============================================

export const wishlistAPI = {
  getAll: async (limit?: number, offset?: number) => {
    const response = await api.get('/wishlist', { params: { limit, offset } });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/wishlist/stats');
    return response.data;
  },

  check: async (productId: number, variantId?: number) => {
    const response = await api.get(`/wishlist/check/${productId}`, {
      params: { variantId },
    });
    return response.data;
  },

  getByShareCode: async (shareCode: string) => {
    const response = await api.get(`/wishlist/share/${shareCode}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/wishlist/${id}`);
    return response.data;
  },

  add: async (data: {
    productId: number;
    variantId?: number;
    notes?: string;
    priority?: number;
    isPublic?: boolean;
  }) => {
    const response = await api.post('/wishlist', data);
    return response.data;
  },

  update: async (id: number, data: {
    notes?: string;
    priority?: number;
    isPublic?: boolean;
  }) => {
    const response = await api.put(`/wishlist/${id}`, data);
    return response.data;
  },

  moveToTop: async (id: number) => {
    const response = await api.post(`/wishlist/${id}/move-to-top`);
    return response.data;
  },

  remove: async (id: number) => {
    const response = await api.delete(`/wishlist/${id}`);
    return response.data;
  },

  removeMultiple: async (itemIds: number[]) => {
    const response = await api.post('/wishlist/remove-multiple', { itemIds });
    return response.data;
  },
};

// ============================================
// SETTINGS API
// ============================================

export const settingsAPI = {
  getLogo: async () => {
    const response = await api.get('/settings/logo');
    return response.data;
  },

  getFavicon: async () => {
    const response = await api.get('/settings/favicon');
    return response.data;
  },

  getHeroSlides: async () => {
    const response = await api.get('/settings/hero-slides');
    return response.data;
  },

  getTheme: async () => {
    const response = await api.get('/settings/theme');
    return response.data;
  },

  getBenefitCards: async () => {
    const response = await api.get('/settings/benefit-cards');
    return response.data;
  },
};

// ============================================
// PRODUCT IMAGES API
// ============================================

export const productImagesAPI = {
  getAll: async (productId: number) => {
    const response = await api.get(`/products/${productId}/images`);
    return response.data;
  },

  upload: async (productId: number, url: string, isPrimary?: boolean, order?: number) => {
    const response = await api.post(`/products/${productId}/images`, {
      url,
      isPrimary,
      order,
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

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getOrders: async (status?: string) => {
    const response = await api.get('/admin/orders', { params: { status } });
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.patch(`/admin/orders/${id}`, { status });
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id: number, productData: any) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  createCategory: async (categoryData: { name: string; slug: string; description?: string }) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id: number, categoryData: any) => {
    const response = await api.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  updateUser: async (id: number, userData: any) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getSalesReport: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await api.get('/admin/reports/sales', { params });
    return response.data;
  },

  exportSalesReportCSV: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await api.get('/admin/reports/sales/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  updateLogo: async (logo: string) => {
    const response = await api.put('/settings/logo', { logo });
    return response.data;
  },

  // Analytics API
  getAnalyticsOverview: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  getAnalyticsTrends: async (params?: { startDate?: string; endDate?: string; comparePeriod?: boolean }) => {
    const response = await api.get('/admin/analytics/trends', { params });
    return response.data;
  },
};

// ============================================
// TICKETS API
// ============================================

export const ticketsAPI = {
  getAll: async (params?: { status?: string; category?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: {
    subject: string;
    description: string;
    category: string;
    orderId?: number;
    priority?: string;
  }) => {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  update: async (id: number, data: {
    status?: string;
    priority?: string;
    assignedToId?: number | null;
    resolution?: string;
  }) => {
    const response = await api.patch(`/tickets/${id}`, data);
    return response.data;
  },

  // Admin routes
  getAllAdmin: async (params?: { status?: string; category?: string; assignedToId?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/tickets/admin/all', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/tickets/admin/stats');
    return response.data;
  },
};

// ============================================
// CHAT API
// ============================================

export const chatAPI = {
  getMessages: async (ticketId: number) => {
    const response = await api.get(`/chat/${ticketId}/messages`);
    return response.data;
  },

  sendMessage: async (ticketId: number, data: {
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    const response = await api.post(`/chat/${ticketId}/messages`, data);
    return response.data;
  },

  markAsRead: async (messageId: number) => {
    const response = await api.patch(`/chat/messages/${messageId}/read`);
    return response.data;
  },

  markAllAsRead: async (ticketId: number) => {
    const response = await api.patch(`/chat/${ticketId}/messages/read-all`);
    return response.data;
  },
};

// ============================================
// FAQ API
// ============================================

export const faqAPI = {
  getAll: async (params?: { category?: string; search?: string }) => {
    const response = await api.get('/faq', { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/faq/categories');
    return response.data;
  },

  submitFeedback: async (id: number, helpful: boolean) => {
    const response = await api.post(`/faq/${id}/feedback`, { helpful });
    return response.data;
  },

  // Admin routes
  getAllAdmin: async (params?: { category?: string; search?: string }) => {
    const response = await api.get('/faq/admin/all', { params });
    return response.data;
  },

  create: async (data: {
    question: string;
    answer: string;
    category: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post('/faq/admin', data);
    return response.data;
  },

  update: async (id: number, data: {
    question?: string;
    answer?: string;
    category?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/faq/admin/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/faq/admin/${id}`);
    return response.data;
  },
};

// Announcements API
export const announcementsAPI = {
  getAll: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },
};

export default api;
