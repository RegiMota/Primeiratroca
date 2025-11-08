# 📋 Análise de Arquitetura - Versão 1.2
## Primeira Troca - Documentação Técnica Atual

**Data**: Janeiro 2025  
**Versão Atual**: 1.0.0  
**Versão Alvo**: 1.2.0  
**Status**: 🔄 Em Análise

---

## 📊 Arquitetura Atual

### Backend (Server)

**Estrutura de Rotas:**
```
server/
├── index.ts              # Servidor Express principal
├── middleware/
│   └── auth.ts           # Middleware de autenticação JWT
└── routes/
    ├── auth.ts           # Autenticação (login, register)
    ├── products.ts       # Produtos (CRUD)
    ├── categories.ts     # Categorias (CRUD)
    ├── orders.ts         # Pedidos (CRUD)
    ├── admin.ts          # Admin (dashboard, users, reports)
    ├── cart.ts           # Carrinho
    ├── reviews.ts        # Avaliações
    └── settings.ts        # Configurações (logo)
```

**APIs Disponíveis:**

| Rota | Método | Descrição | Auth |
|------|--------|-----------|------|
| `/api/auth/login` | POST | Login de usuário | ❌ |
| `/api/auth/register` | POST | Registro de usuário | ❌ |
| `/api/auth/me` | GET | Obter usuário atual | ✅ |
| `/api/products` | GET | Listar produtos | ❌ |
| `/api/products/:id` | GET | Detalhes do produto | ❌ |
| `/api/categories` | GET | Listar categorias | ❌ |
| `/api/orders` | GET | Listar pedidos do usuário | ✅ |
| `/api/orders` | POST | Criar pedido | ✅ |
| `/api/admin/dashboard` | GET | Dashboard stats | ✅ Admin |
| `/api/admin/products` | * | CRUD de produtos | ✅ Admin |
| `/api/admin/orders` | * | Gerenciar pedidos | ✅ Admin |
| `/api/admin/users` | * | Gerenciar usuários | ✅ Admin |
| `/api/admin/reports` | * | Relatórios de vendas | ✅ Admin |
| `/api/reviews` | GET | Listar avaliações | ❌ |
| `/api/reviews` | POST | Criar avaliação | ✅ |
| `/api/settings/logo` | GET | Obter logo | ❌ |
| `/api/settings/logo` | PUT | Atualizar logo | ✅ Admin |

### Frontend (React)

**Estrutura de Componentes:**
```
src/
├── components/           # Componentes reutilizáveis
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── FilterSidebar.tsx
│   ├── SearchBar.tsx
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
│   └── Admin*.tsx       # Páginas do admin
├── contexts/            # Contextos React
│   ├── AuthContext.tsx
│   └── CartContext.tsx
└── lib/                 # Utilitários
    ├── api.ts
    ├── errorHandler.ts
    └── validation.ts
```

### Banco de Dados (MySQL/Prisma)

**Modelos Atuais:**
- `User` - Usuários (clientes e admins)
- `Category` - Categorias de produtos
- `Product` - Produtos
- `Order` - Pedidos
- `OrderItem` - Itens dos pedidos
- `Review` - Avaliações de produtos
- `Settings` - Configurações do site (logo)

**Relacionamentos:**
- User → Orders (1:N)
- User → Reviews (1:N)
- Category → Products (1:N)
- Product → OrderItems (1:N)
- Product → Reviews (1:N)
- Order → OrderItems (1:N)

---

## 🔄 Mudanças Necessárias para V1.2

### Novos Modelos do Banco de Dados

#### 1. ProductImage
```prisma
model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   @db.Text
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("product_images")
}
```

#### 2. Coupon
```prisma
model Coupon {
  id           Int      @id @default(autoincrement())
  code         String   @unique @db.VarChar(50)
  discountType String   @db.VarChar(20) // 'percentage' | 'fixed'
  discountValue Decimal  @db.Decimal(10, 2)
  minPurchase   Decimal? @db.Decimal(10, 2)
  maxDiscount  Decimal? @db.Decimal(10, 2)
  validFrom    DateTime
  validUntil   DateTime
  maxUses      Int?
  currentUses  Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  orders       Order[]
  
  @@map("coupons")
}
```

#### 3. Notification
```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  type      String   @db.VarChar(50) // 'order', 'stock', 'system'
  title     String   @db.VarChar(255)
  message   String   @db.Text
  data      String?  @db.Text // JSON com dados extras
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@map("notifications")
}
```

### Modificações em Modelos Existentes

#### Order
```prisma
model Order {
  // ... campos existentes ...
  couponId      Int?
  coupon        Coupon? @relation(fields: [couponId], references: [id])
  discountAmount Decimal? @db.Decimal(10, 2)
  // ... resto dos campos ...
}
```

#### User
```prisma
model User {
  // ... campos existentes ...
  notifications Notification[]
  // ... resto dos campos ...
}
```

#### Product
```prisma
model Product {
  // ... campos existentes ...
  images ProductImage[]
  // ... resto dos campos ...
}
```

---

## 🔌 Serviços Externos Necessários

### 1. Cloud Storage (Upload de Imagens)
**Opções:**
- AWS S3 (Recomendado para produção)
- Cloudinary (Mais fácil de configurar)
- Firebase Storage (Alternativa)
- Azure Blob Storage (Alternativa)

**Requisitos:**
- Upload de múltiplas imagens
- Redimensionamento automático
- Otimização de imagens
- CDN para melhor performance

### 2. Email Service (Sistema de Emails)
**Opções:**
- SendGrid (Recomendado - API simples)
- Nodemailer com SMTP (Flexível)
- AWS SES (Custo-benefício)
- Mailgun (Alternativa)

**Requisitos:**
- Envio de emails HTML
- Templates personalizados
- Suporte a attachments (opcional)
- Taxa de envio adequada (500-1000/dia inicial)

### 3. WebSocket (Notificações em Tempo Real)
**Opções:**
- Socket.io (Recomendado - mais fácil)
- ws (Nativo - mais leve)
- Pusher (SaaS - mais simples)

**Requisitos:**
- Conexão persistente
- Suporte a rooms/channels
- Autenticação de conexões
- Reconexão automática

---

## 📦 Dependências Adicionais Necessárias

### Backend
```json
{
  "dependencies": {
    // Cloud Storage (escolher um)
    "aws-sdk": "^2.x",                    // Para AWS S3
    // ou
    "cloudinary": "^1.x",                 // Para Cloudinary
    // ou
    "@azure/storage-blob": "^12.x",       // Para Azure
    
    // Email Service (escolher um)
    "@sendgrid/mail": "^7.x",            // Para SendGrid
    // ou
    "nodemailer": "^6.x",                // Para SMTP genérico
    // ou
    "@aws-sdk/client-ses": "^3.x",       // Para AWS SES
    
    // WebSocket
    "socket.io": "^4.x",                 // Para Socket.io
    
    // Upload de arquivos
    "multer": "^1.x",                    // Para upload de arquivos
    "@types/multer": "^1.x",             // Types para multer
    
    // Processamento de imagens
    "sharp": "^0.32.x",                  // Para redimensionamento
    
    // Utilities
    "uuid": "^9.x",                      // Para gerar IDs únicos
    "@types/uuid": "^9.x"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    // WebSocket Client
    "socket.io-client": "^4.x",         // Cliente Socket.io
    
    // Upload de arquivos
    "react-dropzone": "^14.x",          // Para drag-and-drop
    
    // Utilities
    "date-fns": "^2.x"                  // Para formatação de datas
  }
}
```

---

## 🔐 Variáveis de Ambiente Adicionais

### .env (Novas Variáveis)

```env
# Cloud Storage (escolher um)
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=primeiratroca-images

# ou Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (escolher um)
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br

# ou Nodemailer SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@primeiratroca.com.br

# ou AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@primeiratroca.com.br

# WebSocket (opcional - configurações)
WEBSOCKET_PORT=5001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Frontend URL (para emails e notificações)
FRONTEND_URL=http://localhost:3000

# Email Templates (opcional)
EMAIL_TEMPLATES_PATH=./server/templates/emails
```

---

## 🗂️ Estrutura de Pastas Nova

### Backend
```
server/
├── index.ts
├── routes/
│   ├── ... (rotas existentes)
│   ├── coupons.ts          # NOVO - Rotas de cupons
│   ├── notifications.ts     # NOVO - Rotas de notificações
│   └── analytics.ts         # NOVO - Rotas de analytics avançado
├── middleware/
│   └── auth.ts
├── services/                # NOVO - Serviços reutilizáveis
│   ├── EmailService.ts      # Serviço de emails
│   ├── NotificationService.ts # Serviço de notificações
│   ├── ImageService.ts      # Serviço de upload de imagens
│   └── AnalyticsService.ts  # Serviço de analytics
├── templates/               # NOVO - Templates de email
│   └── emails/
│       ├── welcome.html
│       ├── order-confirmation.html
│       ├── order-status-update.html
│       └── password-reset.html
└── utils/                   # NOVO - Utilitários
    ├── imageProcessor.ts    # Processamento de imagens
    ├── couponValidator.ts   # Validação de cupons
    └── analyticsCalculator.ts # Cálculos de analytics
```

### Frontend
```
src/
├── components/
│   ├── ... (componentes existentes)
│   ├── ImageUploader.tsx        # NOVO - Upload de imagens
│   ├── ImageGallery.tsx          # NOVO - Galeria de imagens
│   ├── CouponInput.tsx          # NOVO - Input de cupom
│   ├── NotificationBell.tsx      # NOVO - Badge de notificações
│   ├── NotificationDropdown.tsx # NOVO - Dropdown de notificações
│   └── AdvancedFilters.tsx      # NOVO - Filtros avançados
├── pages/
│   ├── ... (páginas existentes)
│   ├── AdminCouponsPage.tsx     # NOVO - Gerenciar cupons
│   ├── ForgotPasswordPage.tsx   # NOVO - Recuperar senha
│   └── ResetPasswordPage.tsx    # NOVO - Redefinir senha
├── contexts/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── NotificationContext.tsx  # NOVO - Contexto de notificações
└── lib/
    ├── api.ts                   # Atualizar com novas rotas
    ├── socket.ts                 # NOVO - Cliente WebSocket
    └── ... (utilitários existentes)
```

---

## 🔄 Mudanças em APIs Existentes

### Atualização Necessária em `/api/products`

**Adicionar:**
- `GET /api/products/:id/images` - Listar imagens do produto
- `POST /api/products/:id/images` - Upload de nova imagem
- `PUT /api/products/:id/images/:imageId` - Atualizar imagem (ordem/primária)
- `DELETE /api/products/:id/images/:imageId` - Deletar imagem

### Atualização Necessária em `/api/orders`

**Adicionar:**
- Campo `couponCode` no body de `POST /api/orders`
- Campo `couponId` e `discountAmount` na resposta

### Atualização Necessária em `/api/products` (busca)

**Melhorar:**
- Busca por múltiplos campos simultaneamente
- Filtros múltiplos (categoria, preço, tamanho, cor, etc.)
- Ordenação avançada
- Busca fuzzy
- Paginação melhorada
- `GET /api/products/search/suggestions` - Sugestões de busca

---

## 📊 Dependências Entre Módulos

```
Módulo 1 (Upload) 
  └─> Módulo 2 (Cupons - imagens de cupons)
       └─> Fase 3 (Integração)

Módulo 3 (Notificações)
  └─> Módulo 4 (Emails - notificações por email)
       └─> Fase 3 (Integração)

Módulo 4 (Emails)
  └─> Módulo 2 (Cupons - email de cupom usado)

Todos os Módulos
  └─> Fase 8 (Integração)
```

---

## ✅ Checklist de Preparação

### Infraestrutura
- [ ] Escolher provedor de cloud storage (AWS S3 / Cloudinary)
- [ ] Criar conta e configurar acesso
- [ ] Escolher provedor de email (SendGrid / Nodemailer / SES)
- [ ] Criar conta e configurar acesso
- [ ] Decidir sobre WebSocket (Socket.io / ws)
- [ ] Instalar dependências necessárias

### Banco de Dados
- [ ] Criar migrations para novos modelos
- [ ] Testar migrations em ambiente de desenvolvimento
- [ ] Verificar compatibilidade backward
- [ ] Preparar rollback plan

### Código
- [ ] Criar branch `v1.2-dev`
- [ ] Criar estrutura de pastas para novos serviços
- [ ] Configurar variáveis de ambiente
- [ ] Atualizar documentação da API

---

## 📝 Notas Importantes

### Compatibilidade Backward
- ✅ Novos modelos não afetam modelos existentes
- ✅ Novos endpoints não quebram endpoints antigos
- ✅ Novas colunas são nullable para não quebrar dados existentes
- ✅ Novas funcionalidades podem ser desativadas via feature flags

### Estratégia de Deploy
1. Deploy incremental módulo por módulo
2. Feature flags para ativar/desativar módulos
3. Rollback plan para cada módulo
4. Testes extensivos antes de merge

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: ✅ Análise Completa

---

*Este documento será atualizado conforme o desenvolvimento avança.*

