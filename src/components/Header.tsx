import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, LogOut, Heart, X, ChevronDown, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { NotificationDropdown } from './NotificationDropdown';
import { SearchBar } from './SearchBar';
import { settingsAPI, menusAPI } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu';

// Top Bar Promocional
function TopPromoBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    { 
      text: '🎉 Frete Grátis para compras acima de R$ 299', 
      bgColor: 'bg-emerald-600', 
      textColor: 'text-white',
      bgStyle: { backgroundColor: '#059669' }
    },
    { 
      text: '💳 Parcele em até 3x sem juros', 
      bgColor: 'bg-blue-600', 
      textColor: 'text-white',
      bgStyle: { backgroundColor: '#2563eb' }
    },
    { 
      text: '✨ Primeira troca grátis', 
      bgColor: 'bg-pink-600', 
      textColor: 'text-white',
      bgStyle: { backgroundColor: '#db2777' }
    },
    { 
      text: '🎁 Ganhe 10% de desconto na primeira compra', 
      bgColor: 'bg-purple-600', 
      textColor: 'text-white',
      bgStyle: { backgroundColor: '#9333ea' }
    },
  ];

  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, []);

  if (!isVisible) return null;

  const currentMsg = messages[currentMessage];

  return (
    <div 
      className={`${currentMsg.bgColor} ${currentMsg.textColor} py-2.5 px-4 relative z-50`}
      style={currentMsg.bgStyle}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-center">
        <p 
          className="text-sm font-bold text-center flex-1 animate-fade-in"
          style={{ color: '#ffffff' }}
        >
          {currentMsg.text}
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Fechar"
          style={{ color: '#ffffff' }}
        >
          <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
        </button>
      </div>
    </div>
  );
}

// Barra Superior de Contato
function ContactBar() {
  return (
    <div className="hidden lg:block bg-gray-900 text-gray-300 text-sm py-2">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-white transition-all duration-200 hover:translate-x-1">
              <Phone className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
              <span>(66) 99676-8065</span>
            </a>
            <a href="mailto:contato@loja.com" className="flex items-center gap-2 hover:text-white transition-all duration-200 hover:translate-x-1">
              <Mail className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
              <span>contato@loja.com</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>São Paulo, SP</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/faq" className="hover:text-white transition-all duration-200 hover:translate-x-1">Ajuda</a>
            <a href="/tracking" className="hover:text-white transition-all duration-200 hover:translate-x-1">Rastrear Pedido</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Menu de Navegação Inferior
function BottomNav() {
  const [, setLocation] = useLocation();
  const [menuItems, setMenuItems] = useState<Array<{
    label: string;
    href?: string;
    submenu?: Array<{ label: string; href: string }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        const menus = await menusAPI.getAll();
        
        // Transformar os menus do banco de dados no formato esperado
        const formattedMenus = menus.map((menu: any) => {
          if (menu.items && menu.items.length > 0) {
            // Menu com submenu
            return {
              label: menu.label,
              submenu: menu.items.map((item: any) => ({
                label: item.label,
                href: item.href,
              })),
            };
          } else {
            // Menu sem submenu (link direto)
            return {
              label: menu.label,
              href: menu.href || '#',
            };
          }
        });
        
        setMenuItems(formattedMenus);
      } catch (error) {
        console.error('Error loading menus:', error);
        // Fallback para menus padrão em caso de erro
        setMenuItems([
          { label: 'NOVIDADES', href: '/shop?new=true' },
          { label: '4 KIT BODY POR 169', href: '/shop?category=body&promo=true' },
          { label: '4 CONJUNTOS POR 139', href: '/shop?category=conjuntos&promo=true' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, []);

  if (loading) {
    return (
      <nav className="text-white py-3" style={{ backgroundColor: '#46D392' }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="text-sm font-semibold uppercase">Carregando...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="text-white py-3" style={{ backgroundColor: '#46D392' }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {menuItems.length === 0 ? (
            <div className="text-sm font-semibold uppercase">Nenhum menu configurado</div>
          ) : (
            menuItems.map((item, index) => (
              item.submenu ? (
                <DropdownMenu key={`${item.label}-${index}`}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm font-semibold uppercase hover:opacity-80 transition-all duration-200 flex items-center gap-1">
                      {item.label}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {item.submenu.map((subItem, subIndex) => (
                      <DropdownMenuItem
                        key={`${subItem.label}-${subIndex}`}
                        onClick={() => setLocation(subItem.href)}
                        className="cursor-pointer"
                      >
                        {subItem.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  key={`${item.label}-${index}`}
                  onClick={() => setLocation(item.href || '#')}
                  className="text-sm font-semibold uppercase hover:opacity-80 transition-all duration-200"
                >
                  {item.label}
                </button>
              )
            ))
          )}
        </div>
      </div>
    </nav>
  );
}


// Handler para busca no header
function HeaderSearchBar() {
  const [, setLocation] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(query)}`);
    } else {
      setLocation('/shop');
    }
  };

  // Escutar evento para focar na barra de busca (disparado pelo MobileTabBar)
  useEffect(() => {
    const handleFocusSearch = () => {
      // Aguardar um pouco para garantir que a página carregou
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // Scroll suave até a barra de busca em mobile
          if (window.innerWidth < 768) {
            searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 200);
    };

    window.addEventListener('focusSearchBar', handleFocusSearch);
    return () => {
      window.removeEventListener('focusSearchBar', handleFocusSearch);
    };
  }, []);

  return (
    <div className="w-full">
      <SearchBar onSearch={handleSearch} inputRef={searchInputRef} />
    </div>
  );
}

export function Header() {
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [logo, setLogo] = useState<string | null>(null);
  const [logoLink, setLogoLink] = useState<string>('/');
  const [logoSize, setLogoSize] = useState<string>('150px');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const data = await settingsAPI.getLogo();
        setLogo(data.logo);
        setLogoLink(data.logoLink || '/');
        setLogoSize(data.logoSize || '150px');
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  return (
    <>
      <TopPromoBar />
      
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-colors">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          {/* Logo Centralizada no Topo */}
          <div className="flex justify-center pb-0">
            <button
              onClick={() => {
                // Verificar se é link externo ou interno
                if (logoLink.startsWith('http://') || logoLink.startsWith('https://')) {
                  window.open(logoLink, '_blank');
                } else {
                  setLocation(logoLink);
                }
              }}
              className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  style={{ 
                    height: logoSize || '150px', 
                    width: 'auto', 
                    maxWidth: '500px' 
                  }}
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="flex h-28 w-28 md:h-40 md:w-40 items-center justify-center">
                    <Heart className="h-24 w-24 md:h-36 md:w-36 text-amber-700" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-2xl text-amber-700 font-normal">vestir com</span>
                    <span className="text-4xl md:text-5xl font-bold text-amber-600 leading-tight">amor</span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Barra de Busca com Ícones Laterais */}
          <div className="flex items-center justify-center gap-2 md:gap-4 pb-3 md:pb-4">
            {/* Barra de Busca - Central */}
            <div className="flex-1 max-w-2xl min-w-0">
              <HeaderSearchBar />
            </div>

            {/* Ícones à Direita da Barra de Busca */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Entre ou Cadastre-se / Usuário - Oculto no mobile */}
              <div className="hidden md:flex items-center">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-amber-700 p-1.5 md:p-2">
                        <User className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="hidden lg:inline text-xs md:text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                      <DropdownMenuItem onClick={() => setLocation('/profile')} className="text-gray-900 hover:bg-gray-100">
                        <User className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation('/orders')} className="text-gray-900 hover:bg-gray-100">
                        Meus Pedidos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation('/addresses')} className="text-gray-900 hover:bg-gray-100">
                        Endereços
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation('/wishlist')} className="text-gray-900 hover:bg-gray-100">
                        <Heart className="mr-2 h-4 w-4" />
                        Lista de Desejos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation('/tickets')} className="text-gray-900 hover:bg-gray-100">
                        Suporte
                      </DropdownMenuItem>
                      {user?.isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => window.open('http://localhost:3001', '_blank')} className="text-gray-900 hover:bg-gray-100">
                            Painel Admin
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-gray-900 hover:bg-gray-100">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => setLocation('/login')}
                    variant="ghost"
                    className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-amber-700 p-1.5 md:p-2"
                  >
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline text-xs md:text-sm font-medium">Entre ou Cadastre-se</span>
                    <span className="sm:hidden text-xs md:text-sm font-medium">Entrar</span>
                  </Button>
                )}
              </div>

              {/* Notificações - Sempre visível */}
              {isAuthenticated && <NotificationDropdown />}

              {/* Carrinho - Oculto no mobile */}
              <div className="hidden md:block relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/cart')}
                  className="text-amber-700 hover:text-amber-800 h-8 w-8 md:h-10 md:w-10"
                >
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                {totalItems > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-md -translate-y-1/2 translate-x-1/2">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu de Navegação Inferior */}
        <div style={{ paddingTop: '12px' }}>
          <BottomNav />
        </div>
      </header>
    </>
  );
}
