import { Home, ShoppingBag, ShoppingCart, User, Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface TabItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  isActive?: (path: string) => boolean;
}

export function MobileTabBar() {
  const [location, setLocation] = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  const tabs: TabItem[] = [
    {
      id: 'home',
      icon: Home,
      label: 'Início',
      path: '/',
      isActive: (path) => path === '/' || path === '',
    },
    {
      id: 'shop',
      icon: ShoppingBag,
      label: 'Loja',
      path: '/shop',
      isActive: (path) => {
        // Ativo se estiver em /shop ou /product, mas não se tiver search na URL
        return (path.startsWith('/shop') || path.startsWith('/product')) && !path.includes('search');
      },
    },
    {
      id: 'search',
      icon: Search,
      label: 'Buscar',
      path: '/shop',
      isActive: (path) => {
        // Ativo se a URL contiver 'search' ou se estiver na página de busca
        return path.includes('search') || path.includes('?search=');
      },
    },
    {
      id: 'cart',
      icon: ShoppingCart,
      label: 'Carrinho',
      path: '/cart',
      isActive: (path) => path === '/cart' || path.startsWith('/cart'),
    },
    {
      id: 'profile',
      icon: User,
      label: 'Perfil',
      path: isAuthenticated ? '/profile' : '/login',
      isActive: (path) => 
        path === '/profile' || 
        path === '/orders' || 
        path === '/addresses' || 
        path === '/wishlist' ||
        path === '/tickets' ||
        path === '/login' ||
        path === '/register' ||
        path === '/forgot-password' ||
        path === '/reset-password',
    },
  ];

  // Encontrar o tab ativo
  const activeTab = tabs.find(tab => {
    if (tab.isActive) {
      return tab.isActive(location);
    }
    return location === tab.path;
  }) || tabs[0];

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab.id);

  const handleTabClick = (tab: TabItem) => {
    if (tab.id === 'search') {
      // Para busca, navegar para /shop e disparar evento para focar na barra de busca
      setLocation('/shop');
      // Disparar evento customizado para focar na busca após navegação
      setTimeout(() => {
        const focusEvent = new CustomEvent('focusSearchBar');
        window.dispatchEvent(focusEvent);
      }, 100);
    } else {
      setLocation(tab.path);
    }
  };

  // Calcular posição da onda baseada no índice ativo
  const tabWidth = 100 / tabs.length; // Porcentagem de largura por tab
  const waveCenter = (activeIndex + 0.5) * tabWidth; // Centro do tab ativo em porcentagem

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden" 
      style={{ 
        width: '100vw', 
        maxWidth: '100%',
        left: 0,
        right: 0,
        margin: 0,
        padding: 0
      }}
    >
      {/* Background verde */}
      <div 
        className="relative h-20" 
        style={{ 
          width: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: '#46D392'
        }}
      >
        {/* Barra branca com cantos arredondados e notch */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 bg-white shadow-2xl" 
          style={{ 
            width: '100%',
            margin: 0,
            padding: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem'
          }}
        >
          {/* Onda SVG para criar o efeito de notch acima do tab ativo */}
          <svg
            className="absolute -top-8 left-0 w-full h-16 pointer-events-none"
            viewBox="0 0 100 16"
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
          >
            <path
              d={`M 0 16 L ${Math.max(0, waveCenter - 12)} 16 Q ${waveCenter - 6} 16 ${waveCenter - 3} 13 Q ${waveCenter} 8 ${waveCenter + 3} 13 Q ${waveCenter + 6} 16 ${Math.min(100, waveCenter + 12)} 16 L 100 16 L 100 0 L 0 0 Z`}
              fill="white"
            />
          </svg>

          {/* Ponto branco no topo da onda */}
          <div
            className="absolute -top-1.5 w-2.5 h-2.5 bg-white rounded-full transform -translate-x-1/2 transition-all duration-300"
            style={{ left: `${waveCenter}%`, zIndex: 2 }}
          />
          <div className="relative flex items-center justify-around h-full px-1 z-10">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab.id;
              const isCartTab = tab.id === 'cart';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                >
                  {/* Ícone */}
                  <div className="relative">
                    {isCartTab && totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                    <Icon
                      className={`h-6 w-6 transition-all duration-300 ${
                        isActive ? 'text-emerald-500' : 'text-gray-400'
                      }`}
                      style={isActive ? { color: '#46D392' } : undefined}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] mt-0.5 transition-all duration-300 ${
                      isActive
                        ? 'font-semibold'
                        : 'text-gray-500 font-normal'
                    }`}
                    style={isActive ? { color: '#46D392' } : undefined}
                  >
                    {tab.label}
                  </span>

                  {/* Indicador circular no ícone ativo */}
                  {isActive && (
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full -z-10 opacity-30" 
                      style={{ backgroundColor: '#46D392' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

