# Configuração do Webhook do Asaas

## ✅ O que foi implementado

### 1. **Notificações em Tempo Real**
- Quando o Asaas confirma um pagamento PIX via webhook, o sistema:
  - Atualiza o status do pagamento no banco de dados
  - Atualiza o status do pedido para "confirmed"
  - Cria uma notificação para o cliente informando que o pagamento foi confirmado
  - Emite evento WebSocket para atualização em tempo real na página do cliente

### 2. **WebSocket para Atualizações Instantâneas**
- A página de pagamento (`/payment/:paymentId`) agora escuta eventos WebSocket
- Quando o pagamento é confirmado, o cliente recebe a notificação instantaneamente
- Fallback para polling a cada 5 segundos se WebSocket não estiver disponível

### 3. **Sincronização Manual no Admin**
- Botão de sincronização na página de pagamentos do admin
- Permite buscar o status atualizado diretamente do Asaas
- Disponível apenas para pagamentos do gateway Asaas

### 4. **Melhorias na Página de Pagamento**
- Mensagem clara quando o pagamento PIX é confirmado
- Redirecionamento automático para página de sucesso
- Suporte a WebSocket para atualizações em tempo real

## 🔧 Configuração Necessária no Asaas

### URL do Webhook

Você precisa configurar a seguinte URL no painel do Asaas:

```
https://seu-dominio.com/api/payments/webhook/asaas
```

**Para desenvolvimento local (usando ngrok ou similar):**
```
https://seu-ngrok-url.ngrok.io/api/payments/webhook/asaas
```

### Como Configurar no Asaas

1. Acesse o painel do Asaas: https://www.asaas.com
2. Vá em **Configurações** → **Webhooks** (menu superior)
3. Clique em **Adicionar Webhook**

#### **Dados do Webhook:**

Preencha os seguintes campos:

- **Este Webhook ficará ativo?**: 
  - ✅ Selecione **"Sim"** para ativar o webhook

- **Nome do Webhook** (obrigatório):
  - Exemplo: `Webhook Pagamentos Primeira Troca`
  - Este campo é obrigatório

- **URL do Webhook** (obrigatório):
  - URL: `https://primeiratrocaecia.com.br/api/payments/webhook/asaas`
  - ⚠️ **IMPORTANTE**: Substitua pelo seu domínio real
  - Este campo é obrigatório

- **E-mail**:
  - Email para receber notificações em caso de falha na sincronização
  - Exemplo: `reginaldomota02@hotmail.com`
  - Você será notificado neste e-mail em caso de falha na sincronia

- **Versão da API**:
  - Selecione **"v3"** (versão atual da API do Asaas)

- **Token de autenticação** (Opcional):
  - Campo opcional para adicionar segurança extra
  - Se configurado, você precisará validar este token no código
  - Por enquanto, pode deixar em branco

- **Fila de sincronização ativada?**:
  - ✅ Selecione **"Sim"** para garantir que os eventos sejam processados na ordem

- **Tipo de envio**:
  - Selecione **"Não sequencial"** (padrão)
  - Permite processar eventos fora de ordem se necessário

#### **Adicionar Eventos:**

Clique na seção **"Cobranças"** e selecione os seguintes eventos (os mais importantes para PIX):

**Eventos Essenciais para PIX:**
- ✅ `PAYMENT_RECEIVED` - **Cobrança recebida** (PIX pago e confirmado)
- ✅ `PAYMENT_CONFIRMED` - **Cobrança confirmada** (pagamento efetuado, saldo ainda não disponibilizado)
- ✅ `PAYMENT_OVERDUE` - **Cobrança vencida** (PIX expirado sem pagamento)

**Eventos Adicionais Recomendados:**
- ✅ `PAYMENT_CREATED` - **Geração de nova cobrança**
- ✅ `PAYMENT_UPDATED` - **Alteração no vencimento ou valor de cobrança existente**
- ✅ `PAYMENT_REFUNDED` - **Cobrança estornada**
- ✅ `PAYMENT_DELETED` - **Cobrança removida**
- ✅ `PAYMENT_ANTICIPATED` - **Cobrança antecipada**

**Eventos para Cartão de Crédito (opcional):**
- ✅ `PAYMENT_AUTHORIZED` - Pagamento em cartão autorizado
- ✅ `PAYMENT_APPROVED_BY_RISK_ANALYSIS` - Pagamento aprovado pela análise de risco
- ✅ `PAYMENT_REPROVED_BY_RISK_ANALYSIS` - Pagamento reprovado pela análise de risco
- ✅ `PAYMENT_AWAITING_RISK_ANALYSIS` - Pagamento aguardando análise de risco

**Dica**: Você pode usar o botão **"Selecionar Todos"** dentro da categoria "Cobranças" para selecionar todos os eventos de uma vez, ou selecionar apenas os eventos essenciais para maior eficiência.

4. Clique em **"Salvar"** para finalizar a configuração

### Eventos Importantes para PIX

Os eventos mais importantes para pagamentos PIX são:
- **`PAYMENT_RECEIVED`** - Quando o PIX é pago e confirmado (saldo já disponível)
- **`PAYMENT_CONFIRMED`** - Quando o pagamento é confirmado (pagamento efetuado, mas saldo ainda não disponibilizado)
- **`PAYMENT_OVERDUE`** - Quando o PIX expira sem pagamento

**Diferença entre PAYMENT_RECEIVED e PAYMENT_CONFIRMED:**
- `PAYMENT_CONFIRMED`: O pagamento foi confirmado, mas o dinheiro ainda não está disponível na conta
- `PAYMENT_RECEIVED`: O pagamento foi recebido e o saldo já está disponível na conta Asaas

Para a maioria dos casos, ambos os eventos são importantes, mas `PAYMENT_RECEIVED` é o mais crítico para confirmar que o pagamento foi realmente recebido.

## 📋 Variáveis de Ambiente Necessárias

Certifique-se de que as seguintes variáveis estão configuradas no `.env`:

```env
# Asaas
ASAAS_API_KEY=seu_token_api_asaas
ASAAS_ENVIRONMENT=production  # ou 'sandbox' para testes

# WebSocket (opcional, mas recomendado para atualizações em tempo real)
SOCKET_IO_ENABLED=true
WEBSOCKET_CORS_ORIGIN=https://primeiratrocaecia.com.br
```

**Nota**: Se você configurou um **Token de autenticação** no webhook do Asaas, será necessário adicionar validação no código. Por enquanto, o sistema funciona sem token.

## 🧪 Testando o Webhook

### 1. Verificar se o Webhook está Ativo

Após configurar, você pode verificar se o webhook está funcionando:

1. Acesse **Configurações** → **Webhooks** no painel do Asaas
2. Verifique se o webhook aparece na lista com status "Ativo"
3. Clique em **"Logs de Webhooks"** para ver os logs de tentativas de envio

### 2. Teste Local com ngrok (Desenvolvimento)

Se estiver testando localmente, use ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 5000

# Use a URL do ngrok no webhook do Asaas
# Exemplo: https://abc123.ngrok.io/api/payments/webhook/asaas
```

### 2. Verificar Logs

Quando o webhook for chamado, você verá logs no console do servidor:

```
🔔 Webhook recebido do gateway: asaas
📦 Headers: {...}
📦 Body: {...}
🔔 Webhook do Asaas recebido: {...}
✅ Status do pagamento atualizado com sucesso via PaymentService
📤 Evento de pagamento aprovado enviado via WebSocket para usuário X
```

### 3. Testar no Admin

1. Acesse a página de pagamentos no admin
2. Encontre um pagamento PIX pendente
3. Clique no botão de sincronização (ícone de refresh azul)
4. O status será atualizado diretamente do Asaas

## 🔍 Troubleshooting

### Webhook não está sendo recebido

1. **Verifique se o webhook está ativo**:
   - No painel do Asaas, vá em **Configurações** → **Webhooks**
   - Confirme que o status está como "Ativo"

2. **Verifique a URL**:
   - A URL deve ser: `https://primeiratrocaecia.com.br/api/payments/webhook/asaas`
   - Certifique-se de que não há espaços ou caracteres especiais
   - A URL deve ser acessível publicamente (não localhost)

3. **Verifique os logs do Asaas**:
   - Acesse **Logs de Webhooks** no painel do Asaas
   - Veja se há tentativas de envio e qual foi o resultado
   - Se houver erro, o Asaas mostrará o código de erro HTTP

4. **Verifique os logs do servidor**:
   - Procure por mensagens como `🔔 Webhook recebido do gateway: asaas`
   - Se não aparecer, o webhook não está chegando ao servidor

5. **Teste a URL manualmente**:
   - Use uma ferramenta como Postman ou curl para testar:
   ```bash
   curl -X POST https://primeiratrocaecia.com.br/api/payments/webhook/asaas \
     -H "Content-Type: application/json" \
     -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test123","status":"CONFIRMED"}}'
   ```

### WebSocket não funciona

1. Verifique se `SOCKET_IO_ENABLED=true` no `.env`
2. Verifique se o Socket.io está rodando no servidor
3. O sistema usa polling como fallback automaticamente (a cada 5 segundos)
4. Mesmo sem WebSocket, o sistema funciona normalmente com polling

### Pagamento não atualiza automaticamente

1. **Verifique se o webhook está configurado corretamente**:
   - Confirme que os eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` estão selecionados
   - Verifique se o webhook está ativo

2. **Use o botão de sincronização manual no admin**:
   - Acesse a página de pagamentos no admin
   - Clique no botão de sincronização (ícone de refresh azul) ao lado do pagamento
   - Isso buscará o status atualizado diretamente do Asaas

3. **Verifique os logs do servidor**:
   - Procure por erros relacionados ao processamento do webhook
   - Verifique se o `gatewayPaymentId` está correto

### Email de notificação de falha

Se você configurou um email no webhook, o Asaas enviará notificações por email quando:
- O webhook falhar ao enviar (servidor offline, erro 500, etc.)
- Houver múltiplas falhas consecutivas
- O webhook for desativado automaticamente após muitas falhas

## 📝 Notas Importantes

- O webhook do Asaas **NÃO requer autenticação** (a rota é pública)
- O sistema valida os dados recebidos antes de atualizar
- Pagamentos aprovados automaticamente atualizam o pedido para "confirmed"
- Notificações são criadas automaticamente para o cliente
- WebSocket é opcional, mas melhora a experiência do usuário

## 🎯 Próximos Passos

1. ✅ Configurar a URL do webhook no painel do Asaas
2. ✅ Testar com um pagamento PIX real
3. ✅ Verificar se as notificações estão sendo criadas
4. ✅ Confirmar que o WebSocket está funcionando (se habilitado)
5. ✅ Testar a sincronização manual no admin

## 🧪 Testar o Webhook Localmente

Se quiser testar o webhook antes de fazer um pagamento real, você pode usar o script de teste:

```bash
# Testar webhook localmente
node scripts/test-webhook-asaas.js

# Ou com URL customizada
WEBHOOK_URL=http://localhost:5000/api/payments/webhook/asaas node scripts/test-webhook-asaas.js

# Se tiver configurado token de autenticação
ASAAS_WEBHOOK_TOKEN=seu_token node scripts/test-webhook-asaas.js
```

## 🔒 Segurança Adicional (Opcional)

Se você configurou um **Token de autenticação** no webhook do Asaas, adicione a variável no `.env`:

```env
ASAAS_WEBHOOK_TOKEN=seu_token_configurado_no_asaas
```

O sistema validará automaticamente este token quando o webhook for recebido.

## ✅ Checklist Final

- [ ] Webhook configurado no painel do Asaas
- [ ] URL do webhook está correta: `https://primeiratrocaecia.com.br/api/payments/webhook/asaas`
- [ ] Eventos selecionados (pelo menos PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE)
- [ ] Webhook está ativo no painel do Asaas
- [ ] Variáveis de ambiente configuradas (ASAAS_API_KEY, ASAAS_ENVIRONMENT)
- [ ] Testar com um pagamento PIX real
- [ ] Verificar logs do servidor quando o webhook for chamado
- [ ] Verificar se o cliente recebe notificação quando o PIX é pago
- [ ] Testar sincronização manual no admin

