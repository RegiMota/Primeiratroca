# 📊 Estruturas de Dados - Versão 1.2
## Primeira Troca - Definições Técnicas

**Data**: Janeiro 2025  
**Versão**: 1.2.0  
**Status**: 📋 Definição

---

## 🗄️ Novos Modelos do Banco de Dados

### 1. ProductImage

```prisma
model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   @db.Text                    // URL da imagem (cloud storage ou base64)
  isPrimary Boolean  @default(false)             // Se é a imagem principal
  order     Int      @default(0)                 // Ordem de exibição (0, 1, 2, ...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([productId])
  @@map("product_images")
}
```

**Regras de Negócio:**
- Um produto pode ter múltiplas imagens
- Apenas uma imagem pode ser `isPrimary = true` por produto
- Ordem determina a sequência de exibição (menor = primeiro)
- Ao deletar produto, todas as imagens são deletadas (Cascade)

**Migração:**
```sql
-- A adicionar ao schema existente
-- Produto já tem campo `image` (String @db.Text) que será mantido para compatibilidade
-- Novo modelo permite múltiplas imagens
```

### 2. Coupon

```prisma
model Coupon {
  id           Int      @id @default(autoincrement())
  code         String   @unique @db.VarChar(50)   // Código único do cupom (ex: "PROMO2025")
  discountType String   @db.VarChar(20)            // 'percentage' ou 'fixed'
  discountValue Decimal  @db.Decimal(10, 2)        // Valor do desconto (ex: 10 para 10% ou R$10)
  minPurchase   Decimal? @db.Decimal(10, 2)        // Compra mínima para usar (opcional)
  maxDiscount  Decimal? @db.Decimal(10, 2)        // Desconto máximo (opcional, para %)
  validFrom    DateTime                            // Data de início da validade
  validUntil   DateTime                            // Data de fim da validade
  maxUses      Int?                                // Máximo de usos (null = ilimitado)
  currentUses  Int      @default(0)               // Usos atuais
  isActive     Boolean  @default(true)              // Se está ativo (pode desativar sem deletar)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  orders       Order[]                             // Pedidos que usaram este cupom
  
  @@index([code])
  @@index([isActive, validFrom, validUntil])
  @@map("coupons")
}
```

**Regras de Negócio:**
- Código deve ser único e maiúsculo (normalizar ao criar)
- Desconto percentual: `discountValue` = porcentagem (ex: 10 = 10%)
- Desconto fixo: `discountValue` = valor em R$ (ex: 10.00 = R$10)
- Validação de data: `validFrom <= agora <= validUntil`
- Validação de uso: `maxUses == null || currentUses < maxUses`
- Validação de compra mínima: `minPurchase == null || total >= minPurchase`
- Validação de desconto máximo (para %): `maxDiscount == null || desconto <= maxDiscount`

**Exemplos:**
```javascript
// Cupom de 10% de desconto
{
  code: "DESCONTO10",
  discountType: "percentage",
  discountValue: 10.00,
  minPurchase: 100.00,
  maxDiscount: 50.00, // Máximo de R$50 de desconto
  validFrom: "2025-01-01",
  validUntil: "2025-12-31",
  maxUses: 100
}

// Cupom de R$20 de desconto
{
  code: "BEMVINDO20",
  discountType: "fixed",
  discountValue: 20.00,
  minPurchase: 50.00,
  validFrom: "2025-01-01",
  validUntil: "2025-12-31",
  maxUses: null // Ilimitado
}
```

### 3. Notification

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   @db.VarChar(50)            // 'order', 'stock', 'system', 'coupon'
  title     String   @db.VarChar(255)           // Título da notificação
  message   String   @db.Text                   // Mensagem da notificação
  data      String?  @db.Text                   // JSON com dados extras (ex: {orderId: 123})
  isRead    Boolean  @default(false)            // Se foi lida
  createdAt DateTime @default(now())
  
  @@index([userId, isRead, createdAt])
  @@map("notifications")
}
```

**Regras de Negócio:**
- Cada usuário tem suas próprias notificações
- `data` é um JSON string com informações extras (ex: `{"orderId": 123, "status": "shipped"}`)
- Notificações não são deletadas automaticamente (arquivo para histórico)
- Tipos: `order` (pedido), `stock` (estoque), `system` (sistema), `coupon` (cupom)

**Exemplos de data (JSON):**
```javascript
// Notificação de pedido
{
  type: "order",
  title: "Pedido Enviado",
  message: "Seu pedido #123 foi enviado",
  data: '{"orderId": 123, "status": "shipped"}'
}

// Notificação de estoque baixo
{
  type: "stock",
  title: "Estoque Baixo",
  message: "Produto 'Vestido Rosa' com apenas 5 unidades",
  data: '{"productId": 456, "stock": 5}'
}
```

---

## 🔄 Modificações em Modelos Existentes

### Product

**Adicionar:**
```prisma
model Product {
  // ... campos existentes ...
  images     ProductImage[]  // NOVO - Múltiplas imagens
  
  // Campo `image` (String) será mantido para compatibilidade
  // Será usado como fallback ou imagem principal legada
}
```

**Nota:** O campo `image` existente será mantido para **backward compatibility**. Produtos antigos continuarão funcionando, enquanto novos produtos usarão o modelo `ProductImage`.

### Order

**Adicionar:**
```prisma
model Order {
  // ... campos existentes ...
  couponId      Int?                        // NOVO - ID do cupom usado (opcional)
  coupon        Coupon? @relation(fields: [couponId], references: [id])  // NOVO
  discountAmount Decimal? @db.Decimal(10, 2) // NOVO - Valor do desconto aplicado
  // ... resto dos campos ...
  
  // Campos existentes mantidos:
  // - total (já existe, será calculado com desconto se houver cupom)
}
```

**Cálculo do Total com Cupom:**
```javascript
// Antes: total = subtotal
// Agora: total = subtotal - discountAmount

// Exemplo:
// subtotal = R$ 100
// cupom aplicado = 10% (ou R$10)
// discountAmount = R$ 10
// total = R$ 100 - R$ 10 = R$ 90
```

### User

**Adicionar:**
```prisma
model User {
  // ... campos existentes ...
  notifications Notification[]  // NOVO - Notificações do usuário
  // ... resto dos campos ...
}
```

---

## 📋 Interfaces TypeScript (Frontend)

### ProductImage

```typescript
interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### Coupon

```typescript
interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}
```

### Notification

```typescript
interface Notification {
  id: number;
  userId: number;
  type: 'order' | 'stock' | 'system' | 'coupon';
  title: string;
  message: string;
  data?: any; // JSON parsed
  isRead: boolean;
  createdAt: string;
}
```

### Order (Atualizado)

```typescript
interface Order {
  // ... campos existentes ...
  couponId?: number;
  coupon?: Coupon;
  discountAmount?: number;
  // ... resto dos campos ...
}
```

### Product (Atualizado)

```typescript
interface Product {
  // ... campos existentes ...
  images?: ProductImage[];  // NOVO - Array de imagens
  // Campo `image` (string) mantido para compatibilidade
  // ... resto dos campos ...
}
```

---

## 🔌 Endpoints de API Novos

### Product Images

```typescript
// Listar imagens do produto
GET /api/products/:id/images
Response: ProductImage[]

// Upload de nova imagem
POST /api/products/:id/images
Body: { url: string, isPrimary?: boolean, order?: number }
Response: ProductImage

// Atualizar imagem (ordem/primária)
PUT /api/products/:id/images/:imageId
Body: { isPrimary?: boolean, order?: number }
Response: ProductImage

// Deletar imagem
DELETE /api/products/:id/images/:imageId
Response: { message: string }
```

### Coupons

```typescript
// Listar cupons (admin)
GET /api/admin/coupons
Query: { isActive?: boolean, code?: string }
Response: Coupon[]

// Criar cupom (admin)
POST /api/admin/coupons
Body: Coupon (sem id, currentUses)
Response: Coupon

// Obter cupom (admin)
GET /api/admin/coupons/:id
Response: Coupon

// Atualizar cupom (admin)
PUT /api/admin/coupons/:id
Body: Partial<Coupon>
Response: Coupon

// Deletar cupom (admin)
DELETE /api/admin/coupons/:id
Response: { message: string }

// Validar cupom (público)
POST /api/coupons/validate
Body: { code: string, total: number }
Response: CouponValidation
```

### Notifications

```typescript
// Listar notificações do usuário
GET /api/notifications
Query: { isRead?: boolean, limit?: number, offset?: number }
Response: Notification[]

// Contar notificações não lidas
GET /api/notifications/count
Response: { count: number }

// Marcar como lida
PUT /api/notifications/:id/read
Response: Notification

// Marcar todas como lidas
PUT /api/notifications/read-all
Response: { message: string }

// Deletar notificação
DELETE /api/notifications/:id
Response: { message: string }
```

### Analytics (Melhorado)

```typescript
// Overview completo
GET /api/admin/analytics/overview
Query: { startDate?: string, endDate?: string }
Response: {
  conversionRate: number;
  averageTicketByCategory: { category: string, average: number }[];
  newVsReturningCustomers: { new: number, returning: number };
  mostViewedProducts: { id: number, views: number }[];
  peakHours: { hour: number, orders: number }[];
  cartAbandonmentRate: number;
}

// Tendências
GET /api/admin/analytics/trends
Query: { period: '7d' | '30d' | '90d', categoryId?: number }
Response: {
  revenue: { date: string, value: number }[];
  orders: { date: string, value: number }[];
  customers: { date: string, value: number }[];
}
```

### Products Search (Melhorado)

```typescript
// Busca avançada
GET /api/products/search
Query: {
  search?: string;              // Busca por nome/descrição
  category?: string;            // Filtro por categoria
  minPrice?: number;           // Preço mínimo
  maxPrice?: number;           // Preço máximo
  sizes?: string[];            // Filtro por tamanhos (array)
  colors?: string[];           // Filtro por cores (array)
  featured?: boolean;          // Apenas produtos em destaque
  inStock?: boolean;           // Apenas produtos em estoque
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}
Response: {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

// Sugestões de busca
GET /api/products/search/suggestions
Query: { q: string, limit?: number }
Response: string[]  // Array de sugestões
```

---

## 🔐 Validações e Regras

### Cupons

**Validação ao Criar:**
- `code` deve ser único (case-insensitive)
- `code` deve ter entre 3-50 caracteres
- `discountType` deve ser 'percentage' ou 'fixed'
- `discountValue` deve ser > 0
- Se `discountType = 'percentage'`, `discountValue` deve ser <= 100
- `validFrom` deve ser <= `validUntil`
- `minPurchase` deve ser > 0 se fornecido
- `maxDiscount` deve ser > 0 se fornecido
- `maxUses` deve ser > 0 se fornecido

**Validação ao Usar:**
- Cupom deve existir e estar ativo (`isActive = true`)
- Data atual deve estar entre `validFrom` e `validUntil`
- `currentUses < maxUses` (se `maxUses` não for null)
- `total >= minPurchase` (se `minPurchase` não for null)
- Usuário não pode usar o mesmo cupom múltiplas vezes (verificar histórico)

**Cálculo de Desconto:**
```javascript
function calculateDiscount(coupon, subtotal) {
  let discount = 0;
  
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    
    // Aplicar desconto máximo se especificado
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }
  
  // Não permitir desconto maior que o subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  return Math.round(discount * 100) / 100; // Arredondar para 2 casas decimais
}
```

### Notificações

**Validação ao Criar:**
- `userId` deve existir
- `type` deve ser um dos tipos válidos
- `title` não pode ser vazio
- `message` não pode ser vazio
- `data` deve ser JSON válido se fornecido

### Product Images

**Validação ao Criar:**
- `productId` deve existir
- `url` deve ser uma URL válida ou base64 válido
- Apenas uma imagem pode ser `isPrimary = true` por produto
- `order` deve ser >= 0

**Ao definir uma imagem como primária:**
- Desmarcar outras imagens primárias do mesmo produto
- Se for a primeira imagem, definir `isPrimary = true` automaticamente

---

## 📊 Índices e Performance

### Índices Recomendados

```prisma
// ProductImage
@@index([productId])  // Para buscar imagens por produto

// Coupon
@@index([code])  // Para busca rápida por código
@@index([isActive, validFrom, validUntil])  // Para validação rápida

// Notification
@@index([userId, isRead, createdAt])  // Para listar notificações do usuário

// Order
@@index([couponId])  // Para buscar pedidos por cupom
```

---

## 🔄 Migrações Necessárias

### Migration 1: ProductImage

```sql
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  url TEXT NOT NULL,
  isPrimary BOOLEAN DEFAULT FALSE,
  `order` INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_productId (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Migration 2: Coupon

```sql
CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discountType VARCHAR(20) NOT NULL,
  discountValue DECIMAL(10, 2) NOT NULL,
  minPurchase DECIMAL(10, 2) NULL,
  maxDiscount DECIMAL(10, 2) NULL,
  validFrom DATETIME NOT NULL,
  validUntil DATETIME NOT NULL,
  maxUses INT NULL,
  currentUses INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active_dates (isActive, validFrom, validUntil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Migration 3: Notification

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data TEXT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read_created (userId, isRead, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Migration 4: Order (Adicionar campos)

```sql
ALTER TABLE orders
ADD COLUMN couponId INT NULL,
ADD COLUMN discountAmount DECIMAL(10, 2) NULL,
ADD FOREIGN KEY (couponId) REFERENCES coupons(id),
ADD INDEX idx_couponId (couponId);
```

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: ✅ Definições Completas

---

*Este documento será atualizado conforme o desenvolvimento avança.*

