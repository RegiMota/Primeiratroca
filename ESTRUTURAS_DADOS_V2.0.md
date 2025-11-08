# 📊 Estruturas de Dados - Versão 2.0
## Primeira Troca - Definições Técnicas

**Data**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: 📋 Definição

---

## 🗄️ Novos Modelos do Banco de Dados

### 1. Payment (Transação de Pagamento)

```prisma
model Payment {
  id              Int      @id @default(autoincrement())
  orderId         Int
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Informações do Gateway
  gateway         String   @db.VarChar(50)            // 'stripe', 'mercadopago', 'pagseguro'
  gatewayPaymentId String  @db.VarChar(255)           // ID do pagamento no gateway
  gatewayTransactionId String? @db.VarChar(255)       // ID da transação no gateway
  
  // Método de Pagamento
  paymentMethod   String   @db.VarChar(50)            // 'credit_card', 'pix', 'boleto'
  installments    Int      @default(1)                // Número de parcelas
  
  // Valores
  amount          Decimal  @db.Decimal(10, 2)          // Valor total
  fees            Decimal? @db.Decimal(10, 2)          // Taxas do gateway
  netAmount       Decimal? @db.Decimal(10, 2)          // Valor líquido recebido
  
  // Status
  status          String   @db.VarChar(50)            // 'pending', 'processing', 'approved', 'rejected', 'refunded'
  statusDetail    String?  @db.Text                    // Detalhes do status
  
  // Dados do Cartão (criptografado)
  cardLastDigits  String?  @db.VarChar(4)             // Últimos 4 dígitos
  cardBrand       String?  @db.VarChar(50)            // 'visa', 'mastercard', etc.
  
  // PIX
  pixCode         String?  @db.Text                    // Código PIX (QR Code)
  pixExpiresAt    DateTime?                            // Expiração do PIX
  
  // Boleto
  boletoUrl       String?  @db.Text                    // URL do boleto
  boletoBarcode   String?  @db.VarChar(255)           // Código de barras
  boletoExpiresAt DateTime?                            // Vencimento do boleto
  
  // Webhook
  webhookReceived Boolean  @default(false)            // Se webhook foi recebido
  webhookData     String?  @db.Text                    // Dados do webhook (JSON)
  
  // Auditoria
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([orderId])
  @@index([gatewayPaymentId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}
```

**Regras de Negócio:**
- Um pedido pode ter múltiplos pagamentos (ex: parcelado)
- Status segue fluxo: `pending` → `processing` → `approved` ou `rejected`
- Dados sensíveis do cartão nunca são armazenados (apenas últimos 4 dígitos)
- Webhook atualiza status automaticamente

---

### 2. ProductVariant (Variação do Produto)

```prisma
model ProductVariant {
  id        Int     @id @default(autoincrement())
  productId Int
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Variação
  size      String? @db.VarChar(20)                   // 'PP', 'P', 'M', 'G', 'GG', etc.
  color     String? @db.VarChar(50)                   // 'Azul', 'Vermelho', etc.
  
  // Estoque
  stock     Int     @default(0)                       // Quantidade em estoque
  reservedStock Int @default(0)                       // Estoque reservado (checkout)
  minStock  Int     @default(5)                       // Estoque mínimo (alerta)
  
  // Preço (opcional - pode variar por tamanho/cor)
  price     Decimal? @db.Decimal(10, 2)               // Preço específico (null = usa preço do produto)
  
  // Status
  isActive  Boolean @default(true)                    // Se a variação está ativa
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([productId, size, color])
  @@index([productId])
  @@index([stock])
  @@map("product_variants")
}
```

**Regras de Negócio:**
- Combinação `productId + size + color` deve ser única
- `reservedStock` é liberado após timeout (15-30min) ou conclusão do pedido
- Quando `stock <= minStock`, alerta é enviado automaticamente
- Se `price` for null, usa o preço do produto principal

---

### 3. StockMovement (Movimentação de Estoque)

```prisma
model StockMovement {
  id            Int      @id @default(autoincrement())
  variantId     Int?                                   // null se for movimento geral do produto
  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  productId     Int
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Movimentação
  type          String   @db.VarChar(50)                // 'in' (entrada), 'out' (saída), 'adjustment' (ajuste)
  quantity      Int                                     // Quantidade (positivo ou negativo)
  previousStock Int                                     // Estoque anterior
  newStock      Int                                     // Estoque após movimentação
  
  // Origem
  orderId       Int?                                    // Se foi por pedido
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  userId        Int?                                    // Usuário que fez a movimentação (admin)
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Motivo
  reason        String?  @db.VarChar(100)               // 'sale', 'return', 'adjustment', 'restock', etc.
  notes         String?  @db.Text                        // Observações
  
  createdAt     DateTime  @default(now())
  
  @@index([productId])
  @@index([variantId])
  @@index([orderId])
  @@index([createdAt])
  @@map("stock_movements")
}
```

**Regras de Negócio:**
- Todas as movimentações são registradas para auditoria
- `previousStock` e `newStock` são calculados automaticamente
- Movimentações por pedido são vinculadas ao `orderId`
- Movimentações manuais são vinculadas ao `userId` (admin)

---

### 4. ShippingTracking (Rastreamento de Entrega)

```prisma
model ShippingTracking {
  id            Int      @id @default(autoincrement())
  orderId       Int
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Transportadora
  carrier       String   @db.VarChar(50)                // 'correios', 'jadlog', 'total', etc.
  trackingCode  String   @db.VarChar(255)               // Código de rastreamento
  
  // Status Atual
  status        String   @db.VarChar(50)                // 'pending', 'in_transit', 'out_for_delivery', 'delivered', 'exception'
  statusDetail  String?  @db.Text                        // Descrição do status
  
  // Endereço de Entrega
  address       String   @db.Text                        // Endereço completo
  city          String   @db.VarChar(100)
  state         String   @db.VarChar(2)
  zipCode       String   @db.VarChar(10)
  
  // Datas
  shippedAt     DateTime?                               // Data de envio
  estimatedDelivery DateTime?                           // Data estimada de entrega
  deliveredAt   DateTime?                               // Data real de entrega
  
  // Eventos de Rastreamento
  events        String?  @db.Text                        // JSON com eventos de rastreamento
  
  // Confirmação
  deliveryProof String?  @db.Text                        // Foto/comprovação de entrega
  recipientName String?  @db.VarChar(100)                // Nome de quem recebeu
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([orderId])
  @@index([trackingCode])
  @@index([status])
  @@map("shipping_trackings")
}
```

**Regras de Negócio:**
- Um pedido tem apenas um rastreamento
- Status é atualizado automaticamente via job agendado
- `events` armazena histórico completo em JSON
- `deliveryProof` pode ser URL de foto ou assinatura

---

### 5. UserAddress (Endereços do Usuário)

```prisma
model UserAddress {
  id            Int      @id @default(autoincrement())
  userId        Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Endereço
  label         String?  @db.VarChar(50)                // 'Casa', 'Trabalho', 'Outro', etc.
  street        String   @db.VarChar(255)               // Rua/Logradouro
  number        String   @db.VarChar(20)                // Número
  complement    String?  @db.VarChar(255)               // Complemento
  neighborhood  String   @db.VarChar(100)               // Bairro
  city          String   @db.VarChar(100)               // Cidade
  state         String   @db.VarChar(2)                 // UF (2 letras)
  zipCode       String   @db.VarChar(10)               // CEP
  country       String   @default("BR") @db.VarChar(2) // País (padrão: BR)
  
  // Informações Adicionais
  reference     String?  @db.Text                        // Ponto de referência
  isDefault     Boolean  @default(false)                // Se é o endereço padrão
  
  // Dados de Entrega
  recipientName String?  @db.VarChar(100)                // Nome do destinatário (se diferente do usuário)
  phone         String?  @db.VarChar(20)                 // Telefone de contato
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
  @@index([zipCode])
  @@map("user_addresses")
}
```

**Regras de Negócio:**
- Um usuário pode ter múltiplos endereços
- Apenas um endereço pode ser `isDefault = true` por usuário
- CEP é usado para cálculo de frete
- `recipientName` e `phone` são opcionais (usam dados do usuário se não informados)

---

### 6. WishlistItem (Item da Lista de Desejos) ✅

**Status**: ✅ **IMPLEMENTADO** - Módulo 4 concluído (80%)

```prisma
model WishlistItem {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Variação (opcional)
  variantId Int?
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  
  // Configurações
  notes     String?  @db.Text                        // Notas do usuário sobre o item
  priority  Int      @default(0)                     // Prioridade (0 = normal, maior = mais importante)
  
  // Compartilhamento
  isPublic  Boolean  @default(false)                 // Se o item é público (permite compartilhamento)
  shareCode String?  @unique @db.VarChar(50)          // Código para compartilhar (gerado automaticamente)
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@unique([userId, productId, variantId])
  @@index([userId])
  @@index([productId])
  @@index([shareCode])
  @@map("wishlist_items")
}
```

**Regras de Negócio:**
- Um usuário pode ter o mesmo produto apenas uma vez na wishlist
- Se `variantId` for especificado, é uma variação específica
- `shareCode` é gerado automaticamente quando `isPublic = true`
- Wishlist pode ser compartilhada via link com `shareCode`

**Funcionalidades Implementadas:**
- ✅ Adicionar/remover itens da wishlist
- ✅ Verificar se produto está na wishlist
- ✅ Editar notas e prioridade
- ✅ Tornar itens públicos e compartilhar
- ✅ Mover itens para o topo
- ✅ Adicionar ao carrinho direto da wishlist
- ✅ Estatísticas da wishlist
- ⏳ Notificações de promoção (pendente)
- ⏳ Comparação de produtos (pendente)

---

### 7. Ticket (Ticket de Suporte)

```prisma
model Ticket {
  id            Int      @id @default(autoincrement())
  userId        Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Informações do Ticket
  subject       String   @db.VarChar(255)              // Assunto
  description   String   @db.Text                      // Descrição inicial
  category      String   @db.VarChar(50)              // 'technical', 'order', 'payment', 'other'
  
  // Status
  status        String   @default("open") @db.VarChar(50) // 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
  priority      String   @default("medium") @db.VarChar(50) // 'low', 'medium', 'high', 'urgent'
  
  // Atribuição
  assignedToId  Int?                                    // Admin responsável
  assignedTo    User?    @relation("AssignedTickets", fields: [assignedToId], references: [id], onDelete: SetNull)
  
  // Pedido Relacionado (se aplicável)
  orderId       Int?
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  // Resolução
  resolution    String?  @db.Text                        // Solução/resposta final
  resolvedAt    DateTime?                                // Data de resolução
  resolvedById  Int?                                     // Admin que resolveu
  resolvedBy    User?    @relation("ResolvedTickets", fields: [resolvedById], references: [id], onDelete: SetNull)
  
  // Métricas
  firstResponseAt DateTime?                              // Data da primeira resposta
  averageResponseTime Int?                                // Tempo médio de resposta (minutos)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relações
  messages      ChatMessage[]
  
  @@index([userId])
  @@index([status])
  @@index([assignedToId])
  @@index([orderId])
  @@index([createdAt])
  @@map("tickets")
}
```

**Regras de Negócio:**
- Ticket segue fluxo: `open` → `in_progress` → `waiting_customer` → `resolved` → `closed`
- Prioridade pode ser alterada pelo admin
- `firstResponseAt` é registrado quando admin responde pela primeira vez
- Ticket pode estar relacionado a um pedido específico

---

### 8. ChatMessage (Mensagem do Chat)

```prisma
model ChatMessage {
  id          Int      @id @default(autoincrement())
  ticketId    Int
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  // Remetente
  senderId    Int                                     // ID do usuário (cliente ou admin)
  senderIsAdmin Boolean @default(false)               // Se o remetente é admin
  
  // Mensagem
  content     String   @db.Text                        // Conteúdo da mensagem
  messageType String   @default("text") @db.VarChar(50) // 'text', 'file', 'image', 'system'
  
  // Arquivo (se aplicável)
  fileUrl     String?  @db.Text                        // URL do arquivo enviado
  fileName    String?  @db.VarChar(255)                // Nome do arquivo
  fileSize    Int?                                     // Tamanho do arquivo (bytes)
  
  // Status
  isRead      Boolean  @default(false)                 // Se foi lida
  readAt      DateTime?                                // Data de leitura
  
  createdAt   DateTime  @default(now())
  
  @@index([ticketId])
  @@index([senderId])
  @@index([createdAt])
  @@map("chat_messages")
}
```

**Regras de Negócio:**
- Mensagens são vinculadas a um ticket
- `senderIsAdmin` diferencia mensagens do cliente e do admin
- Upload de arquivos é armazenado via Cloudinary ou sistema de arquivos
- `isRead` é atualizado automaticamente quando mensagem é visualizada

---

### 9. AuditLog (Log de Auditoria)

```prisma
model AuditLog {
  id            Int      @id @default(autoincrement())
  
  // Usuário e Ação
  userId        Int?                                    // Usuário que realizou a ação (null = sistema)
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  userEmail     String?  @db.VarChar(255)              // Email do usuário (para histórico)
  
  // Ação
  action        String   @db.VarChar(100)              // 'create', 'update', 'delete', 'login', 'logout', etc.
  resource      String   @db.VarChar(100)              // 'product', 'order', 'user', 'coupon', etc.
  resourceId    Int?                                    // ID do recurso afetado
  
  // Detalhes
  description   String?  @db.Text                        // Descrição da ação
  changes       String?  @db.Text                        // JSON com mudanças (antes/depois)
  ipAddress     String?  @db.VarChar(45)                // IP do usuário
  userAgent     String?  @db.Text                        // User Agent do navegador
  
  // Contexto
  orderId       Int?                                    // Se relacionado a um pedido
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Regras de Negócio:**
- Todas as ações críticas são registradas
- `changes` armazena diferença antes/depois em JSON
- Logs não são deletados (apenas arquivados)
- `userEmail` é mantido mesmo se usuário for deletado

---

## 🔄 Modelos Atualizados

### Order (Pedido) - Atualizações

**Novos Campos:**
```prisma
model Order {
  // ... campos existentes ...
  
  // Pagamento
  paymentId     Int?                                   // ID do pagamento principal
  payment       Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)
  payments      Payment[]                              // Múltiplos pagamentos (parcelado)
  
  // Frete
  shippingMethod String? @db.VarChar(50)               // 'standard', 'express', 'pickup', etc.
  shippingCost   Decimal? @db.Decimal(10, 2)            // Custo do frete
  shippingTracking ShippingTracking?                  // Rastreamento
  
  // Endereço de Entrega
  shippingAddressId Int?                               // ID do endereço de entrega
  shippingAddress    UserAddress? @relation(fields: [shippingAddressId], references: [id], onDelete: SetNull)
  
  // Ticket Relacionado (se aplicável)
  ticketId       Int?
  ticket         Ticket? @relation(fields: [ticketId], references: [id], onDelete: SetNull)
  
  // ... campos existentes ...
}
```

### Product (Produto) - Atualizações

**Novos Campos:**
```prisma
model Product {
  // ... campos existentes ...
  
  // Variações
  variants       ProductVariant[]
  
  // Estoque (geral - usado quando não há variações)
  stock          Int     @default(0)                   // Estoque geral
  reservedStock  Int     @default(0)                   // Estoque reservado
  minStock       Int     @default(5)                    // Estoque mínimo para alerta
  hasVariants    Boolean @default(false)               // Se o produto tem variações
  
  // ... campos existentes ...
}
```

### User (Usuário) - Atualizações

**Novos Campos:**
```prisma
model User {
  // ... campos existentes ...
  
  // Segurança 2FA
  twoFactorSecret   String? @db.VarChar(255)           // Secret TOTP (criptografado)
  twoFactorEnabled  Boolean @default(false)            // Se 2FA está habilitado
  twoFactorBackupCodes String? @db.Text               // Códigos de backup (criptografado)
  
  // Endereços
  addresses        UserAddress[]
  
  // Wishlist
  wishlistItems    WishlistItem[]
  
  // Tickets
  tickets          Ticket[]
  assignedTickets  Ticket[] @relation("AssignedTickets")
  resolvedTickets  Ticket[] @relation("ResolvedTickets")
  
  // Auditoria
  auditLogs        AuditLog[]
  
  // ... campos existentes ...
}
```

---

## 📋 Índices e Otimizações

### Índices Criados

**Performance:**
- `@@index([productId, size, color])` em `ProductVariant` (busca rápida)
- `@@index([status])` em `Payment` (filtros)
- `@@index([trackingCode])` em `ShippingTracking` (busca de rastreamento)
- `@@index([userId, productId, variantId])` em `WishlistItem` (unicidade e busca)
- `@@index([ticketId, createdAt])` em `ChatMessage` (ordenação)

**Auditoria:**
- `@@index([resource, resourceId])` em `AuditLog` (busca por recurso)
- `@@index([userId, createdAt])` em várias tabelas (histórico)

---

## 🔗 Relações Principais

### Payment ↔ Order
- Um pedido pode ter múltiplos pagamentos (parcelado)
- Um pagamento pertence a um pedido
- `Payment.orderId` → `Order.id` (Cascade)

### ProductVariant ↔ Product
- Um produto pode ter múltiplas variações
- Uma variação pertence a um produto
- `ProductVariant.productId` → `Product.id` (Cascade)

### StockMovement ↔ ProductVariant
- Uma movimentação pode estar vinculada a uma variação específica
- Se `variantId` for null, é movimentação geral do produto
- `StockMovement.variantId` → `ProductVariant.id` (SetNull)

### ShippingTracking ↔ Order
- Um pedido tem um rastreamento
- `ShippingTracking.orderId` → `Order.id` (Cascade)

### UserAddress ↔ User
- Um usuário pode ter múltiplos endereços
- `UserAddress.userId` → `User.id` (Cascade)

### WishlistItem ↔ User + Product
- Um usuário pode ter múltiplos itens na wishlist
- Um produto pode estar em múltiplas wishlists
- `WishlistItem.userId` → `User.id` (Cascade)
- `WishlistItem.productId` → `Product.id` (Cascade)

### Ticket ↔ User
- Um usuário pode ter múltiplos tickets
- Um ticket pertence a um usuário (cliente)
- Um ticket pode ser atribuído a um admin (`assignedTo`)
- `Ticket.userId` → `User.id` (Cascade)

### ChatMessage ↔ Ticket
- Uma mensagem pertence a um ticket
- Um ticket pode ter múltiplas mensagens
- `ChatMessage.ticketId` → `Ticket.id` (Cascade)

### AuditLog ↔ User
- Um log pode estar vinculado a um usuário
- Se `userId` for null, é ação do sistema
- `AuditLog.userId` → `User.id` (SetNull)

---

## 📝 Regras de Negócio Importantes

### Pagamentos
1. **Status**: `pending` → `processing` → `approved` ou `rejected`
2. **Reembolsos**: Status muda para `refunded`
3. **Segurança**: Dados sensíveis do cartão nunca são armazenados
4. **Webhooks**: Atualizam status automaticamente

### Estoque
1. **Reserva**: `reservedStock` é reservado durante checkout (15-30min timeout)
2. **Alertas**: Quando `stock <= minStock`, notificação é enviada
3. **Movimentações**: Todas as mudanças são registradas para auditoria

### Frete
1. **Cálculo**: Baseado em CEP e dimensões/peso do produto
2. **Rastreamento**: Atualizado automaticamente via job agendado
3. **Status**: `pending` → `in_transit` → `out_for_delivery` → `delivered`

### Wishlist
1. **Unicidade**: Mesmo produto + mesma variação = apenas uma entrada
2. **Compartilhamento**: `shareCode` é gerado quando `isPublic = true`
3. **Notificações**: Job verifica promoções em itens favoritados

### Tickets
1. **Fluxo**: `open` → `in_progress` → `waiting_customer` → `resolved` → `closed`
2. **Atribuição**: Admin pode ser atribuído ao ticket
3. **Resposta**: Primeira resposta é registrada em `firstResponseAt`

### Auditoria
1. **Registro**: Todas as ações críticas são registradas
2. **Mudanças**: JSON com diferença antes/depois
3. **Retenção**: Logs não são deletados (apenas arquivados após X meses)

---

## 🔄 Migrations Necessárias

### Migration 1: Pagamentos
- Criar tabela `payments`
- Adicionar `paymentId` em `orders`
- Adicionar relacionamento `Order.payments`

### Migration 2: Estoque Avançado
- Criar tabela `product_variants`
- Criar tabela `stock_movements`
- Adicionar campos de estoque em `products`
- Migrar dados existentes para novas estruturas

### Migration 3: Frete e Endereços
- Criar tabela `shipping_trackings`
- Criar tabela `user_addresses`
- Adicionar campos de frete em `orders`
- Adicionar relacionamentos

### Migration 4: Wishlist
- Criar tabela `wishlist_items`
- Adicionar relacionamentos em `users` e `products`

### Migration 5: Chat/Suporte
- Criar tabela `tickets`
- Criar tabela `chat_messages`
- Adicionar relacionamentos

### Migration 6: Segurança
- Criar tabela `audit_logs`
- Adicionar campos 2FA em `users`

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Definição

