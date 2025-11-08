# 🔄 Migrations - Versão 1.2
## Primeira Troca - Scripts de Migração do Banco de Dados

**Data**: Janeiro 2025  
**Versão**: 1.2.0  
**Status**: 📋 Planejamento

---

## ⚠️ Importante: Backward Compatibility

Todas as migrations foram projetadas para **não quebrar** o sistema atual:
- ✅ Novas tabelas não afetam tabelas existentes
- ✅ Novos campos são opcionais (nullable)
- ✅ Dados existentes são preservados
- ✅ Rollback seguro disponível

---

## 📋 Migrations Necessárias

### Migration 1: ProductImage (Módulo 1)

**Arquivo**: `prisma/migrations/v1.2_product_images/migration.sql`

```sql
-- CreateTable
CREATE TABLE `product_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_images_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

**Prisma Schema Change:**
```prisma
// Adicionar ao modelo Product
model Product {
  // ... campos existentes ...
  images     ProductImage[]
}

// Novo modelo
model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   @db.Text
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([productId])
  @@map("product_images")
}
```

**Rollback:**
```sql
-- Se necessário reverter
DROP TABLE IF EXISTS `product_images`;
```

---

### Migration 2: Coupon (Módulo 2)

**Arquivo**: `prisma/migrations/v1.2_coupons/migration.sql`

```sql
-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `discountType` VARCHAR(20) NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `minPurchase` DECIMAL(10, 2) NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `maxUses` INTEGER NULL,
    `currentUses` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    INDEX `coupons_code_idx`(`code`),
    INDEX `coupons_active_dates_idx`(`isActive`, `validFrom`, `validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Prisma Schema Change:**
```prisma
// Novo modelo
model Coupon {
  id           Int      @id @default(autoincrement())
  code         String   @unique @db.VarChar(50)
  discountType String   @db.VarChar(20)
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
  
  @@index([code])
  @@index([isActive, validFrom, validUntil])
  @@map("coupons")
}

// Atualizar modelo Order
model Order {
  // ... campos existentes ...
  couponId      Int?
  coupon        Coupon? @relation(fields: [couponId], references: [id])
  discountAmount Decimal? @db.Decimal(10, 2)
  // ... resto dos campos ...
}
```

**Rollback:**
```sql
-- Se necessário reverter (CUIDADO: Remove dados de cupons)
ALTER TABLE `orders` DROP FOREIGN KEY `orders_couponId_fkey`;
ALTER TABLE `orders` DROP COLUMN `couponId`;
ALTER TABLE `orders` DROP COLUMN `discountAmount`;
DROP TABLE IF EXISTS `coupons`;
```

---

### Migration 3: Notification (Módulo 3)

**Arquivo**: `prisma/migrations/v1.2_notifications/migration.sql`

```sql
-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data` TEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_user_read_created_idx`(`userId`, `isRead`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

**Prisma Schema Change:**
```prisma
// Atualizar modelo User
model User {
  // ... campos existentes ...
  notifications Notification[]
}

// Novo modelo
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   @db.VarChar(50)
  title     String   @db.VarChar(255)
  message   String   @db.Text
  data      String?  @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([userId, isRead, createdAt])
  @@map("notifications")
}
```

**Rollback:**
```sql
-- Se necessário reverter
DROP TABLE IF EXISTS `notifications`;
```

---

### Migration 4: Order Fields (Módulo 2)

**Arquivo**: `prisma/migrations/v1.2_order_coupon_fields/migration.sql`

```sql
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `couponId` INTEGER NULL,
ADD COLUMN `discountAmount` DECIMAL(10, 2) NULL;

-- CreateIndex
CREATE INDEX `orders_couponId_idx` ON `orders`(`couponId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

**Nota**: Esta migration deve ser executada **DEPOIS** da migration de Coupons.

**Rollback:**
```sql
-- Se necessário reverter
ALTER TABLE `orders` DROP FOREIGN KEY `orders_couponId_fkey`;
ALTER TABLE `orders` DROP INDEX `orders_couponId_idx`;
ALTER TABLE `orders` DROP COLUMN `couponId`;
ALTER TABLE `orders` DROP COLUMN `discountAmount`;
```

---

## 📝 Ordem de Execução das Migrations

### Ordem Correta:

1. ✅ **Migration 1**: ProductImage
   - Independente, pode ser executada primeiro
   - Não afeta dados existentes

2. ✅ **Migration 2**: Coupon
   - Independente, pode ser executada em qualquer ordem
   - Não afeta dados existentes

3. ✅ **Migration 3**: Notification
   - Independente, pode ser executada em qualquer ordem
   - Não afeta dados existentes

4. ✅ **Migration 4**: Order Fields (couponId, discountAmount)
   - **DEVE** ser executada **DEPOIS** da Migration 2 (Coupon)
   - Adiciona campos nullable, não quebra dados existentes

---

## 🔧 Scripts de Execução

### Opção 1: Usando Prisma Migrate (Recomendado)

```bash
# 1. Atualizar schema.prisma com novos modelos
# 2. Gerar migration
npx prisma migrate dev --name v1.2_product_images
npx prisma migrate dev --name v1.2_coupons
npx prisma migrate dev --name v1.2_notifications
npx prisma migrate dev --name v1.2_order_coupon_fields

# 3. Gerar Prisma Client
npm run db:generate
```

### Opção 2: Usando Prisma DB Push (Desenvolvimento)

```bash
# Atualizar schema.prisma com todos os novos modelos
# Então executar:
npm run db:push

# Gerar Prisma Client
npm run db:generate
```

⚠️ **Atenção**: `db:push` não cria migrations versionadas. Use apenas em desenvolvimento.

---

## ✅ Checklist de Migração

### Pré-Migração
- [ ] Fazer backup do banco de dados
- [ ] Revisar schema.prisma atualizado
- [ ] Verificar variáveis de ambiente
- [ ] Testar migrations em ambiente de desenvolvimento

### Durante Migração
- [ ] Executar Migration 1 (ProductImage)
- [ ] Executar Migration 2 (Coupon)
- [ ] Executar Migration 3 (Notification)
- [ ] Executar Migration 4 (Order Fields)
- [ ] Verificar se tabelas foram criadas corretamente
- [ ] Verificar se índices foram criados

### Pós-Migração
- [ ] Gerar Prisma Client (`npm run db:generate`)
- [ ] Verificar se sistema antigo continua funcionando
- [ ] Testar novas funcionalidades
- [ ] Verificar logs de erro

---

## 🔄 Estratégia de Rollback

### Se Algo Der Errado

1. **Parar o servidor** imediatamente
2. **Reverter migrations** na ordem inversa:
   ```bash
   # Reverter última migration
   npx prisma migrate resolve --rolled-back v1.2_order_coupon_fields
   
   # Ou executar SQL de rollback manualmente
   ```

3. **Restaurar backup** se necessário:
   ```bash
   mysql -u root -p primeiratroca < backup.sql
   ```

4. **Verificar sistema** após rollback

---

## 📊 Validação Pós-Migração

### Queries de Validação

```sql
-- Verificar tabelas criadas
SHOW TABLES LIKE '%product_images%';
SHOW TABLES LIKE '%coupons%';
SHOW TABLES LIKE '%notifications%';

-- Verificar estrutura
DESCRIBE product_images;
DESCRIBE coupons;
DESCRIBE notifications;
DESCRIBE orders;  -- Verificar novos campos

-- Verificar índices
SHOW INDEXES FROM product_images;
SHOW INDEXES FROM coupons;
SHOW INDEXES FROM notifications;
SHOW INDEXES FROM orders;

-- Verificar foreign keys
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM
  INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  TABLE_SCHEMA = 'primeiratroca'
  AND TABLE_NAME IN ('product_images', 'coupons', 'notifications', 'orders')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## ⚠️ Notas Importantes

### Compatibilidade Backward

1. **ProductImage**:
   - Campo `image` (String) em Product será mantido
   - Produtos antigos continuam funcionando
   - Novos produtos podem usar múltiplas imagens

2. **Coupon**:
   - Campos `couponId` e `discountAmount` em Order são NULLABLE
   - Pedidos antigos continuam funcionando sem cupom
   - Novos pedidos podem usar cupom

3. **Notification**:
   - Nova tabela, não afeta dados existentes
   - Usuários existentes começam sem notificações

### Performance

- Todos os índices necessários foram incluídos
- Foreign keys com `ON DELETE CASCADE` onde apropriado
- Foreign keys com `ON DELETE SET NULL` para cupons em pedidos (preserva histórico)

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Planejamento

---

*Estas migrations serão executadas apenas quando o desenvolvimento do módulo correspondente estiver completo e testado.*

