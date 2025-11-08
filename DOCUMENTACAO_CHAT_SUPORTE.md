# 💬 Documentação: Módulo 5 - Sistema de Chat/Suporte

## 📋 Visão Geral

O sistema de Chat/Suporte permite que clientes criem tickets de suporte e conversem em tempo real com administradores para resolver problemas, dúvidas ou solicitações relacionadas a pedidos, pagamentos, produtos, etc.

---

## 🎯 Fluxo Completo do Sistema

### 1. **Criação de Ticket** 🎫

#### Como funciona:
1. **Cliente acessa** `/tickets` (autenticado)
2. **Clica em "Novo Ticket"**
3. **Preenche o formulário:**
   - **Assunto** (obrigatório): Ex: "Problema com meu pedido #123"
   - **Categoria** (obrigatório): 
     - `technical` - Problemas técnicos
     - `order` - Dúvidas sobre pedidos
     - `payment` - Problemas com pagamento
     - `other` - Outros assuntos
   - **Prioridade**: `low`, `medium`, `high`, `urgent`
   - **Descrição** (obrigatório): Detalhes do problema
   - **Pedido relacionado** (opcional): Se o ticket está relacionado a um pedido específico

4. **Ao criar o ticket:**
   - Ticket é salvo no banco com status `open`
   - Notificação é enviada para todos os admins via WebSocket
   - Cliente pode ver o ticket na lista

#### Exemplo de criação:
```typescript
{
  subject: "Produto não chegou",
  description: "Fiz um pedido há 10 dias e ainda não recebi...",
  category: "order",
  priority: "high",
  orderId: 123  // Opcional
}
```

---

### 2. **Atribuição de Ticket** 👤

#### Como funciona (Admin):
1. **Admin acessa** painel administrativo (`http://localhost:3001`)
2. **Vê lista de tickets** não atribuídos
3. **Atribui ticket** a si mesmo ou outro admin:
   - Status muda de `open` → `in_progress`
   - `assignedToId` é definido
   - `firstResponseAt` é registrado (primeira vez)
   - Notificação é enviada ao cliente

#### Exemplo de atribuição:
```typescript
// Admin atribui ticket #5 a si mesmo
PATCH /api/tickets/5
{
  assignedToId: 1,  // ID do admin
  status: "in_progress"
}
```

---

### 3. **Sistema de Chat** 💬

#### Como funciona:

##### **A. Cliente ou Admin acessa o ticket:**
- URL: `/tickets/:id`
- Página carrega:
  - Informações do ticket (lado direito)
  - Histórico de mensagens (centro)
  - Campo para enviar mensagem (parte inferior)

##### **B. Envio de Mensagem:**
1. **Usuário digita** mensagem no campo de texto
2. **Clica em "Enviar"** ou pressiona Enter
3. **Mensagem é enviada** via API:
   ```typescript
   POST /api/chat/:ticketId/messages
   {
     content: "Olá, preciso de ajuda!",
     messageType: "text"
   }
   ```

4. **Backend processa:**
   - Salva mensagem no banco (`chat_messages`)
   - Atualiza status do ticket:
     - Se **admin** responde e ticket estava `waiting_customer` → `in_progress`
     - Se **cliente** responde e ticket estava `open` ou `in_progress` → `waiting_customer`
   - Emite evento WebSocket para todos na sala do ticket

5. **Mensagem aparece em tempo real:**
   - Via **WebSocket** (se habilitado): Mensagem aparece instantaneamente
   - Via **Polling** (fallback): Mensagem aparece em até 5 segundos

##### **C. Recebimento de Mensagem:**
- **WebSocket ativo:**
  ```typescript
  socket.on('chat:message', (message) => {
    // Adiciona mensagem à lista
    setMessages(prev => [...prev, message]);
  });
  ```
  
- **Polling (fallback):**
  ```typescript
  // A cada 5 segundos, carrega novas mensagens
  setInterval(() => {
    loadMessages();
  }, 5000);
  ```

##### **D. Indicadores Visuais:**
- **Mensagens do cliente**: Azul (lado direito)
- **Mensagens do admin**: Roxo/Amarelo (lado esquerdo)
- **Badge "Admin"**: Aparece em mensagens de administradores
- **Timestamp**: Data e hora de cada mensagem

---

### 4. **Status do Ticket** 📊

#### Fluxo de Status:

```
open → in_progress → waiting_customer → resolved → closed
  ↓        ↓              ↓                 ↓
  └────────┴──────────────┴─────────────────┘
         (loop até resolução)
```

#### Descrição dos Status:

1. **`open`** (Aberto):
   - Ticket criado pelo cliente
   - Ainda não atribuído a nenhum admin
   - Badge: Azul

2. **`in_progress`** (Em Andamento):
   - Ticket atribuído a um admin
   - Admin está trabalhando na resolução
   - Badge: Amarelo

3. **`waiting_customer`** (Aguardando Cliente):
   - Admin respondeu e está aguardando resposta do cliente
   - Cliente pode marcar manualmente como "aguardando"
   - Badge: Laranja

4. **`resolved`** (Resolvido):
   - Admin marca como resolvido
   - `resolvedAt` e `resolvedById` são registrados
   - `resolution` contém a solução final
   - Badge: Verde

5. **`closed`** (Fechado):
   - Ticket finalizado
   - Não aceita novas mensagens
   - Badge: Cinza

---

### 5. **Prioridades** ⚠️

#### Níveis de Prioridade:

- **`low`** (Baixa): Dúvidas gerais, não urgentes
- **`medium`** (Média): Problemas normais (padrão)
- **`high`** (Alta): Problemas importantes que precisam de atenção
- **`urgent`** (Urgente): Problemas críticos que precisam de resolução imediata

#### Como funciona:
- Cliente define prioridade ao criar ticket
- Admin pode alterar prioridade
- Afeta ordem de exibição (urgentes aparecem primeiro)

---

### 6. **WebSocket vs Polling** 🔄

#### WebSocket (Tempo Real - Recomendado):

**Como habilitar:**
1. No `.env` (frontend):
   ```env
   VITE_SOCKET_IO_ENABLED=true
   VITE_SOCKET_IO_URL=http://localhost:5000
   ```

2. No `.env` (backend):
   ```env
   SOCKET_IO_ENABLED=true
   ```

**Como funciona:**
- Conexão persistente entre cliente e servidor
- Mensagens aparecem **instantaneamente**
- Menos carga no servidor
- Indicadores de "digitando" funcionam

**Eventos:**
- `chat:join` - Entrar na sala do ticket
- `chat:leave` - Sair da sala do ticket
- `chat:typing` - Indicador de digitação
- `chat:message` - Nova mensagem recebida
- `ticket:update` - Atualização de status do ticket
- `ticket:new` - Novo ticket criado (só admins)

#### Polling (Fallback):

**Como funciona:**
- Se WebSocket não estiver habilitado, usa polling
- A cada **5 segundos**, busca novas mensagens
- Mais simples, mas menos eficiente
- Mensagens aparecem com até 5 segundos de delay

---

### 7. **FAQ (Perguntas Frequentes)** ❓

#### Como funciona:

##### **A. Cliente acessa `/faq`:**
- Página pública (não precisa estar autenticado)
- Lista todas as FAQs ativas
- Busca por palavra-chave
- Filtro por categoria

##### **B. Busca Interativa:**
- Digite na barra de busca
- Resultados aparecem em tempo real
- Busca em `question` e `answer`

##### **C. Feedback:**
- Cliente pode marcar FAQ como "útil" ou "não útil"
- Contadores são atualizados
- Apenas um feedback por FAQ

##### **D. Categorias:**
- `general` - Geral
- `orders` - Pedidos
- `payments` - Pagamentos
- `shipping` - Frete e Entrega
- `products` - Produtos
- `returns` - Trocas e Devoluções

---

## 🔧 Fluxo Técnico Detalhado

### Exemplo Completo: Cliente cria ticket e conversa com admin

#### **Passo 1: Cliente cria ticket**
```typescript
// Frontend: TicketsPage.tsx
POST /api/tickets
{
  subject: "Produto veio errado",
  description: "Comprei um vestido azul mas veio rosa...",
  category: "order",
  priority: "high",
  orderId: 456
}

// Backend cria ticket
// Status: "open"
// assignedToId: null
```

#### **Passo 2: Admin recebe notificação**
```typescript
// WebSocket emite para sala "admins"
emitNewTicket(ticket);
// Todos os admins conectados recebem: "ticket:new"
```

#### **Passo 3: Admin atribui ticket**
```typescript
// Admin no painel admin
PATCH /api/tickets/1
{
  assignedToId: 2,  // ID do admin
  status: "in_progress"
}

// Backend atualiza:
// - assignedToId: 2
// - status: "in_progress"
// - firstResponseAt: new Date()
// Emite: ticket:update
```

#### **Passo 4: Cliente acessa ticket**
```typescript
// GET /api/tickets/1
// Retorna ticket completo com mensagens

// Cliente vê que está "Em Andamento"
// Cliente vê que foi atribuído a "João (Admin)"
```

#### **Passo 5: Admin envia mensagem**
```typescript
// Admin no chat
POST /api/chat/1/messages
{
  content: "Olá! Vou verificar seu pedido agora.",
  messageType: "text"
}

// Backend:
// 1. Salva mensagem
// 2. Atualiza ticket (se necessário)
// 3. Emite WebSocket: chat:message
```

#### **Passo 6: Cliente recebe mensagem**
```typescript
// Frontend: TicketDetailPage.tsx
socket.on('chat:message', (message) => {
  // Adiciona mensagem instantaneamente
  setMessages(prev => [...prev, message]);
});

// OU (se polling):
// A cada 5s, busca novas mensagens
GET /api/chat/1/messages
```

#### **Passo 7: Cliente responde**
```typescript
// Cliente envia mensagem
POST /api/chat/1/messages
{
  content: "Obrigado! Aguardo retorno.",
  messageType: "text"
}

// Backend:
// - Status muda: "in_progress" → "waiting_customer"
// - Emite: chat:message
```

#### **Passo 8: Admin resolve ticket**
```typescript
// Admin marca como resolvido
PATCH /api/tickets/1
{
  status: "resolved",
  resolution: "Produto foi trocado e enviado. Código de rastreamento: ABC123"
}

// Backend:
// - status: "resolved"
// - resolvedAt: new Date()
// - resolvedById: 2
// - resolution: "..."
```

#### **Passo 9: Admin fecha ticket**
```typescript
// Admin fecha ticket
PATCH /api/tickets/1
{
  status: "closed"
}

// Ticket não aceita mais mensagens
```

---

## 📱 Interface do Usuário

### **Página de Tickets (`/tickets`):**
- Lista de todos os tickets do usuário
- Filtros por status e categoria
- Botão "Novo Ticket"
- Cards com informações resumidas:
  - Assunto
  - Categoria
  - Status (badge colorido)
  - Prioridade
  - Número de mensagens
  - Data de criação

### **Página de Chat (`/tickets/:id`):**
- **Lado esquerdo (2/3):**
  - Histórico de mensagens
  - Campo de envio
  - Scroll automático para última mensagem
  
- **Lado direito (1/3):**
  - Informações do ticket
  - Categoria e prioridade
  - Data de criação
  - Pedido relacionado (se houver)
  - Descrição inicial

### **Página de FAQ (`/faq`):**
- Busca por palavra-chave
- Filtro por categoria
- Accordion (expandir/colapsar)
- Botões de feedback (útil/não útil)

---

## 🎨 Estados Visuais

### **Status Badges:**
- 🔵 **Aberto** - Azul
- 🟡 **Em Andamento** - Amarelo
- 🟠 **Aguardando Cliente** - Laranja
- 🟢 **Resolvido** - Verde
- ⚫ **Fechado** - Cinza

### **Prioridade Badges:**
- ⚪ **Baixa** - Cinza
- 🟡 **Média** - Amarelo
- 🟠 **Alta** - Laranja
- 🔴 **Urgente** - Vermelho

### **Mensagens no Chat:**
- **Cliente**: Fundo azul, texto branco, alinhado à direita
- **Admin**: Fundo roxo/amarelo, texto preto, alinhado à esquerda
- **Sistema**: Fundo cinza, texto preto, centralizado

---

## 🔐 Segurança e Permissões

### **Cliente:**
- ✅ Criar tickets
- ✅ Ver seus próprios tickets
- ✅ Enviar mensagens em seus tickets
- ✅ Marcar ticket como "aguardando cliente"
- ❌ Ver tickets de outros usuários
- ❌ Atribuir tickets
- ❌ Mudar status para "resolvido" ou "fechado"

### **Admin:**
- ✅ Ver todos os tickets
- ✅ Atribuir tickets
- ✅ Mudar status e prioridade
- ✅ Resolver e fechar tickets
- ✅ Enviar mensagens em qualquer ticket
- ✅ Ver estatísticas de tickets

---

## 📊 Métricas e Estatísticas

### **Para Admins (`/api/tickets/admin/stats`):**
- Total de tickets
- Por status (open, in_progress, resolved, closed)
- Por categoria
- Por prioridade

### **Tempo de Resposta:**
- `firstResponseAt`: Data da primeira resposta do admin
- `averageResponseTime`: Tempo médio de resposta (minutos)
- `resolvedAt`: Data de resolução

---

## 🚀 Melhorias Futuras

### **Pendentes:**
- [ ] Upload de arquivos no chat
- [ ] Notificações por email quando admin responde
- [ ] Tickets relacionados a pedidos aparecem automaticamente
- [ ] Histórico completo de mudanças de status
- [ ] Templates de resposta para admins
- [ ] Sistema de avaliação de atendimento
- [ ] Chat offline (salvar mensagens e enviar quando online)

---

## 📝 Resumo

**Sistema de Tickets:**
1. Cliente cria ticket → Status: `open`
2. Admin atribui → Status: `in_progress`
3. Conversa via chat em tempo real
4. Admin resolve → Status: `resolved`
5. Admin fecha → Status: `closed`

**Sistema de Chat:**
- Mensagens em tempo real via WebSocket
- Fallback para polling (5s) se WebSocket desabilitado
- Indicadores visuais de status
- Histórico completo de conversas

**FAQ:**
- Busca interativa
- Feedback dos usuários
- Categorização
- Público (não precisa login)

---

**Última atualização:** 2025-01-XX
**Versão:** 2.0

