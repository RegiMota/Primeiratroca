import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CustomThemeProvider } from "./components/CustomThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import { ShopPage } from "./pages/ShopPage";
import { CartPage } from "./pages/CartPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OrdersPage } from "./pages/OrdersPage";
import { FAQPage } from "./pages/FAQPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AddressesPage } from "./pages/AddressesPage";
import { WishlistPage } from "./pages/WishlistPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { CompareProductsPage } from "./pages/CompareProductsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { CheckoutFailurePage } from "./pages/CheckoutFailurePage";
import { CheckoutPendingPage } from "./pages/CheckoutPendingPage";
import { PaymentPage } from "./pages/PaymentPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";
import { ExchangeReturnPolicyPage } from "./pages/ExchangeReturnPolicyPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/login"} component={LoginPage} />
        <Route path={"/register"} component={RegisterPage} />
        <Route path={"/forgot-password"} component={ForgotPasswordPage} />
        <Route path={"/reset-password"} component={ResetPasswordPage} />
        <Route path={"/shop"} component={ShopPage} />
        <Route path={"/product/:id"} component={ProductDetailPage} />
        <Route path={"/cart"} component={CartPage} />
        <Route path={"/checkout/success"} component={CheckoutSuccessPage} />
        <Route path={"/checkout/failure"} component={CheckoutFailurePage} />
        <Route path={"/checkout/pending"} component={CheckoutPendingPage} />
        <Route path={"/payment/:paymentId"} component={PaymentPage} />
        <Route path={"/checkout"} component={CheckoutPage} />
        <Route path={"/profile"} component={ProfilePage} />
        <Route path={"/orders"} component={OrdersPage} />
        <Route path={"/addresses"} component={AddressesPage} />
        <Route path={"/wishlist"} component={WishlistPage} />
        <Route path={"/compare"} component={CompareProductsPage} />
        <Route path={"/faq"} component={FAQPage} />
        <Route path={"/tickets/:id"} component={TicketDetailPage} />
        <Route path={"/tickets"} component={TicketsPage} />
        <Route path={"/about"} component={AboutPage} />
        <Route path={"/privacy-policy"} component={PrivacyPolicyPage} />
        <Route path={"/terms-of-use"} component={TermsOfUsePage} />
        <Route path={"/exchange-return-policy"} component={ExchangeReturnPolicyPage} />
        <Route path={"/admin/orders"} component={AdminOrdersPage} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <CustomThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
