# Integração com Mercado Pago

Este documento descreve a integração do sistema de pagamentos com o Mercado Pago.

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=TEST-...  # Access Token do Mercado Pago (test ou production)
MERCADOPAGO_PUBLIC_KEY=TEST-...  # Public Key do Mercado Pago (para frontend)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-...  # Public Key para o frontend (Vite)
```

### 2. Obter as Chaves do Mercado Pago

1. Acesse o [Dashboard do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Suas integrações** > **Credenciais**
3. Copie o **Access Token** (começa com `TEST-` para teste ou `APP_USR-` para produção)
4. Copie a **Public Key** (começa com `TEST-` para teste ou `APP_USR-` para produção)

### 3. Configurar Webhook

1. No Dashboard do Mercado Pago, vá em **Suas integrações** > **Webhooks**
2. Clique em **Criar webhook**
3. Configure a URL do webhook: `https://seu-dominio.com/api/payments/webhook/mercadopago`
4. Selecione os eventos:
   - `payment`
   - `merchant_order`
5. Salve a configuração

## Estrutura da Integração

### Backend

#### Serviços

- **`MercadoPagoService.ts`**: Serviço principal de integração com Mercado Pago
  - `createPreference()`: Cria uma preferência de pagamento (Checkout Pro)
  - `createPayment()`: Cria um pagamento direto (Checkout Transparente)
  - `handleWebhook()`: Processa webhooks do Mercado Pago
  - `refundPayment()`: Processa reembolsos

- **`PaymentService.ts`**: Serviço de pagamentos atualizado
  - Agora integrado com Mercado Pago
  - Mantém compatibilidade com outros gateways

#### Rotas

- `POST /api/payments/process/:id`: Processa um pagamento (cria preferência)
- `POST /api/payments/confirm`: Confirma um pagamento no Mercado Pago (Checkout Transparente)
- `POST /api/payments/webhook/mercadopago`: Recebe webhooks do Mercado Pago

### Frontend

O frontend precisa ser atualizado para usar o Mercado Pago. Veja a seção "Próximos Passos" abaixo.

## Fluxo de Pagamento

### Checkout Pro (Redirecionamento)

1. **Criar Pedido**: O usuário cria um pedido no checkout
2. **Criar Pagamento**: Um registro de pagamento é criado no banco
3. **Processar Pagamento**: 
   - Chama `POST /api/payments/process/:id`
   - Cria uma preferência no Mercado Pago
   - Retorna `init_point` ou `sandbox_init_point` para o frontend
4. **Redirecionar**: Frontend redireciona o usuário para o link de pagamento
5. **Webhook**:
   - Mercado Pago envia webhook quando pagamento é processado
   - Sistema atualiza status do pagamento e pedido automaticamente

### Checkout Transparente (Pagamento no site)

1. **Criar Pedido**: O usuário cria um pedido no checkout
2. **Criar Pagamento**: Um registro de pagamento é criado no banco
3. **Coletar Dados**: Frontend coleta dados do cartão usando Mercado Pago JS
4. **Confirmar Pagamento**:
   - Frontend cria token do cartão
   - Chama `POST /api/payments/confirm` com token
   - Sistema processa pagamento no Mercado Pago
5. **Webhook**:
   - Mercado Pago envia webhook quando pagamento é processado
   - Sistema atualiza status do pagamento e pedido automaticamente

## Próximos Passos

### Frontend

1. Instalar Mercado Pago JS no frontend:
   ```html
   <script src="https://sdk.mercadopago.com/js/v2"></script>
   ```
2. Criar componente de checkout com Mercado Pago
3. Integrar com a página de checkout existente

### Testes

1. Usar credenciais de teste do Mercado Pago:
   - Access Token: `TEST-...`
   - Public Key: `TEST-...`
2. Testar com cartões de teste:
   - Aprovado: `5031 4332 1540 6351`
   - Recusado: `5031 4332 1540 6351` (com CVV específico)

## Documentação

- [Mercado Pago Developers](https://www.mercadopago.com.br/developers/pt)
- [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro)
- [Checkout API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

