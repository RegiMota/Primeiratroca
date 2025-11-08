import { Menu, X, Home, ShoppingBag, Package, User, LogIn, UserPlus, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleNavigate = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sky-500"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-64 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <span className="text-sky-500" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  Menu
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigate('/')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-semibold">Início</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/shop?gender=girls')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-semibold">Meninas</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/shop?gender=boys')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-semibold">Meninos</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/shop?outlet=true')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-semibold">Outlet</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/shop?new=true')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-semibold">Lançamentos</span>
                  </button>

                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => handleNavigate('/orders')}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                      >
                        <Package className="h-5 w-5" />
                        <span className="font-semibold">Meus Pedidos</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('/tickets')}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                      >
                        <Package className="h-5 w-5" />
                        <span className="font-semibold">Suporte</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleNavigate('/faq')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                  >
                    <Package className="h-5 w-5" />
                    <span className="font-semibold">FAQ</span>
                  </button>

                  {user?.isAdmin && (
                    <button
                      onClick={() => handleNavigate('/admin')}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-sky-50 hover:text-sky-500"
                    >
                      <Shield className="h-5 w-5" />
                      <span style={{ fontWeight: 600 }}>Painel Administrativo</span>
                    </button>
                  )}
                </div>
              </nav>

              {/* Auth Section */}
              <div className="border-t p-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-sky-50 p-3">
                      <div className="flex items-center gap-2 text-sky-600">
                        <User className="h-5 w-5" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {user?.name}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50"
                      style={{ fontWeight: 600 }}
                    >
                      Sair
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleNavigate('/login')}
                      className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                      style={{ fontWeight: 700 }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </Button>
                    <Button
                      onClick={() => handleNavigate('/register')}
                      variant="outline"
                      className="w-full rounded-full border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
                      style={{ fontWeight: 700 }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
