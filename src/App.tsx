import { Route, Switch } from 'wouter';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingElements } from './components/FloatingElements';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { CheckoutFailurePage } from './pages/CheckoutFailurePage';
import { CheckoutPendingPage } from './pages/CheckoutPendingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OrdersPage } from './pages/OrdersPage';
import { TrackingPage } from './pages/TrackingPage';
import { AddressesPage } from './pages/AddressesPage';
import { WishlistPage } from './pages/WishlistPage';
import { CompareProductsPage } from './pages/CompareProductsPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { FAQPage } from './pages/FAQPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfUsePage } from './pages/TermsOfUsePage';
// Admin removido - agora em aplicação separada (admin/)
// Para acessar admin: http://localhost:3001 (desenvolvimento)

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white transition-colors overflow-x-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
      {/* Main content - layout limpo */}
      <div className="relative mx-auto w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <Header />
        <main className="min-h-[60vh]" style={{ maxWidth: '100%', overflowX: 'hidden' }}>{children}</main>
        <Footer />
      </div>
      
      {/* Elementos Flutuantes */}
      <FloatingElements />
      
      <Toaster />
    </div>
  );
}

// Handler global para suprimir erros conhecidos do React Strict Mode com portais
if (typeof window !== 'undefined') {
  const originalError = window.console.error;
  window.console.error = (...args: any[]) => {
    // Suprimir erros conhecidos do React Strict Mode com portais do Radix UI
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes('Failed to execute \'removeChild\'') ||
      errorMessage.includes('removeChildFromContainer') ||
      (errorMessage.includes('NotFoundError') && errorMessage.includes('removeChild'))
    ) {
      // Suprimir silenciosamente - este é um bug conhecido do React Strict Mode com portais
      return;
    }
    originalError.apply(window.console, args);
  };
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <AppLayout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/shop" component={ShopPage} />
              <Route path="/product/:id" component={ProductDetailPage} />
              <Route path="/cart" component={CartPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/checkout/success" component={CheckoutSuccessPage} />
              <Route path="/checkout/failure" component={CheckoutFailurePage} />
              <Route path="/checkout/pending" component={CheckoutPendingPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/forgot-password" component={ForgotPasswordPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/tracking" component={TrackingPage} />
              <Route path="/addresses" component={AddressesPage} />
              <Route path="/wishlist" component={WishlistPage} />
              <Route path="/compare" component={CompareProductsPage} />
              <Route path="/tickets" component={TicketsPage} />
              <Route path="/tickets/:id" component={TicketDetailPage} />
              <Route path="/faq" component={FAQPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/privacy-policy" component={PrivacyPolicyPage} />
              <Route path="/terms-of-use" component={TermsOfUsePage} />
              {/* Admin routes removidas - admin agora é aplicação separada */}
              {/* Acesse: http://localhost:3001 para admin */}
              <Route>
                <div className="mx-auto max-w-7xl px-6 py-12 text-center">
                  <h1 className="mb-4 text-sky-500" style={{ fontSize: '3rem', fontWeight: 900 }}>
                    404
                  </h1>
                  <p className="mb-8 text-gray-600" style={{ fontSize: '1.25rem' }}>
                    Oops! Page not found
                  </p>
                  <a href="/" className="text-sky-500 hover:underline" style={{ fontWeight: 700 }}>
                    Go back home
                  </a>
                </div>
              </Route>
            </Switch>
          </AppLayout>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
