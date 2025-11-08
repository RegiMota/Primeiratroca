// AdminLayout - Layout principal do painel admin
// Versão 2.0 - Separado do site principal

import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Tag,
  Users,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Warehouse,
  Truck,
  MessageSquare,
  Image,
} from 'lucide-react';
import { Button } from './ui/button';
import { AdminSearchBar } from './AdminSearchBar';
import { useSearch } from '../contexts/SearchContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Produtos', path: '/products' },
    { icon: Warehouse, label: 'Estoque', path: '/stock' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/orders' },
    { icon: CreditCard, label: 'Pagamentos', path: '/payments' },
    { icon: Truck, label: 'Entregas', path: '/shipping' },
    { icon: MessageSquare, label: 'Tickets', path: '/tickets' },
    { icon: Tag, label: 'Categorias', path: '/categories' },
    { icon: Tag, label: 'Cupons', path: '/coupons' },
    { icon: Users, label: 'Usuários', path: '/users' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Relatórios', path: '/reports' },
    { icon: Image, label: 'Conteúdo', path: '/content' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:right-auto lg:translate-x-0 lg:z-0`}
        style={{ width: '256px' }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || location.startsWith(item.path + '/');
              
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="mb-2 px-2 text-sm text-gray-600">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div 
        className="flex flex-1 flex-col overflow-hidden"
        style={{ marginLeft: isDesktop ? '256px' : '0' }}
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b bg-white px-6 py-4 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {menuItems.find((item) => location === item.path || location.startsWith(item.path + '/'))?.label || 'Dashboard'}
            </h2>
            <div className="hidden md:flex flex-1 max-w-md">
              <AdminSearchBar
                placeholder="Buscar em todas as páginas..."
                className="w-full"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <AdminSearchBar
                placeholder="Buscar..."
                className="w-48"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


