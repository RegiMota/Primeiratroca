# 🔔 Documentação: Módulo 3 - Sistema de Notificações

## 📋 Visão Geral

O sistema de notificações permite que usuários (clientes e administradores) recebam alertas em tempo real sobre eventos importantes no sistema, como novos pedidos, atualizações de status, estoque baixo e uso de cupons.

---

## 🏗️ Arquitetura

### Backend

#### 1. **NotificationService** (`server/services/NotificationService.ts`)
Serviço centralizado que cria notificações no banco de dados.

**Métodos Principais:**
- `createNotification()` - Cria uma notificação genérica
- `notifyNewOrder()` - Notifica admins sobre novo pedido
- `notifyOrderStatusUpdate()` - Notifica cliente sobre mudança de status
- `notifyLowStock()` - Notifica admins sobre estoque baixo
- `notifyCouponUsed()` - Notifica admins sobre cupom usado

#### 2. **Rotas de API** (`server/routes/notifications.ts`)
- `GET /api/notifications` - Lista todas as notificações do usuário
- `GET /api/notifications/unread-count` - Conta notificações não lidas
- `GET /api/notifications/:id` - Busca uma notificação específica
- `PATCH /api/notifications/:id/read` - Marca como lida
- `PATCH /api/notifications/read-all` - Marca todas como lidas
- `DELETE /api/notifications/:id` - Deleta uma notificação

### Frontend

#### 1. **NotificationContext** (`src/contexts/NotificationContext.tsx`)
Contexto React que gerencia o estado das notificações:
- Armazena lista de notificações
- Mantém contagem de não lidas
- Faz polling automático a cada 30 segundos
- Fornece métodos para gerenciar notificações

#### 2. **NotificationDropdown** (`src/components/NotificationDropdown.tsx`)
Componente de interface que exibe:
- Badge com contagem de não lidas no sino 🔔
- Dropdown com lista de notificações
- Separação entre lidas e não lidas
- Ações: marcar como lida, deletar, navegar

---

## 🎯 Tipos de Notificações

### 1. **Pedidos (order)**
- **Quando:** Novo pedido criado ou status atualizado
- **Para quem:**
  - **Admins**: Quando um pedido é criado
  - **Cliente**: Quando o status do pedido muda
- **Exemplo:**
  - Admin: "Novo Pedido Recebido - Pedido #123 de João no valor de R$ 150.00"
  - Cliente: "Status do Pedido Atualizado - Pedido #123 de 'Pendente' para 'Enviado'"

### 2. **Estoque (stock)**
- **Quando:** Produto fica com estoque abaixo de 10 unidades
- **Para quem:** Apenas admins
- **Exemplo:** "Estoque Baixo - O produto 'Camiseta Infantil' está com estoque baixo (5 unidades restantes)"

### 3. **Cupons (coupon)**
- **Quando:** Um cupom é usado em um pedido
- **Para quem:** Apenas admins
- **Exemplo:** "Cupom Utilizado - O cupom 'DESCONTO10' foi utilizado no pedido #123 com desconto de R$ 15.00"

### 4. **Sistema (system)**
- **Quando:** Eventos gerais do sistema
- **Para quem:** Qualquer usuário
- **Exemplo:** "Bem-vindo ao sistema!" ou "Manutenção programada"

---

## ⚙️ Como Funciona na Prática

### Fluxo de Uma Notificação

```
1. EVENTO OCORRE (ex: pedido criado)
   ↓
2. SERVIÇO DETECTA (ex: NotificationService.notifyNewOrder())
   ↓
3. NOTIFICAÇÃO CRIADA NO BANCO (tabela notifications)
   ↓
4. FRONTEND FAZ POLLING (a cada 30 segundos)
   ↓
5. NOTIFICAÇÃO APARECE NO DROPDOWN
   ↓
6. USUÁRIO CLICA E MARCAR COMO LIDA
```

### Exemplo: Novo Pedido

**Backend:**
```typescript
// Quando um pedido é criado (server/routes/orders.ts)
await NotificationService.notifyNewOrder(
  order.id,        // ID do pedido
  total,           // Valor total
  user?.name       // Nome do cliente
);
```

**O que acontece:**
1. Busca todos os usuários admin
2. Cria uma notificação para cada admin
3. Salva no banco de dados
4. Quando o frontend faz polling (30s), aparece no dropdown

**Frontend:**
- Badge vermelho aparece no sino 🔔 (ex: "3")
- Ao clicar, abre dropdown com notificações
- Notificações não lidas aparecem primeiro com badge "Nova"
- Ao clicar em uma notificação, marca como lida automaticamente
- Pode navegar diretamente para a página relacionada (ex: /orders)

---

## 🔄 Sistema de Polling

### Como Funciona

O sistema usa **polling** (verificação periódica) em vez de WebSocket (postergado):

- **Intervalo:** 30 segundos
- **Início automático:** Quando usuário faz login
- **Parada automática:** Quando usuário faz logout

### Código
```typescript
// src/contexts/NotificationContext.tsx
useEffect(() => {
  if (!isAuthenticated) return;
  
  // Busca inicial
  refreshNotifications();
  
  // Polling a cada 30 segundos
  const interval = setInterval(() => {
    refreshNotifications();
  }, 30000);
  
  return () => clearInterval(interval);
}, [isAuthenticated]);
```

### Por que Polling e não WebSocket?

- **Simples e confiável:** Não precisa de conexão persistente
- **Funciona atrás de proxy/firewall:** Mais fácil de configurar
- **Fallback automático:** Se falhar, tenta novamente em 30s
- **Postergado:** WebSocket será implementado depois (Dia 2)

---

## 📊 Estrutura de Dados

### Tabela `notifications` (Prisma)
```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int      // ID do usuário que receberá
  type      String   // 'order' | 'stock' | 'system' | 'coupon'
  title     String   // Título da notificação
  message   String   // Mensagem da notificação
  data      String?  // JSON com dados extras (orderId, productId, etc.)
  isRead    Boolean  @default(false) // Se foi lida
  createdAt DateTime @default(now())
}
```

### Dados Extras (campo `data` como JSON)
```json
// Exemplo para notificação de pedido
{
  "orderId": 123,
  "orderTotal": 150.00
}

// Exemplo para notificação de estoque
{
  "productId": 45,
  "productName": "Camiseta Infantil",
  "currentStock": 5
}
```

---

## 🎨 Interface do Usuário

### Badge no Header
- **Sino 🔔** sempre visível (se autenticado)
- **Badge vermelho** com número quando há não lidas
- **Máximo "9+"** se tiver mais de 9 não lidas

### Dropdown de Notificações
- **Título:** "Notificações" + botão "Marcar todas como lidas"
- **Seção de Não Lidas:**
  - Badge "Nova" vermelho
  - Ícone colorido por tipo
  - Título e mensagem em negrito
  - Tempo relativo (ex: "5m atrás")
  - Botão X para deletar
- **Seção de Lidas:**
  - Opacidade reduzida (70%)
  - Ícone colorido
  - Título e mensagem normais
  - Tempo relativo
  - Botão X para deletar

### Ícones por Tipo
- **Pedido:** 🛒 ShoppingCart (azul)
- **Estoque:** 📦 Package (laranja)
- **Sistema:** ⚠️ AlertCircle (roxo)
- **Cupom:** 🏷️ Tag (verde)

---

## 🔗 Integração com Outros Módulos

### Quando Notificações São Criadas

#### 1. **Novo Pedido Criado** (`server/routes/orders.ts`)
```typescript
// Cria notificação para TODOS os admins
await NotificationService.notifyNewOrder(orderId, total, userName);
```

#### 2. **Status do Pedido Atualizado** (`server/routes/admin.ts`)
```typescript
// Cria notificação apenas para o CLIENTE dono do pedido
await NotificationService.notifyOrderStatusUpdate(userId, orderId, oldStatus, newStatus);
```

#### 3. **Estoque Baixo** (`server/routes/admin.ts`)
```typescript
// Quando produto fica com menos de 10 unidades
if (currentStock < 10 && oldStock >= 10) {
  await NotificationService.notifyLowStock(productId, productName, currentStock);
}
```

#### 4. **Cupom Usado** (`server/routes/orders.ts`)
```typescript
// Quando cupom é aplicado em um pedido
await NotificationService.notifyCouponUsed(couponId, couponCode, orderId, discountAmount);
```

---

## 🧪 Como Testar

### 1. Testar Notificação de Pedido
1. Faça login como admin
2. Em outra aba/navegador, faça login como cliente
3. Cliente: Crie um pedido
4. Admin: Veja o badge no sino com "+1"
5. Clique no sino para ver a notificação

### 2. Testar Notificação de Status
1. Faça login como cliente
2. Admin: Altere o status de um pedido do cliente
3. Cliente: Veja a notificação aparecer em até 30 segundos

### 3. Testar Notificação de Estoque
1. Faça login como admin
2. Atualize um produto deixando estoque < 10
3. Veja a notificação aparecer automaticamente

### 4. Testar Notificação de Cupom
1. Crie um cupom no painel admin
2. Cliente: Use o cupom em um pedido
3. Admin: Veja a notificação sobre o cupom usado

---

## ⚡ Performance

### Otimizações Implementadas

1. **Polling Inteligente:** 
   - Só funciona quando usuário está autenticado
   - Para automaticamente no logout
   - Não bloqueia interface

2. **Limite de Busca:**
   - Busca máximo 50 notificações por vez
   - Ordena por mais recentes primeiro

3. **Atualização Local:**
   - Quando marca como lida, atualiza localmente primeiro
   - Depois envia para o servidor (otimismo)

4. **Navegação Rápida:**
   - Notificações clicáveis navegam diretamente
   - Marca como lida automaticamente ao clicar

---

## 🔮 Melhorias Futuras (WebSocket)

Quando implementar WebSocket (Dia 2):

1. **Substituir Polling:**
   - Remover `setInterval` do NotificationContext
   - Conectar via Socket.io ao fazer login

2. **Receber em Tempo Real:**
   - Notificações aparecem instantaneamente
   - Sem esperar 30 segundos

3. **Compatibilidade:**
   - Manter API REST para fallback
   - Sistema continua funcionando mesmo sem WebSocket

---

## 📝 Resumo Rápido

✅ **O que faz:**
- Notifica usuários sobre eventos importantes
- Mostra badge com contagem de não lidas
- Permite gerenciar (marcar lida, deletar)

✅ **Quando cria:**
- Novo pedido → notifica admins
- Status atualizado → notifica cliente
- Estoque baixo → notifica admins
- Cupom usado → notifica admins

✅ **Como funciona:**
- Polling automático a cada 30 segundos
- Interface no Header (sino 🔔)
- Dropdown com lista de notificações

✅ **Tipos:**
- Pedidos (azul 🛒)
- Estoque (laranja 📦)
- Sistema (roxo ⚠️)
- Cupons (verde 🏷️)

---

**Última Atualização:** Janeiro 2025  
**Status:** ✅ 100% Funcional (usando polling)

