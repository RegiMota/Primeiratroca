# 📚 Documentação da API - Primeira Troca

Documentação completa das rotas da API RESTful da loja Primeira Troca.

## 🔗 Base URL

```
http://localhost:5000/api
```

## 🔐 Autenticação

A maioria das rotas requer autenticação via JWT (JSON Web Token). O token deve ser enviado no header:

```
Authorization: Bearer <seu_token>
```

O token é retornado nas rotas de login e registro e expira em 7 dias.

---

## 🔑 Autenticação (`/api/auth`)

### POST `/api/auth/register`

Registra um novo usuário.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "isAdmin": false
  }
}
```

**Erros:**
- `400` - Email já cadastrado
- `400` - Campos obrigatórios faltando

---

### POST `/api/auth/login`

Autentica um usuário existente.

**Request Body:**
```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "isAdmin": false
  }
}
```

**Erros:**
- `401` - Credenciais inválidas

---

### GET `/api/auth/me`

Obtém informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "isAdmin": false
  }
}
```

**Erros:**
- `401` - Token inválido ou expirado

---

### POST `/api/auth/forgot-password`

Solicita redefinição de senha. Envia email com token de redefinição.

**Request Body:**
```json
{
  "email": "joao@exemplo.com"
}
```

**Response 200:**
```json
{
  "message": "Se o email existir, você receberá um link para redefinir sua senha."
}
```

**Erros:**
- `400` - Email obrigatório

**Nota**: Por questões de segurança, sempre retorna a mesma mensagem, mesmo se o email não existir.

---

### POST `/api/auth/reset-password`

Redefine a senha usando o token recebido por email.

**Request Body:**
```json
{
  "token": "token_recebido_por_email",
  "password": "novaSenha123"
}
```

**Response 200:**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

**Erros:**
- `400` - Token e senha são obrigatórios
- `400` - Token inválido ou expirado

**Nota**: Token expira em 1 hora.

---

## 📦 Produtos (`/api/products`)

### GET `/api/products`

Lista todos os produtos com filtros avançados (v1.2).

**Query Parameters:**
- `category` (string, opcional) - Filtrar por nome da categoria
- `featured` (boolean, opcional) - Filtrar produtos em destaque
- `search` (string, opcional) - Buscar por nome ou descrição (case-insensitive)
- `minPrice` (number, opcional) - Preço mínimo
- `maxPrice` (number, opcional) - Preço máximo
- `size` (string, opcional) - Filtrar por tamanho
- `color` (string, opcional) - Filtrar por cor
- `inStock` (boolean, opcional) - Apenas produtos em estoque
- `sortBy` (string, opcional) - Ordenar por: `price`, `name`, `createdAt`, `featured`
- `sortOrder` (string, opcional) - Ordem: `asc` ou `desc` (padrão: `desc`)

**Exemplo:**
```
GET /api/products?category=Vestidos&featured=true&search=florido&minPrice=50&maxPrice=200&sortBy=price&sortOrder=asc
```

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Vestido Florido",
    "description": "Vestido lindo para meninas",
    "price": 89.90,
    "originalPrice": 129.90,
    "image": "https://...",
    "category": {
      "id": 1,
      "name": "Vestidos",
      "slug": "vestidos"
    },
    "sizes": ["S", "M", "L"],
    "colors": ["Rosa", "Azul"],
    "featured": true,
    "stock": 50,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/api/products/:id`

Obtém detalhes de um produto específico.

**Response 200:**
```json
{
  "id": 1,
  "name": "Vestido Florido",
  "description": "Vestido lindo para meninas",
  "price": 89.90,
  "originalPrice": 129.90,
  "image": "https://...",
  "category": {
    "id": 1,
    "name": "Vestidos",
    "slug": "vestidos"
  },
  "sizes": ["S", "M", "L"],
  "colors": ["Rosa", "Azul"],
  "featured": true,
  "stock": 50,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Erros:**
- `404` - Produto não encontrado

---

### GET `/api/products/search/suggestions`

Obtém sugestões de busca para autocomplete (v1.2).

**Query Parameters:**
- `q` (string, obrigatório) - Termo de busca (mínimo 2 caracteres)

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Vestido Florido",
    "category": "Vestidos"
  },
  {
    "id": 2,
    "name": "Vestido Rosa",
    "category": "Vestidos"
  }
]
```

**Nota**: Retorna máximo de 10 sugestões, ordenadas por nome.

---

## 🖼️ Imagens de Produtos (`/api/products/:productId/images`) - v1.2

### GET `/api/products/:productId/images`

Lista todas as imagens de um produto (público).

**Response 200:**
```json
[
  {
    "id": 1,
    "productId": 1,
    "url": "https://...",
    "isPrimary": true,
    "order": 0,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### POST `/api/products/:productId/images`

Adiciona uma nova imagem ao produto (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "data:image/jpeg;base64,...",
  "isPrimary": false,
  "order": 1
}
```

**Response 201:**
```json
{
  "id": 1,
  "productId": 1,
  "url": "data:image/jpeg;base64,...",
  "isPrimary": false,
  "order": 1,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400` - URL obrigatória
- `400` - URL inválida (deve ser URL ou base64)
- `404` - Produto não encontrado
- `401` - Não autenticado
- `403` - Não é admin

---

### PUT `/api/products/:productId/images/:imageId`

Atualiza uma imagem do produto (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://...",
  "isPrimary": true,
  "order": 0
}
```

**Response 200:**
```json
{
  "id": 1,
  "productId": 1,
  "url": "https://...",
  "isPrimary": true,
  "order": 0,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Nota**: Ao definir `isPrimary: true`, outras imagens primárias são automaticamente desmarcadas.

---

### PATCH `/api/products/:productId/images/:imageId/primary`

Define uma imagem como primária (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "productId": 1,
  "url": "https://...",
  "isPrimary": true,
  "order": 0,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### DELETE `/api/products/:productId/images/:imageId`

Remove uma imagem do produto (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Imagem deletada com sucesso"
}
```

**Nota**: Se a imagem deletada era primária, a próxima imagem da lista é automaticamente definida como primária.

---

## 🏷️ Categorias (`/api/categories`)

### GET `/api/categories`

Lista todas as categorias.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Vestidos",
    "slug": "vestidos",
    "description": "Lindos vestidos para meninas",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## 🛒 Pedidos (`/api/orders`)

### POST `/api/orders`

Cria um novo pedido. Requer autenticação.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "size": "M",
      "color": "Rosa"
    }
  ],
  "shippingAddress": "Rua das Flores, 123 - São Paulo, SP - CEP: 01234-567",
  "paymentMethod": "credit_card",
  "couponCode": "DESCONTO10"
}
```

**Nota**: A partir da v1.2, o campo `couponCode` (opcional) pode ser incluído para aplicar um cupom de desconto.

**Response 201:**
```json
{
  "id": 1,
  "userId": 1,
  "status": "pending",
  "total": 179.80,
  "shippingAddress": "Rua das Flores, 123...",
  "paymentMethod": "credit_card",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "size": "M",
      "color": "Rosa",
      "price": 89.90,
      "product": {
        "id": 1,
        "name": "Vestido Florido",
        "price": 89.90
      }
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400` - Itens do pedido são obrigatórios
- `400` - Estoque insuficiente
- `404` - Produto não encontrado

---

### GET `/api/orders`

Lista todos os pedidos do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "status": "pending",
    "total": 179.80,
    "items": [...],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/api/orders/:id`

Obtém detalhes de um pedido específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "status": "pending",
  "total": 179.80,
  "shippingAddress": "Rua das Flores, 123...",
  "paymentMethod": "credit_card",
  "items": [...],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Erros:**
- `404` - Pedido não encontrado
- `403` - Pedido pertence a outro usuário

**Nota**: A partir da v1.2, o campo `couponCode` pode ser incluído no body para aplicar um cupom de desconto. Se válido, o campo `discountAmount` será adicionado ao pedido.

---

## 🎟️ Cupons (`/api/coupons`) - v1.2

### POST `/api/coupons/validate`

Valida um cupom de desconto (público, não requer autenticação).

**Request Body:**
```json
{
  "code": "DESCONTO10",
  "total": 100.00
}
```

**Response 200 (Válido):**
```json
{
  "valid": true,
  "coupon": {
    "id": 1,
    "code": "DESCONTO10",
    "discountType": "percentage",
    "discountValue": 10,
    "minPurchase": 50.00,
    "maxDiscount": 20.00
  },
  "discountAmount": 10.00,
  "finalTotal": 90.00
}
```

**Response 200 (Inválido):**
```json
{
  "valid": false,
  "error": "Cupom não encontrado"
}
```

**Possíveis Erros:**
- `400` - Código e total são obrigatórios
- `500` - Erro ao validar cupom

**Validações:**
- Cupom deve estar ativo
- Deve estar dentro do período de validade
- Não deve ter atingido o limite de usos
- Total deve ser maior ou igual ao valor mínimo de compra

---

### GET `/api/coupons`

Lista todos os cupons (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isActive` (boolean, opcional) - Filtrar por cupons ativos
- `code` (string, opcional) - Buscar por código

**Response 200:**
```json
[
  {
    "id": 1,
    "code": "DESCONTO10",
    "description": "10% de desconto",
    "discountType": "percentage",
    "discountValue": 10,
    "minPurchase": 50.00,
    "maxDiscount": 20.00,
    "maxUses": 100,
    "currentUses": 5,
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validUntil": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "orderCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/api/coupons/:id`

Obtém detalhes de um cupom específico (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "code": "DESCONTO10",
  "description": "10% de desconto",
  "discountType": "percentage",
  "discountValue": 10,
  "minPurchase": 50.00,
  "maxDiscount": 20.00,
  "maxUses": 100,
  "currentUses": 5,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "isActive": true,
  "orderCount": 5,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### POST `/api/coupons`

Cria um novo cupom (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "DESCONTO10",
  "description": "10% de desconto",
  "discountType": "percentage",
  "discountValue": 10,
  "minPurchase": 50.00,
  "maxDiscount": 20.00,
  "maxUses": 100,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "isActive": true
}
```

**Response 201:**
```json
{
  "id": 1,
  "code": "DESCONTO10",
  ...
}
```

**Erros:**
- `400` - Campos obrigatórios faltando
- `409` - Código de cupom já existe

**Campos Obrigatórios:**
- `code` - Código do cupom (único, maiúsculas)
- `discountType` - Tipo: `percentage` ou `fixed`
- `discountValue` - Valor do desconto
- `validFrom` - Data de início (ISO 8601)
- `validUntil` - Data de término (ISO 8601)

---

### PUT `/api/coupons/:id`

Atualiza um cupom (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (mesmo formato do POST, campos opcionais)

**Response 200:**
```json
{
  "id": 1,
  "code": "DESCONTO10",
  ...
}
```

---

### DELETE `/api/coupons/:id`

Remove um cupom (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Cupom deletado com sucesso"
}
```

---

## 🔔 Notificações (`/api/notifications`) - v1.2

### GET `/api/notifications`

Lista todas as notificações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isRead` (boolean, opcional) - Filtrar por notificações lidas/não lidas
- `limit` (number, opcional) - Limite de resultados (padrão: 50)

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "type": "order_created",
    "title": "Novo Pedido",
    "message": "Você recebeu um novo pedido",
    "data": {
      "orderId": 123
    },
    "isRead": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Tipos de Notificação:**
- `order_created` - Novo pedido (admin)
- `order_status_updated` - Status do pedido atualizado
- `low_stock` - Estoque baixo (admin)
- `coupon_used` - Cupom utilizado (admin)

---

### GET `/api/notifications/unread-count`

Obtém o número de notificações não lidas.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "count": 5
}
```

---

### GET `/api/notifications/:id`

Obtém detalhes de uma notificação específica.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "userId": 1,
  "type": "order_created",
  "title": "Novo Pedido",
  "message": "Você recebeu um novo pedido",
  "data": {
    "orderId": 123
  },
  "isRead": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Erros:**
- `404` - Notificação não encontrada ou não pertence ao usuário

---

### PATCH `/api/notifications/:id/read`

Marca uma notificação como lida.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "userId": 1,
  "type": "order_created",
  "title": "Novo Pedido",
  "message": "Você recebeu um novo pedido",
  "isRead": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### PATCH `/api/notifications/read-all`

Marca todas as notificações do usuário como lidas.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Todas as notificações foram marcadas como lidas",
  "updated": 5
}
```

---

### DELETE `/api/notifications/:id`

Remove uma notificação.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Notificação deletada com sucesso"
}
```

---

## 👨‍💼 Admin (`/api/admin`)

Todas as rotas admin requerem autenticação e permissão de administrador.

### GET `/api/admin/dashboard`

Obtém estatísticas do dashboard.

**Response 200:**
```json
{
  "stats": {
    "totalUsers": 150,
    "totalProducts": 50,
    "totalOrders": 320,
    "totalRevenue": 45678.90
  },
  "recentOrders": [...],
  "topProducts": [...]
}
```

---

### GET `/api/admin/orders`

Lista todos os pedidos (com filtro opcional).

**Query Parameters:**
- `status` (string, opcional) - Filtrar por status (pending, processing, shipped, delivered, cancelled)

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "status": "pending",
    "total": 179.80,
    "user": {
      "name": "João Silva",
      "email": "joao@exemplo.com"
    },
    "items": [...],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### PATCH `/api/admin/orders/:id`

Atualiza o status de um pedido.

**Request Body:**
```json
{
  "status": "processing"
}
```

**Status válidos:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

**Response 200:**
```json
{
  "id": 1,
  "status": "processing",
  ...
}
```

---

### POST `/api/admin/products`

Cria um novo produto.

**Request Body:**
```json
{
  "name": "Vestido Novo",
  "description": "Descrição do produto",
  "price": 89.90,
  "originalPrice": 129.90,
  "image": "https://...",
  "categoryId": 1,
  "sizes": ["S", "M", "L"],
  "colors": ["Rosa", "Azul"],
  "featured": true,
  "stock": 50
}
```

**Response 201:**
```json
{
  "id": 1,
  "name": "Vestido Novo",
  ...
}
```

---

### PUT `/api/admin/products/:id`

Atualiza um produto existente.

**Request Body:** (mesmos campos do POST, todos opcionais)

**Response 200:**
```json
{
  "id": 1,
  "name": "Vestido Atualizado",
  ...
}
```

---

### DELETE `/api/admin/products/:id`

Deleta um produto.

**Response 200:**
```json
{
  "message": "Produto deletado com sucesso"
}
```

---

### POST `/api/admin/categories`

Cria uma nova categoria.

**Request Body:**
```json
{
  "name": "Camisetas",
  "slug": "camisetas",
  "description": "Lindas camisetas" // opcional
}
```

**Response 201:**
```json
{
  "id": 1,
  "name": "Camisetas",
  "slug": "camisetas",
  ...
}
```

---

### PUT `/api/admin/categories/:id`

Atualiza uma categoria.

**Response 200:**
```json
{
  "id": 1,
  "name": "Camisetas Atualizadas",
  ...
}
```

---

### DELETE `/api/admin/categories/:id`

Deleta uma categoria.

**Response 200:**
```json
{
  "message": "Categoria deletada com sucesso"
}
```

---

### GET `/api/admin/users`

Lista todos os usuários.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "isAdmin": false,
    "ordersCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### PUT `/api/admin/users/:id`

Atualiza um usuário.

**Request Body:**
```json
{
  "name": "João Silva Atualizado",
  "email": "joao.novo@exemplo.com",
  "isAdmin": false
}
```

**Response 200:**
```json
{
  "id": 1,
  "name": "João Silva Atualizado",
  ...
}
```

**Erros:**
- `400` - Email já está em uso
- `404` - Usuário não encontrado

---

### DELETE `/api/admin/users/:id`

Deleta um usuário.

**Response 200:**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

**Erros:**
- `400` - Não é possível deletar seu próprio usuário

---

### GET `/api/admin/reports/sales`

Obtém relatório de vendas.

**Query Parameters:**
- `startDate` (string, opcional) - Data inicial (YYYY-MM-DD)
- `endDate` (string, opcional) - Data final (YYYY-MM-DD)
- `status` (string, opcional) - Filtrar por status

**Response 200:**
```json
{
  "summary": {
    "totalOrders": 100,
    "totalRevenue": 12345.67,
    "totalItems": 250,
    "byStatus": {
      "pending": 10,
      "processing": 5,
      "shipped": 20,
      "delivered": 60,
      "cancelled": 5
    }
  },
  "orders": [...]
}
```

---

### GET `/api/admin/reports/sales/export`

Exporta relatório de vendas em CSV.

**Query Parameters:** (mesmos do GET `/reports/sales`)

**Response:**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="relatorio-vendas-YYYY-MM-DD.csv"`
- Body: Arquivo CSV

---

### GET `/api/admin/analytics/overview` - v1.2

Obtém visão geral das métricas de analytics (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, opcional) - Data inicial (ISO 8601)
- `endDate` (string, opcional) - Data final (ISO 8601)

**Response 200:**
```json
{
  "period": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-01-31T23:59:59.000Z"
  },
  "metrics": {
    "totalOrders": 150,
    "totalRevenue": 15000.00,
    "totalItems": 300,
    "averageTicket": 100.00,
    "conversionRate": 5.5,
    "abandonmentRate": 2.0,
    "couponUsageRate": 15.0,
    "totalDiscount": 1500.00
  },
  "customers": {
    "total": 100,
    "new": 60,
    "returning": 40,
    "newVsReturning": {
      "new": 60,
      "returning": 40
    }
  },
  "topProducts": [
    {
      "productId": 1,
      "name": "Vestido Florido",
      "orders": 50,
      "revenue": 5000.00,
      "items": 50
    }
  ],
  "categoryMetrics": [
    {
      "category": "Vestidos",
      "orders": 80,
      "revenue": 8000.00,
      "items": 160,
      "averageTicket": 100.00
    }
  ],
  "peakHours": [
    { "hour": 14, "count": 30 },
    { "hour": 15, "count": 25 }
  ]
}
```

---

### GET `/api/admin/analytics/trends` - v1.2

Obtém análise de tendências e comparação de períodos (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, opcional) - Data inicial (ISO 8601)
- `endDate` (string, opcional) - Data final (ISO 8601)
- `comparePeriod` (boolean, opcional) - Comparar com período anterior

**Response 200:**
```json
{
  "current": {
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T23:59:59.000Z"
    },
    "metrics": {
      "revenue": 15000.00,
      "orders": 150,
      "averageTicket": 100.00,
      "uniqueCustomers": 100
    }
  },
  "previous": {
    "period": {
      "start": "2024-12-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.000Z"
    },
    "metrics": {
      "revenue": 12000.00,
      "orders": 120,
      "averageTicket": 100.00,
      "uniqueCustomers": 80
    }
  },
  "changes": {
    "revenue": 25.0,
    "orders": 25.0,
    "averageTicket": 0.0,
    "customers": 25.0
  },
  "trendData": [
    {
      "date": "2025-01-01",
      "revenue": 500.00,
      "orders": 5,
      "customers": 4
    }
  ],
  "categoryAnalysis": [
    {
      "category": "Vestidos",
      "orders": 80,
      "revenue": 8000.00,
      "items": 160
    }
  ]
}
```

**Nota**: Se `comparePeriod` não for `true`, o campo `previous` será `null`.

---

## ❌ Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (token inválido ou expirado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (conflito, ex: email duplicado)
- `422` - Validation Error (erro de validação)
- `500` - Server Error (erro interno)

---

## 📝 Formatos de Dados

### Status de Pedido
- `pending` - Pendente
- `processing` - Processando
- `shipped` - Enviado
- `delivered` - Entregue
- `cancelled` - Cancelado

### Método de Pagamento
- `credit_card` - Cartão de Crédito
- `debit_card` - Cartão de Débito
- `pix` - PIX
- `boleto` - Boleto

---

## 🔒 Permissões

### Rotas Públicas
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/search/suggestions`
- `GET /api/products/:productId/images`
- `GET /api/categories`
- `POST /api/coupons/validate`

### Rotas Autenticadas (usuário comum)
- `GET /api/auth/me`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/notifications/:id`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Rotas Admin (requer `isAdmin: true`)
- Todas as rotas `/api/admin/*`
- `GET /api/coupons`
- `POST /api/coupons`
- `PUT /api/coupons/:id`
- `DELETE /api/coupons/:id`
- `GET /api/coupons/:id`
- `POST /api/products/:productId/images`
- `PUT /api/products/:productId/images/:imageId`
- `PATCH /api/products/:productId/images/:imageId/primary`
- `DELETE /api/products/:productId/images/:imageId`

---

## 🐛 Tratamento de Erros

Todos os erros retornam no formato:

```json
{
  "error": "Mensagem de erro descritiva"
}
```

Em desenvolvimento, erros podem incluir `stack` trace adicional.

---

## ⚠️ Notas Importantes

1. **Tamanhos e Cores**: São armazenados como JSON string no banco, mas são retornados como arrays no frontend
2. **Preços**: São armazenados como `Decimal` no MySQL e convertidos para `number` no JSON
3. **Tokens JWT**: Expiraram em 7 dias
4. **Timeouts**: Requisições têm timeout de 10 segundos
5. **CORS**: Configurado para aceitar requisições de qualquer origem (ajustar em produção)

---

## 🔄 Versão da API

Versão atual: **1.2.0**

**Novidades da v1.2:**
- ✅ Upload de múltiplas imagens por produto
- ✅ Sistema completo de cupons e descontos
- ✅ Sistema de notificações em tempo real (polling)
- ✅ Recuperação de senha por email
- ✅ Dashboard de analytics avançado
- ✅ Busca avançada com filtros múltiplos e sugestões

**Compatibilidade:**
- ✅ Todas as rotas da v1.0 continuam funcionando
- ✅ Compatibilidade backward garantida

Última atualização: Janeiro 2025

