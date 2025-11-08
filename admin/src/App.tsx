// App principal do Admin Panel
// Versão 2.0 - Aplicação separada

import { Route, Switch, useLocation } from 'wouter';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminStockPage } from './pages/AdminStockPage';
import { AdminShippingPage } from './pages/AdminShippingPage';
import { AdminTicketsPage } from './pages/AdminTicketsPage';
import { AdminContentPage } from './pages/AdminContentPage';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';

// Protected Route component
function ProtectedRoute({ component: Component, path }: { component: any; path: string }) {
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated or not admin

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return <Component />;
}

export default function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/">
            {() => (
              <ProtectedRoute
                path="/"
                component={() => (
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/dashboard">
            {() => (
              <ProtectedRoute
                path="/dashboard"
                component={() => (
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/products">
            {() => (
              <ProtectedRoute
                path="/products"
                component={() => (
                  <AdminLayout>
                    <AdminProductsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/orders">
            {() => (
              <ProtectedRoute
                path="/orders"
                component={() => (
                  <AdminLayout>
                    <AdminOrdersPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/payments">
            {() => (
              <ProtectedRoute
                path="/payments"
                component={() => (
                  <AdminLayout>
                    <AdminPaymentsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/stock">
            {() => (
              <ProtectedRoute
                path="/stock"
                component={() => (
                  <AdminLayout>
                    <AdminStockPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/shipping">
            {() => (
              <ProtectedRoute
                path="/shipping"
                component={() => (
                  <AdminLayout>
                    <AdminShippingPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/categories">
            {() => (
              <ProtectedRoute
                path="/categories"
                component={() => (
                  <AdminLayout>
                    <AdminCategoriesPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/users">
            {() => (
              <ProtectedRoute
                path="/users"
                component={() => (
                  <AdminLayout>
                    <AdminUsersPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/coupons">
            {() => (
              <ProtectedRoute
                path="/coupons"
                component={() => (
                  <AdminLayout>
                    <AdminCouponsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/reports">
            {() => (
              <ProtectedRoute
                path="/reports"
                component={() => (
                  <AdminLayout>
                    <AdminReportsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/analytics">
            {() => (
              <ProtectedRoute
                path="/analytics"
                component={() => (
                  <AdminLayout>
                    <AdminAnalyticsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/settings">
            {() => (
              <ProtectedRoute
                path="/settings"
                component={() => (
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/content">
            {() => (
              <ProtectedRoute
                path="/content"
                component={() => (
                  <AdminLayout>
                    <AdminContentPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route path="/tickets">
            {() => (
              <ProtectedRoute
                path="/tickets"
                component={() => (
                  <AdminLayout>
                    <AdminTicketsPage />
                  </AdminLayout>
                )}
              />
            )}
          </Route>
          <Route>
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="mb-4 text-4xl font-bold text-gray-800">404</h1>
                <p className="mb-8 text-gray-600">Página não encontrada</p>
                <a href="/" className="text-blue-600 hover:underline">Voltar ao dashboard</a>
              </div>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </div>
      </SearchProvider>
    </AuthProvider>
  );
}


