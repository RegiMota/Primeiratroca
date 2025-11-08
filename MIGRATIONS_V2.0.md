# 🔄 Migrations - Versão 2.0
## Primeira Troca - Scripts de Migração do Banco de Dados

**Versão**: 2.0.0  
**Status**: 📋 Planejamento  
**Data**: Janeiro 2025

---

## 📋 Overview

Este documento detalha todas as migrations necessárias para atualizar o banco de dados da versão 1.2.0 para 2.0.0.

**Estratégia:**
- ✅ Migrations incrementais (uma por módulo)
- ✅ Backward compatible (dados antigos preservados)
- ✅ Rollback possível para cada migration
- ✅ Validação de dados antes e depois

---

## 🗄️ Migration 1: Sistema de Pagamentos

### Objetivo
Criar estrutura para armazenar transações de pagamento.

### Arquivo
`prisma/migrations/XXXXXX_add_payment_system/migration.sql`

### Mudanças no Schema

```prisma
// Adicionar ao schema.prisma

model Payment {
  id              Int      @id @default(autoincrement())
  orderId         Int
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  gateway         String   @db.VarChar(50)
  gatewayPaymentId String  @db.VarChar(255)
  gatewayTransactionId String? @db.VarChar(255)
  
  paymentMethod   String   @db.VarChar(50)
  installments    Int      @default(1)
  
  amount          Decimal  @db.Decimal(10, 2)
  fees            Decimal? @db.Decimal(10, 2)
  netAmount       Decimal? @db.Decimal(10, 2)
  
  status          String   @db.VarChar(50)
  statusDetail    String?  @db.Text
  
  cardLastDigits  String?  @db.VarChar(4)
  cardBrand       String?  @db.VarChar(50)
  
  pixCode         String?  @db.Text
  pixExpiresAt    DateTime?
  
  boletoUrl       String?  @db.Text
  boletoBarcode   String?  @db.VarChar(255)
  boletoExpiresAt DateTime?
  
  webhookReceived Boolean  @default(false)
  webhookData     String?  @db.Text
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([orderId])
  @@index([gatewayPaymentId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}
```

### Atualizar Order

```prisma
model Order {
  // ... campos existentes ...
  
  paymentId     Int?
  payment       Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)
  payments      Payment[]
}
```

### SQL de Migração

```sql
-- Criar tabela payments
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `gateway` VARCHAR(50) NOT NULL,
  `gatewayPaymentId` VARCHAR(255) NOT NULL,
  `gatewayTransactionId` VARCHAR(255) NULL,
  `paymentMethod` VARCHAR(50) NOT NULL,
  `installments` INT NOT NULL DEFAULT 1,
  `amount` DECIMAL(10, 2) NOT NULL,
  `fees` DECIMAL(10, 2) NULL,
  `netAmount` DECIMAL(10, 2) NULL,
  `status` VARCHAR(50) NOT NULL,
  `statusDetail` TEXT NULL,
  `cardLastDigits` VARCHAR(4) NULL,
  `cardBrand` VARCHAR(50) NULL,
  `pixCode` TEXT NULL,
  `pixExpiresAt` DATETIME NULL,
  `boletoUrl` TEXT NULL,
  `boletoBarcode` VARCHAR(255) NULL,
  `boletoExpiresAt` DATETIME NULL,
  `webhookReceived` BOOLEAN NOT NULL DEFAULT FALSE,
  `webhookData` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_gatewayPaymentId` (`gatewayPaymentId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campos em orders
ALTER TABLE `orders`
  ADD COLUMN `paymentId` INT NULL AFTER `discountAmount`,
  ADD FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE SET NULL;

-- Índice para payments relacionado a orders
CREATE INDEX `idx_order_payment` ON `orders`(`paymentId`);
```

### Validação

```sql
-- Verificar tabela criada
SELECT COUNT(*) FROM `payments`;

-- Verificar campos em orders
DESCRIBE `orders`;
```

### Rollback

```sql
-- Remover campos de orders
ALTER TABLE `orders` DROP FOREIGN KEY `orders_ibfk_X`;
ALTER TABLE `orders` DROP COLUMN `paymentId`;

-- Deletar tabela
DROP TABLE `payments`;
```

---

## 🗄️ Migration 2: Sistema de Estoque Avançado

### Objetivo
Criar estrutura para variações de produtos e controle de estoque avançado.

### Mudanças no Schema

```prisma
// Adicionar modelos

model ProductVariant {
  id        Int     @id @default(autoincrement())
  productId Int
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  size      String? @db.VarChar(20)
  color     String? @db.VarChar(50)
  
  stock     Int     @default(0)
  reservedStock Int @default(0)
  minStock  Int     @default(5)
  
  price     Decimal? @db.Decimal(10, 2)
  isActive  Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([productId, size, color])
  @@index([productId])
  @@index([stock])
  @@map("product_variants")
}

model StockMovement {
  id            Int      @id @default(autoincrement())
  variantId     Int?
  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  productId     Int
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  type          String   @db.VarChar(50)
  quantity      Int
  previousStock Int
  newStock      Int
  
  orderId       Int?
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  userId        Int?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  reason        String?  @db.VarChar(100)
  notes         String?  @db.Text
  
  createdAt     DateTime  @default(now())
  
  @@index([productId])
  @@index([variantId])
  @@index([orderId])
  @@index([createdAt])
  @@map("stock_movements")
}
```

### Atualizar Product

```prisma
model Product {
  // ... campos existentes ...
  
  variants       ProductVariant[]
  stock          Int     @default(0)
  reservedStock  Int     @default(0)
  minStock       Int     @default(5)
  hasVariants    Boolean @default(false)
}
```

### SQL de Migração

```sql
-- Criar tabela product_variants
CREATE TABLE `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `productId` INT NOT NULL,
  `size` VARCHAR(20) NULL,
  `color` VARCHAR(50) NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `reservedStock` INT NOT NULL DEFAULT 0,
  `minStock` INT NOT NULL DEFAULT 5,
  `price` DECIMAL(10, 2) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_variant` (`productId`, `size`, `color`),
  INDEX `idx_productId` (`productId`),
  INDEX `idx_stock` (`stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela stock_movements
CREATE TABLE `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `variantId` INT NULL,
  `productId` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL,
  `previousStock` INT NOT NULL,
  `newStock` INT NOT NULL,
  `orderId` INT NULL,
  `userId` INT NULL,
  `reason` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_productId` (`productId`),
  INDEX `idx_variantId` (`variantId`),
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campos em products
ALTER TABLE `products`
  ADD COLUMN `stock` INT NOT NULL DEFAULT 0 AFTER `image`,
  ADD COLUMN `reservedStock` INT NOT NULL DEFAULT 0 AFTER `stock`,
  ADD COLUMN `minStock` INT NOT NULL DEFAULT 5 AFTER `reservedStock`,
  ADD COLUMN `hasVariants` BOOLEAN NOT NULL DEFAULT FALSE AFTER `minStock`;

-- Migrar dados existentes: Copiar stock para produtos sem variações
-- (Se products já tinha campo stock, manter; se não, usar valor padrão 0)
UPDATE `products` SET `hasVariants` = FALSE WHERE `hasVariants` = FALSE;
```

### Validação

```sql
-- Verificar tabelas criadas
SELECT COUNT(*) FROM `product_variants`;
SELECT COUNT(*) FROM `stock_movements`;

-- Verificar campos em products
DESCRIBE `products`;
```

### Migração de Dados

```sql
-- Script para migrar estoque existente (se aplicável)
-- Criar variação padrão para produtos que não têm variações mas têm estoque
INSERT INTO `product_variants` (`productId`, `stock`, `isActive`, `createdAt`, `updatedAt`)
SELECT `id`, COALESCE(`stock`, 0), TRUE, NOW(), NOW()
FROM `products`
WHERE `hasVariants` = FALSE AND COALESCE(`stock`, 0) > 0;
```

---

## 🗄️ Migration 3: Sistema de Frete e Endereços

### Objetivo
Criar estrutura para rastreamento de entregas e endereços múltiplos.

### Mudanças no Schema

```prisma
model ShippingTracking {
  id            Int      @id @default(autoincrement())
  orderId       Int
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  carrier       String   @db.VarChar(50)
  trackingCode  String   @db.VarChar(255)
  status        String   @db.VarChar(50)
  statusDetail  String?  @db.Text
  
  address       String   @db.Text
  city          String   @db.VarChar(100)
  state         String   @db.VarChar(2)
  zipCode       String   @db.VarChar(10)
  
  shippedAt     DateTime?
  estimatedDelivery DateTime?
  deliveredAt   DateTime?
  
  events        String?  @db.Text
  deliveryProof String?  @db.Text
  recipientName String?  @db.VarChar(100)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([orderId])
  @@index([trackingCode])
  @@index([status])
  @@map("shipping_trackings")
}

model UserAddress {
  id            Int      @id @default(autoincrement())
  userId        Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  label         String?  @db.VarChar(50)
  street        String   @db.VarChar(255)
  number        String   @db.VarChar(20)
  complement    String?  @db.VarChar(255)
  neighborhood  String   @db.VarChar(100)
  city          String   @db.VarChar(100)
  state         String   @db.VarChar(2)
  zipCode       String   @db.VarChar(10)
  country       String   @default("BR") @db.VarChar(2)
  
  reference     String?  @db.Text
  isDefault     Boolean  @default(false)
  
  recipientName String?  @db.VarChar(100)
  phone         String?  @db.VarChar(20)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
  @@index([zipCode])
  @@map("user_addresses")
}
```

### Atualizar Order

```prisma
model Order {
  // ... campos existentes ...
  
  shippingMethod String? @db.VarChar(50)
  shippingCost   Decimal? @db.Decimal(10, 2)
  shippingTracking ShippingTracking?
  shippingAddressId Int?
  shippingAddress    UserAddress? @relation(fields: [shippingAddressId], references: [id], onDelete: SetNull)
}
```

### SQL de Migração

```sql
-- Criar tabela shipping_trackings
CREATE TABLE `shipping_trackings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `carrier` VARCHAR(50) NOT NULL,
  `trackingCode` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `statusDetail` TEXT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(2) NOT NULL,
  `zipCode` VARCHAR(10) NOT NULL,
  `shippedAt` DATETIME NULL,
  `estimatedDelivery` DATETIME NULL,
  `deliveredAt` DATETIME NULL,
  `events` TEXT NULL,
  `deliveryProof` TEXT NULL,
  `recipientName` VARCHAR(100) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_order_tracking` (`orderId`),
  INDEX `idx_trackingCode` (`trackingCode`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela user_addresses
CREATE TABLE `user_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `label` VARCHAR(50) NULL,
  `street` VARCHAR(255) NOT NULL,
  `number` VARCHAR(20) NOT NULL,
  `complement` VARCHAR(255) NULL,
  `neighborhood` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(2) NOT NULL,
  `zipCode` VARCHAR(10) NOT NULL,
  `country` VARCHAR(2) NOT NULL DEFAULT 'BR',
  `reference` TEXT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT FALSE,
  `recipientName` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_zipCode` (`zipCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campos em orders
ALTER TABLE `orders`
  ADD COLUMN `shippingMethod` VARCHAR(50) NULL AFTER `status`,
  ADD COLUMN `shippingCost` DECIMAL(10, 2) NULL AFTER `shippingMethod`,
  ADD COLUMN `shippingAddressId` INT NULL AFTER `shippingCost`,
  ADD FOREIGN KEY (`shippingAddressId`) REFERENCES `user_addresses`(`id`) ON DELETE SET NULL;
```

---

## 🗄️ Migration 4: Sistema de Wishlist

### Objetivo
Criar estrutura para lista de desejos.

### Status
✅ **CONCLUÍDA** - Migration executada com sucesso

### SQL de Migração

```sql
CREATE TABLE `wishlist_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `variantId` INT NULL,
  `notes` TEXT NULL,
  `priority` INT NOT NULL DEFAULT 0,
  `isPublic` BOOLEAN NOT NULL DEFAULT FALSE,
  `shareCode` VARCHAR(50) NULL UNIQUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_wishlist_item` (`userId`, `productId`, `variantId`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_productId` (`productId`),
  INDEX `idx_shareCode` (`shareCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Validação

```sql
-- Verificar tabela criada
DESCRIBE wishlist_items;

-- Verificar contagem de registros
SELECT COUNT(*) FROM wishlist_items;
```

### Rollback

```sql
-- Remover tabela
DROP TABLE IF EXISTS wishlist_items;
```

---

## 🗄️ Migration 5: Sistema de Chat/Suporte

### Objetivo
Criar estrutura para tickets e mensagens de chat.

### SQL de Migração

```sql
-- Criar tabela tickets
CREATE TABLE `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
  `assignedToId` INT NULL,
  `orderId` INT NULL,
  `resolution` TEXT NULL,
  `resolvedAt` DATETIME NULL,
  `resolvedById` INT NULL,
  `firstResponseAt` DATETIME NULL,
  `averageResponseTime` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_assignedToId` (`assignedToId`),
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela chat_messages
CREATE TABLE `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticketId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `senderIsAdmin` BOOLEAN NOT NULL DEFAULT FALSE,
  `content` TEXT NOT NULL,
  `messageType` VARCHAR(50) NOT NULL DEFAULT 'text',
  `fileUrl` TEXT NULL,
  `fileName` VARCHAR(255) NULL,
  `fileSize` INT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticketId` (`ticketId`),
  INDEX `idx_senderId` (`senderId`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela faqs (opcional)
CREATE TABLE `faqs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `views` INT NOT NULL DEFAULT 0,
  `helpful` INT NOT NULL DEFAULT 0,
  `notHelpful` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_category` (`category`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🗄️ Migration 6: Sistema de Segurança (2FA e Auditoria)

### Objetivo
Adicionar campos de segurança ao User e criar tabela de auditoria.

### SQL de Migração

```sql
-- Adicionar campos 2FA em users
ALTER TABLE `users`
  ADD COLUMN `twoFactorSecret` VARCHAR(255) NULL AFTER `password`,
  ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT FALSE AFTER `twoFactorSecret`,
  ADD COLUMN `twoFactorBackupCodes` TEXT NULL AFTER `twoFactorEnabled`;

-- Criar tabela audit_logs
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NULL,
  `userEmail` VARCHAR(255) NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(100) NOT NULL,
  `resourceId` INT NULL,
  `description` TEXT NULL,
  `changes` TEXT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` TEXT NULL,
  `orderId` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_action` (`action`),
  INDEX `idx_resource` (`resource`, `resourceId`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔄 Ordem de Execução

1. **Migration 1**: Sistema de Pagamentos
2. **Migration 2**: Sistema de Estoque Avançado
3. **Migration 3**: Sistema de Frete e Endereços
4. **Migration 4**: Sistema de Wishlist
5. **Migration 5**: Sistema de Chat/Suporte
6. **Migration 6**: Sistema de Segurança

---

## ⚠️ Observações Importantes

### Backup
**SEMPRE fazer backup antes de executar migrations:**

```bash
# Backup do banco de dados
mysqldump -u root -p primeiratroca > backup_v1.2_to_v2.0_$(date +%Y%m%d).sql
```

### Execução
```bash
# Gerar migrations
npm run db:generate

# Aplicar migrations
npm run db:push

# OU usar Prisma Migrate (recomendado para produção)
npx prisma migrate dev --name add_payment_system
npx prisma migrate dev --name add_stock_system
# ... etc
```

### Validação Pós-Migração

```sql
-- Verificar todas as tabelas criadas
SHOW TABLES;

-- Verificar estrutura de tabelas importantes
DESCRIBE payments;
DESCRIBE product_variants;
DESCRIBE shipping_trackings;
DESCRIBE wishlist_items;
DESCRIBE tickets;
DESCRIBE audit_logs;

-- Verificar contagem de registros
SELECT 'payments' as tabela, COUNT(*) as registros FROM payments
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL
SELECT 'stock_movements', COUNT(*) FROM stock_movements
UNION ALL
SELECT 'shipping_trackings', COUNT(*) FROM shipping_trackings
UNION ALL
SELECT 'wishlist_items', COUNT(*) FROM wishlist_items
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
```

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Planejamento

