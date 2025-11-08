# 📋 Análise de Arquitetura - Versão 2.0
## Primeira Troca - Documentação Técnica Atual e Mudanças

**Data**: Janeiro 2025  
**Versão Atual**: 1.2.0 (100% Completa)  
**Versão Alvo**: 2.0.0  
**Status**: 🔄 Em Análise

---

## 📊 Arquitetura Atual (v1.2)

### Backend (Server)

**Estrutura de Rotas:**
```
server/
├── index.ts              # Servidor Express principal
├── middleware/
│   └── auth.ts           # Middleware de autenticação JWT
├── routes/
│   ├── auth.ts           # Autenticação
│   ├── products.ts       # Produtos
│   ├── categories.ts     # Categorias
│   ├── orders.ts         # Pedidos
│   ├── admin.ts          # Admin (dashboard, users, reports)
│   ├── reviews.ts        # Avaliações
│   ├── productImages.ts  # Imagens de produtos (v1.2)
│   ├── coupons.ts        # Cupons (v1.2)
│   └── notifications.ts  # Notificações (v1.2)
├── services/
│   ├── EmailService.ts  # Emails (v1.2 - SendGrid)
│   ├── NotificationService.ts # Notificações (v1.2)
│   └── ImageService.ts  # Upload de imagens (v1.2 - Cloudinary)
└── socket.ts            # Socket.io (v1.2)
```

### Frontend (React)

**Estrutura Atual:**
```
src/
├── components/           # Componentes reutilizáveis
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── FilterSidebar.tsx
│   ├── SearchBar.tsx
│   ├── NotificationDropdown.tsx # (v1.2)
│   ├── ImageUploader.tsx # (v1.2)
│   ├── ImageGallery.tsx # (v1.2)
│   ├── CouponInput.tsx # (v1.2)
│   ├── AnalyticsOverview.tsx # (v1.2)
│   └── ui/              # Componentes Shadcn UI
├── pages/               # Páginas da aplicação
│   ├── HomePage.tsx
│   ├── ShopPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrdersPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx # (v1.2)
│   ├── ResetPasswordPage.tsx # (v1.2)
│   └── Admin*.tsx       # Páginas do admin
├── contexts/            # Contextos React
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── NotificationContext.tsx # (v1.2)
└── lib/                 # Utilitários
    ├── api.ts
    └── validation.ts
```

---

## 🔄 Mudanças Arquiteturais na Versão 2.0

### 1. Separação do Painel Administrativo 🔐

**Nova Estrutura:**

```
projeto/
├── client/              # Aplicação principal (loja)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── admin/               # Aplicação admin separada (NOVO)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
└── server/             # Backend compartilhado
    └── routes/
        ├── api/        # Rotas públicas e de cliente
        └── admin/      # Rotas admin isoladas
```

**Mudanças:**
- ✅ Aplicação React separada para admin
- ✅ URL dedicada (`admin.primeiratroca.com.br` ou `/admin`)
- ✅ Build separado do admin
- ✅ Autenticação independente
- ✅ Rotas backend isoladas (`/api/admin/*`)

**Benefícios:**
- ✅ Maior segurança (isolamento)
- ✅ URLs diferentes dificultam bots
- ✅ Possibilidade de IP whitelist
- ✅ Monitoramento específico

---

### 2. Novas Rotas Backend

#### Rotas de Pagamento (`/api/payments/*`)
```
POST   /api/payments/create           # Criar pagamento
GET    /api/payments/:id              # Obter pagamento
POST   /api/payments/:id/refund      # Reembolso (admin)
GET    /api/admin/payments            # Lista de transações (admin)
GET    /api/admin/payments/:id        # Detalhes da transação (admin)
POST   /api/webhooks/payments         # Webhook do gateway
```

#### Rotas de Estoque (`/api/products/:id/variants/*`)
```
GET    /api/products/:id/variants           # Listar variações
POST   /api/products/:id/variants           # Criar variação (admin)
PUT    /api/products/:id/variants/:variantId # Atualizar (admin)
DELETE /api/products/:id/variants/:variantId # Deletar (admin)
GET    /api/admin/stock-movements          # Histórico de movimentações (admin)
GET    /api/admin/stock-alerts             # Alertas de estoque baixo (admin)
```

#### Rotas de Frete (`/api/shipping/*`)
```
POST   /api/shipping/calculate             # Calcular frete
GET    /api/shipping/tracking/:code        # Rastrear pedido
GET    /api/orders/:id/tracking            # Rastreamento do pedido
```

#### Rotas de Endereços (`/api/users/addresses/*`)
```
GET    /api/users/addresses                # Listar endereços do usuário
POST   /api/users/addresses                 # Adicionar endereço
PUT    /api/users/addresses/:id             # Atualizar endereço
DELETE /api/users/addresses/:id             # Deletar endereço
PATCH  /api/users/addresses/:id/set-default # Definir como padrão
```

#### Rotas de Wishlist (`/api/wishlist/*`)
```
GET    /api/wishlist                       # Listar wishlist do usuário
POST   /api/wishlist                       # Adicionar à wishlist
DELETE /api/wishlist/:id                   # Remover da wishlist
GET    /api/wishlist/share/:code            # Wishlist compartilhada (público)
POST   /api/wishlist/:id/share             # Gerar link de compartilhamento
POST   /api/wishlist/:id/compare            # Comparar produtos
```

#### Rotas de Chat/Suporte (`/api/tickets/*`)
```
GET    /api/tickets                        # Listar tickets do usuário
POST   /api/tickets                        # Criar ticket
GET    /api/tickets/:id                    # Detalhes do ticket
POST   /api/tickets/:id/messages           # Enviar mensagem
GET    /api/tickets/:id/messages           # Obter mensagens
GET    /api/admin/tickets                  # Listar todos os tickets (admin)
PATCH  /api/admin/tickets/:id/assign       # Atribuir ticket (admin)
PATCH  /api/admin/tickets/:id/status        # Atualizar status (admin)
```

#### Rotas de FAQ (`/api/faq/*`)
```
GET    /api/faq                            # Listar FAQ (público)
GET    /api/faq/search                      # Buscar no FAQ
POST   /api/admin/faq                      # Criar FAQ (admin)
PUT    /api/admin/faq/:id                  # Atualizar FAQ (admin)
DELETE /api/admin/faq/:id                  # Deletar FAQ (admin)
```

#### Rotas de Auditoria (`/api/admin/audit-logs/*`)
```
GET    /api/admin/audit-logs                # Listar logs (admin)
GET    /api/admin/audit-logs/:id            # Detalhes do log (admin)
GET    /api/admin/audit-logs/resource/:type/:id # Logs de um recurso (admin)
```

---

### 3. Novos Serviços

#### PaymentService.ts
```typescript
class PaymentService {
  static async createPayment(orderId: number, paymentData: PaymentData)
  static async processPayment(paymentId: number)
  static async refundPayment(paymentId: number, amount?: number)
  static async handleWebhook(webhookData: any)
  static async getPaymentStatus(paymentId: number)
}
```

#### ShippingService.ts
```typescript
class ShippingService {
  static async calculateShipping(address: Address, items: OrderItem[])
  static async createTracking(orderId: number, carrier: string, code: string)
  static async updateTrackingStatus(trackingId: number)
  static async getTrackingEvents(trackingCode: string)
}
```

#### StockService.ts
```typescript
class StockService {
  static async reserveStock(variantId: number, quantity: number)
  static async releaseStock(reservationId: number)
  static async checkLowStock()
  static async recordMovement(variantId: number, type: string, quantity: number)
}
```

#### AuditService.ts
```typescript
class AuditService {
  static async logAction(userId: number, action: string, resource: string, resourceId: number, changes?: any)
  static async getLogs(filters: AuditFilters)
  static async getResourceHistory(resource: string, resourceId: number)
}
```

---

### 4. Novos Componentes Frontend

#### Componentes de Pagamento
- `PaymentMethodSelector.tsx` - Seleção de método de pagamento
- `CreditCardForm.tsx` - Formulário de cartão
- `PIXPayment.tsx` - Interface PIX
- `BoletoPayment.tsx` - Interface boleto
- `InstallmentsSelector.tsx` - Seleção de parcelas
- `PaymentDashboard.tsx` - Dashboard de transações (admin)

#### Componentes de Estoque
- `VariantManager.tsx` - Gerenciar variações (admin)
- `StockAlert.tsx` - Alertas de estoque baixo (admin)
- `StockHistory.tsx` - Histórico de movimentações (admin)
- `VariantSelector.tsx` - Seleção de variação no produto

#### Componentes de Frete
- `ShippingCalculator.tsx` - Calculadora de frete
- `AddressManager.tsx` - Gerenciar endereços
- `TrackingView.tsx` - Visualização de rastreamento
- `ShippingMethods.tsx` - Seleção de método de entrega

#### Componentes de Wishlist
- `WishlistPage.tsx` - Página da wishlist
- `WishlistButton.tsx` - Botão de favoritar
- `ProductComparison.tsx` - Comparação de produtos
- `WishlistShare.tsx` - Compartilhamento

#### Componentes de Chat/Suporte
- `ChatWidget.tsx` - Widget de chat
- `TicketList.tsx` - Lista de tickets
- `TicketDetail.tsx` - Detalhes do ticket
- `ChatMessage.tsx` - Mensagem do chat
- `FAQPage.tsx` - Página de FAQ
- `FAQSearch.tsx` - Busca no FAQ

#### Componentes de Temas
- `ThemeSelector.tsx` - Seletor de tema
- `ThemeCustomizer.tsx` - Personalizador de tema (admin)
- `ThemePreview.tsx` - Preview de tema

#### Componentes de Segurança
- `TwoFactorAuth.tsx` - Configuração de 2FA
- `TOTPInput.tsx` - Input para código TOTP
- `AuditLogViewer.tsx` - Visualizador de logs (admin)

---

### 5. Novas Páginas Frontend

#### Cliente
- `WishlistPage.tsx` - Lista de desejos
- `TrackingPage.tsx` - Rastreamento de pedido
- `TicketsPage.tsx` - Meus tickets
- `TicketDetailPage.tsx` - Detalhes do ticket
- `FAQPage.tsx` - FAQ

#### Admin (aplicação separada)
- `AdminPaymentsPage.tsx` - Transações
- `AdminStockPage.tsx` - Gerenciamento de estoque
- `AdminShippingPage.tsx` - Entregas
- `AdminTicketsPage.tsx` - Gerenciamento de tickets
- `AdminFAQPage.tsx` - Gerenciamento de FAQ
- `AdminAuditLogsPage.tsx` - Logs de auditoria
- `AdminThemesPage.tsx` - Gerenciamento de temas

---

### 6. Jobs Agendados

#### Configuração (node-cron)

```typescript
// Jobs agendados
- Verificar estoque baixo (diário às 9h)
- Liberar estoque reservado (a cada 15 minutos)
- Atualizar rastreamento de pedidos (a cada hora)
- Verificar promoções em itens da wishlist (diário às 10h)
- Limpar logs antigos (semanal)
```

---

## 🔐 Segurança e Validações

### Rotas Admin Isoladas

**Proteção Adicional:**
- ✅ Middleware `requireAdmin` obrigatório
- ✅ Validação de IP whitelist (opcional)
- ✅ Rate limiting específico para rotas admin
- ✅ Logs de auditoria para todas as ações admin
- ✅ 2FA obrigatório para operações críticas

### Validações de Pagamento

- ✅ Validação de CVV não armazenado
- ✅ Validação de dados do cartão
- ✅ Validação de webhook (assinatura)
- ✅ Prevenção de pagamento duplicado
- ✅ Validação de valor mínimo/máximo

### Validações de Estoque

- ✅ Verificar disponibilidade antes de reservar
- ✅ Timeout de reserva (15-30min)
- ✅ Validação de quantidade disponível
- ✅ Prevenção de estoque negativo

---

## 📦 Estrutura de Dados

### Relações Principais

```
User
├── addresses (UserAddress[])
├── wishlistItems (WishlistItem[])
├── tickets (Ticket[])
└── auditLogs (AuditLog[])

Product
├── variants (ProductVariant[])
└── wishlistItems (WishlistItem[])

Order
├── payment (Payment?)
├── payments (Payment[])
├── shippingTracking (ShippingTracking?)
└── ticket (Ticket?)

ProductVariant
├── stockMovements (StockMovement[])
└── wishlistItems (WishlistItem[])

Ticket
└── messages (ChatMessage[])
```

---

## 🚀 Deploy e Infraestrutura

### Estrutura de Deploy

```
Produção:
├── Site Principal (client/)
│   └── https://primeiratroca.com.br
├── Admin (admin/)
│   └── https://admin.primeiratroca.com.br (ou /admin)
└── API (server/)
    └── https://api.primeiratroca.com.br (ou mesma instância)
```

### Nginx Configuration (Exemplo)

```nginx
# Site Principal
server {
    server_name primeiratroca.com.br;
    root /var/www/client/dist;
    # ...
}

# Admin (Subdomínio)
server {
    server_name admin.primeiratroca.com.br;
    root /var/www/admin/dist;
    # IP whitelist opcional
    # allow 192.168.1.0/24;
    # deny all;
}
```

---

## 📊 Performance e Otimizações

### Backend
- ✅ Cache de cálculos de frete (Redis opcional)
- ✅ Processamento assíncrono de pagamentos (Bull/BullMQ)
- ✅ Índices otimizados no banco de dados
- ✅ Rate limiting para prevenir abuso

### Frontend
- ✅ Lazy loading de componentes pesados
- ✅ Code splitting por rota
- ✅ Cache de dados estáticos
- ✅ Otimização de imagens (já implementado com Cloudinary)

---

## 🔄 Compatibilidade Backward

### Migração de Dados v1.2 → v2.0

**Dados Mantidos:**
- ✅ Todos os produtos existentes
- ✅ Todos os pedidos existentes
- ✅ Todos os usuários existentes
- ✅ Todas as avaliações

**Novos Dados:**
- ✅ Variações criadas a partir de `Product.stock` (se houver)
- ✅ Endereços migrados de `Order.shippingAddress` (string) para `UserAddress`
- ✅ Logs de auditoria iniciados do zero

**Backward Compatibility:**
- ✅ APIs antigas continuam funcionando
- ✅ Novas rotas adicionadas sem quebrar existentes
- ✅ Campos opcionais não quebram código antigo

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Análise Completa

