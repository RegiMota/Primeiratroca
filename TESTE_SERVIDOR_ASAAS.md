# 🧪 Guia de Teste - Integração Asaas no Servidor

## 📋 Checklist Pré-Teste

Antes de testar, verifique:

- [ ] Código foi enviado para o GitHub (✅ Feito)
- [ ] Servidor tem acesso ao repositório GitHub
- [ ] Variáveis de ambiente estão configuradas no servidor:
  - `ASAAS_API_KEY`
  - `ASAAS_ENVIRONMENT` (production ou sandbox)
  - `SOCKET_IO_ENABLED=true` (opcional, mas recomendado)
  - `WEBSOCKET_CORS_ORIGIN=https://primeiratrocaecia.com.br`
  - `ASAAS_WEBHOOK_TOKEN` (se configurado no painel do Asaas)

## 🚀 Passos para Deploy no Servidor

### 1. Conectar ao Servidor

```bash
# SSH para o servidor (ajuste conforme sua configuração)
ssh usuario@seu-servidor.com
```

### 2. Atualizar o Código

```bash
# Navegar para o diretório do projeto
cd /caminho/do/projeto

# Fazer pull das alterações
git pull origin main
```

### 3. Reinstalar Dependências (se necessário)

```bash
# Backend
cd server
npm install

# Frontend
cd ../src
npm install

# Admin
cd ../admin
npm install
```

### 4. Rebuild dos Containers Docker (se usar Docker)

```bash
# Parar containers
docker-compose down

# Rebuild e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

### 5. Reiniciar o Servidor (se necessário)

```bash
# Se usar PM2
pm2 restart all

# Se usar systemd
sudo systemctl restart seu-servico

# Se usar Docker
docker-compose restart
```

## ✅ Verificações Pós-Deploy

### 1. Verificar se o Webhook está Acessível

```bash
# Testar health check
curl https://primeiratrocaecia.com.br/api/payments/webhook/health

# Deve retornar:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "gateway": "asaas",
#   "webhookUrl": "/api/payments/webhook/asaas"
# }
```

### 2. Verificar Logs do Servidor

```bash
# Ver logs em tempo real
docker-compose logs -f server

# Ou se não usar Docker
tail -f /var/log/seu-app.log
```

### 3. Verificar Variáveis de Ambiente

```bash
# Verificar se as variáveis estão configuradas
docker-compose exec server env | grep ASAAS

# Ou no servidor
env | grep ASAAS
```

## 🧪 Testes a Realizar

### Teste 1: Criar um Pagamento PIX

1. Acesse a loja: `https://primeiratrocaecia.com.br`
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Selecione pagamento via PIX
5. Complete o pedido
6. **Verifique:**
   - QR Code PIX é exibido
   - Página mostra tempo de expiração
   - Status inicial é "Pendente"

### Teste 2: Simular Pagamento PIX (Sandbox)

Se estiver usando ambiente sandbox do Asaas:

1. No painel do Asaas, vá em **Cobranças**
2. Encontre a cobrança criada
3. Clique em **Simular Pagamento** (se disponível no sandbox)
4. **Verifique nos logs do servidor:**
   ```
   🔔 Webhook recebido do gateway: asaas
   📦 Headers: {...}
   📦 Body: {...}
   ✅ Status do pagamento atualizado com sucesso
   📤 Evento de pagamento aprovado enviado via WebSocket
   ```

### Teste 3: Verificar Atualização em Tempo Real

1. Com a página de pagamento aberta
2. Quando o webhook for recebido (pagamento confirmado)
3. **Verificar:**
   - Cliente recebe notificação instantânea
   - Status muda para "Aprovado"
   - Redirecionamento automático para página de sucesso
   - Notificação aparece no sistema de notificações

### Teste 4: Sincronização Manual no Admin

1. Acesse o painel admin: `https://primeiratrocaecia.com.br/admin`
2. Vá em **Pagamentos**
3. Encontre um pagamento PIX pendente
4. Clique no botão de **sincronização** (ícone de refresh azul)
5. **Verificar:**
   - Status é atualizado diretamente do Asaas
   - Mensagem de sucesso aparece
   - Status é atualizado na lista

### Teste 5: Verificar Webhook no Asaas

1. Acesse o painel do Asaas
2. Vá em **Configurações** → **Webhooks**
3. Clique em **Logs de Webhooks**
4. **Verificar:**
   - Tentativas de envio aparecem
   - Status HTTP 200 (sucesso)
   - Sem erros de conexão

## 🔍 Troubleshooting

### Webhook não está sendo recebido

**Sintomas:**
- Pagamento não atualiza automaticamente
- Logs não mostram webhook recebido

**Soluções:**
1. Verificar se a URL está correta no painel do Asaas:
   ```
   https://primeiratrocaecia.com.br/api/payments/webhook/asaas
   ```

2. Verificar se o servidor está acessível publicamente:
   ```bash
   curl -I https://primeiratrocaecia.com.br/api/payments/webhook/health
   ```

3. Verificar logs do Asaas:
   - Painel Asaas → Configurações → Logs de Webhooks
   - Ver se há erros HTTP (404, 500, etc.)

4. Verificar firewall/proxy:
   - Certifique-se que a porta está aberta
   - Verifique se não há bloqueio de IPs

### Webhook recebido mas pagamento não atualiza

**Sintomas:**
- Logs mostram webhook recebido
- Mas status do pagamento não muda

**Soluções:**
1. Verificar logs detalhados:
   ```bash
   docker-compose logs server | grep -i webhook
   ```

2. Verificar se `gatewayPaymentId` está correto:
   - O ID do pagamento no Asaas deve estar salvo no banco
   - Verificar no admin se o pagamento tem `gatewayPaymentId`

3. Verificar se o evento está sendo processado:
   - Logs devem mostrar: `📋 Evento recebido: PAYMENT_RECEIVED`
   - Verificar se o evento está na lista de eventos configurados

### WebSocket não funciona

**Sintomas:**
- Cliente não recebe notificação instantânea
- Precisa aguardar polling (5 segundos)

**Soluções:**
1. Verificar variável de ambiente:
   ```bash
   echo $SOCKET_IO_ENABLED
   # Deve retornar: true
   ```

2. Verificar se Socket.io está rodando:
   - Logs devem mostrar: `✅ Socket.io server inicializado`

3. Verificar CORS:
   ```env
   WEBSOCKET_CORS_ORIGIN=https://primeiratrocaecia.com.br
   ```

4. **Nota:** O sistema funciona com polling mesmo sem WebSocket

### Erro de Token de Autenticação

**Sintomas:**
- Webhook retorna 401 Unauthorized
- Logs mostram: `⚠️ Token de autenticação inválido`

**Soluções:**
1. Se configurou token no Asaas, adicione no `.env`:
   ```env
   ASAAS_WEBHOOK_TOKEN=seu_token_aqui
   ```

2. Reinicie o servidor após adicionar a variável

3. Ou remova o token do webhook no painel do Asaas

## 📊 Monitoramento

### Logs Importantes para Monitorar

```bash
# Webhooks recebidos
docker-compose logs server | grep "🔔 Webhook recebido"

# Pagamentos atualizados
docker-compose logs server | grep "✅ Status do pagamento atualizado"

# Erros
docker-compose logs server | grep "❌"

# WebSocket
docker-compose logs server | grep "WebSocket\|Socket.io"
```

### Métricas para Acompanhar

- Taxa de sucesso dos webhooks (deve ser próximo de 100%)
- Tempo entre pagamento e atualização (deve ser < 5 segundos)
- Taxa de uso de WebSocket vs Polling

## ✅ Checklist Final

Após os testes, confirme:

- [ ] Webhook está recebendo notificações do Asaas
- [ ] Pagamentos PIX são atualizados automaticamente
- [ ] Clientes recebem notificações em tempo real
- [ ] Sincronização manual funciona no admin
- [ ] Logs não mostram erros críticos
- [ ] Performance está adequada

## 🎯 Próximos Passos

1. Monitorar por alguns dias
2. Verificar logs periodicamente
3. Coletar feedback dos clientes
4. Ajustar conforme necessário

---

**Data do Deploy:** _______________
**Responsável:** _______________
**Status:** ⬜ Pendente | ⬜ Em Teste | ⬜ Aprovado | ⬜ Com Problemas

