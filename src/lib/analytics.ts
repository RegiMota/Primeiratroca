// Analytics Service - Rastreamento de eventos
// Versão 2.0 - Módulo 7: Analytics Avançado

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Inicializar Google Analytics 4
export function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('[Analytics] Google Analytics não configurado (VITE_GA_MEASUREMENT_ID não definido)');
    return;
  }

  // Carregar script do Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Configurar gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  console.log('[Analytics] Google Analytics 4 inicializado');
}

// Rastrear visualização de página
export function trackPageView(path: string, title?: string) {
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
}

// Rastrear eventos customizados
export function trackEvent(
  eventName: string,
  eventParams?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// Eventos de e-commerce pré-definidos
export const AnalyticsEvents = {
  // Visualização de produto
  viewProduct: (productId: string, productName: string, category?: string, price?: number) => {
    trackEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category,
      value: price,
      currency: 'BRL',
    });
  },

  // Adicionar ao carrinho
  addToCart: (productId: string, productName: string, quantity: number, price?: number) => {
    trackEvent('add_to_cart', {
      currency: 'BRL',
      value: price ? price * quantity : undefined,
      items: [
        {
          item_id: productId,
          item_name: productName,
          quantity,
          price,
        },
      ],
    });
  },

  // Remover do carrinho
  removeFromCart: (productId: string, productName: string, quantity: number) => {
    trackEvent('remove_from_cart', {
      currency: 'BRL',
      items: [
        {
          item_id: productId,
          item_name: productName,
          quantity,
        },
      ],
    });
  },

  // Iniciar checkout
  beginCheckout: (value: number, items: any[]) => {
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value,
      items: items.map((item) => ({
        item_id: item.productId || item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  },

  // Compra concluída
  purchase: (transactionId: string, value: number, items: any[], coupon?: string) => {
    trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency: 'BRL',
      coupon,
      items: items.map((item) => ({
        item_id: item.productId || item.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  },

  // Busca
  search: (searchTerm: string) => {
    trackEvent('search', {
      search_term: searchTerm,
    });
  },

  // Adicionar à wishlist
  addToWishlist: (productId: string, productName: string) => {
    trackEvent('add_to_wishlist', {
      currency: 'BRL',
      items: [
        {
          item_id: productId,
          item_name: productName,
        },
      ],
    });
  },

  // Visualizar categoria
  viewCategory: (categoryName: string) => {
    trackEvent('view_item_list', {
      item_list_name: categoryName,
    });
  },

  // Selecionar conteúdo
  selectContent: (contentType: string, contentId: string) => {
    trackEvent('select_content', {
      content_type: contentType,
      content_id: contentId,
    });
  },
};

