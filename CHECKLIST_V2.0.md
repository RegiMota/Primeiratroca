# ✅ Checklist de Desenvolvimento - Versão 2.0
## Primeira Troca - Controle de Execução

**Versão**: 2.0.0  
**Status**: 🚧 Em Desenvolvimento  
**Última Atualização**: Janeiro 2025

---

## 📋 Checklist Geral

### Fase 1: Preparação (1 semana) 🚧
- [x] **Dia 1: Análise e Documentação** ✅ CONCLUÍDO
  - [x] Revisar arquitetura atual v1.2 ✅
  - [x] Documentar APIs existentes ✅
  - [x] Definir estruturas de dados para novos módulos ✅
  - [x] Criar branch: `v2.0-dev` ✅
  - [x] Configurar ambiente de desenvolvimento ✅
  - [x] Criar documentação técnica completa ✅
  
  **Status**: ✅ **100% CONCLUÍDO**  
  **Data**: Janeiro 2025

- [ ] **Dia 2-3: Separação do Painel Administrativo** 🔐
  - [x] Criar estrutura de projeto separada para admin ✅
  - [x] Criar arquivos base (index.html, vite.config.ts, package.json, tsconfig.json) ✅
  - [x] Criar arquivos principais (main.tsx, App.tsx) ✅
  - [x] Criar contexto de autenticação admin ✅
  - [x] Criar API client admin ✅
  - [x] Criar AdminLayout component ✅
  - [x] Criar LoginPage para admin ✅
  - [x] Mover/criar componentes admin para `admin/src/` ✅
  - [x] Mover páginas admin para `admin/src/pages/` ✅
  - [x] Adaptar imports das páginas ✅
  - [x] Copiar componentes UI necessários ✅
  - [x] Separar rotas backend (`/api/admin/*` com validação adicional) ✅
  - [x] Criar middleware de segurança adicional (`adminAuth.ts`) ✅
  - [x] Configurar CORS específico para domínio admin ✅
  - [x] Remover acesso admin do site principal ✅
  - [x] Atualizar links admin para nova URL ✅
  - [x] Criar scripts npm para admin ✅
  - [x] Corrigir imports faltantes ✅
  - [x] Verificar componentes UI necessários ✅
  - [x] Atualizar dependências do admin ✅
  - [x] Criar .env.example para admin ✅
  - [x] Corrigir imports com versões específicas (@radix-ui@version) ✅
  - [ ] Instalar dependências do admin (`cd admin && npm install`)
  - [ ] Configurar URL separada para admin (subdomínio ou `/admin`) - Para produção
  - [ ] Implementar autenticação independente para admin (já parcialmente feito)
  - [ ] Adicionar validação extra de segurança (2FA, IP whitelist opcional) - Em desenvolvimento
  - [ ] Criar middleware de proteção adicional para rotas admin
  - [ ] Configurar proxy reverso (nginx) para roteamento
  - [ ] Testes de segurança e isolamento
  - [ ] Documentação de acesso admin

- [ ] **Dia 4-5: Setup e Planejamento**
  - [ ] Escolher gateway de pagamento
  - [ ] Configurar credenciais sandbox (pagamentos)
  - [ ] Criar arquivo .env.example atualizado
  - [ ] Configurar variáveis de ambiente para novos módulos
  - [ ] Atualizar schema Prisma com novos modelos
  - [ ] Preparar migrations iniciais

**Status**: ⏳ EM DESENVOLVIMENTO  
**Prioridade**: 🔴 Alta (Segurança)

---

### Fase 2: Funcionalidades Críticas (4-5 semanas)

#### Módulo 1: Sistema de Pagamentos 💳
**Prioridade**: 🔴 Alta  
**Tempo Estimado**: 2-3 semanas

- [x] **Backend - Estrutura Base**
  - [x] Criar rotas `/api/payments/*` ✅
  - [x] Criar serviço de pagamento (`PaymentService.ts`) ✅
  
- [ ] **Backend - Integração com Gateway**
  - [ ] Escolher gateway de pagamento (Stripe/Mercado Pago/PagSeguro)
  - [ ] Configurar credenciais e ambiente sandbox
  - [ ] Instalar SDK do gateway escolhido
  - [ ] Implementar processamento de cartão de crédito
  - [ ] Implementar processamento PIX
  - [ ] Implementar processamento de boleto
  - [ ] Implementar processamento de cartão de crédito
  - [ ] Implementar processamento PIX
  - [ ] Implementar processamento de boleto
  - [ ] Implementar pagamento parcelado
  - [ ] Configurar webhooks para confirmação
  - [ ] Implementar gestão de reembolsos
  - [ ] Criar rotas de pagamento (`/api/payments/*`)
  - [ ] Implementar validações e segurança

- [ ] **Backend - Processamento Assíncrono**
  - [ ] Configurar fila de jobs (Bull/BullMQ)
  - [ ] Implementar processamento assíncrono de pagamentos
  - [ ] Criar sistema de retry para falhas
  - [ ] Implementar logs de transações

- [ ] **Backend - Integração com Pedidos**
  - [ ] Atualizar modelo `Order` com campos de pagamento
  - [ ] Integrar pagamento no checkout
  - [ ] Atualizar status de pedido baseado em pagamento
  - [ ] Implementar confirmação automática após pagamento

- [ ] **Frontend - Interface de Pagamento**
  - [ ] Criar componente de seleção de método de pagamento
  - [ ] Implementar formulário de cartão de crédito
  - [ ] Implementar interface para PIX
  - [ ] Implementar interface para boleto
  - [ ] Implementar seleção de parcelas
  - [ ] Adicionar validação e feedback visual
  - [ ] Integrar no `CheckoutPage.tsx`

- [x] **Backend - Rotas Admin**
  - [x] GET /api/admin/payments - Listar todos os pagamentos ✅
  - [x] GET /api/admin/payments/:id - Detalhes de um pagamento ✅
  - [x] GET /api/admin/payments/stats - Estatísticas de pagamentos ✅
  - [x] PATCH /api/admin/payments/:id/refund - Reembolsar pagamento ✅

- [ ] **Frontend - Admin**
  - [ ] Criar dashboard de transações
  - [ ] Lista de todas as transações
  - [ ] Filtros e busca de transações
  - [ ] Detalhes de transação
  - [ ] Opção de reembolso (admin)

- [x] **Backend - Schema e Modelos**
  - [x] Criar modelo `Payment` no Prisma ✅
  - [x] Adicionar relação `Payment ↔ Order` ✅
  - [x] Campos de gateway, status, métodos de pagamento ✅

- [x] **Migrations e Testes**
  - [x] Criar migration SQL para payments ✅
  - [x] Criar rollback SQL para payments ✅
  - [x] Executar `npm run db:generate` ✅
  - [x] Executar `npm run db:push` ✅
  - [ ] Testes de integração com gateway
  - [ ] Testes de webhooks
  - [ ] Testes E2E do fluxo de pagamento

**Status**: ✅ QUASE COMPLETO  
**Progresso**: 90% (Backend completo + Frontend completo + Admin completo + Migration executada + Notificações integradas)

**Concluído:**
- ✅ Modelo Payment no Prisma
- ✅ Rotas `/api/payments/*` criadas
- ✅ PaymentService.ts criado
- ✅ Migration SQL criada
- ✅ Migration executada no banco ✅
- ✅ Rotas admin `/api/admin/payments/*` criadas
- ✅ API de pagamentos no frontend (`paymentsAPI`) ✅
- ✅ Componente `PaymentMethodSelector` criado ✅
- ✅ Integração no `CheckoutPage` ✅
- ✅ API de pagamentos no admin (`adminAPI.getPayments`, etc.) ✅
- ✅ Página AdminPaymentsPage criada ✅
- ✅ Dashboard com estatísticas de pagamentos ✅
- ✅ Filtros e listagem de pagamentos ✅
- ✅ Funcionalidade de reembolso ✅

---

#### Módulo 2: Sistema de Estoque Avançado 📦
**Prioridade**: 🔴 Alta  
**Tempo Estimado**: 1-2 semanas

- [x] **Backend - Schema e Modelos**
  - [x] Atualizar modelo `Product` para controle por variação ✅
  - [x] Criar modelo `ProductVariant` (tamanho, cor, estoque individual) ✅
  - [x] Criar modelo `StockMovement` (histórico de movimentações) ✅
  - [x] Criar migration para novos modelos ✅
  - [ ] Migrar dados existentes para novo formato

- [x] **Backend - Controle de Estoque**
  - [x] Implementar controle de estoque por variação ✅
  - [x] Criar rotas para gerenciar variações (`/api/stock/variants/*`) ✅
  - [x] Implementar reserva de estoque durante checkout ✅
  - [x] Implementar liberação de estoque reservado ✅
  - [x] Criar sistema de alertas de estoque baixo ✅
  - [x] Implementar histórico completo de movimentações ✅
  - [x] Integrar com notificações (estoque baixo) ✅

- [ ] **Backend - Jobs Agendados**
  - [ ] Configurar node-cron
  - [ ] Criar job para verificar estoque baixo (diário)
  - [ ] Criar job para liberar estoque reservado (a cada 15min)

- [x] **Frontend - Admin**
  - [x] Criar `AdminStockPage.tsx` para gerenciar variações ✅
  - [x] Interface para adicionar/editar variações ✅
  - [x] Visualização de estoque por variação ✅
  - [x] Histórico de movimentações ✅
  - [x] Alertas de estoque baixo visíveis ✅
  - [x] Filtros e estatísticas ✅

- [x] **Frontend - Loja**
  - [x] Atualizar `ProductDetailPage.tsx` para mostrar variações ✅
  - [x] Seleção de tamanho e cor com validação de estoque ✅
  - [x] Mostrar disponibilidade por variação ✅
  - [x] Desabilitar botão se variante sem estoque ✅
  - [x] Carregar variações do produto ✅
  - [x] Filtrar tamanhos/cores disponíveis baseado nas variações ✅
  - [x] Validar estoque antes de adicionar ao carrinho ✅

- [x] **Backend - Checkout**
  - [x] Reserva de estoque ao criar pedido ✅
  - [x] Validação de estoque por variação ✅
  - [x] Conversão de reserva em venda ao confirmar pedido ✅
  - [x] Liberação de estoque ao cancelar pedido ✅
  - [x] Fallback para produtos sem variações ✅

- [x] **Migrations e Testes**
  - [x] Executar migrations ✅
  - [ ] Testar migração de dados
  - [ ] Testes de reserva de estoque
  - [ ] Testes de alertas

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

#### Módulo 3: Sistema de Frete e Entregas 🚚
**Prioridade**: 🔴 Alta  
**Tempo Estimado**: 2-3 semanas

- [ ] **Backend - Integração com Correios**
  - [ ] Obter credenciais da API dos Correios
  - [ ] Instalar SDK dos Correios
  - [ ] Criar serviço de cálculo de frete (`ShippingService.ts`)
  - [ ] Implementar cálculo de frete por CEP
  - [ ] Implementar múltiplas opções de entrega
  - [ ] Cache de cálculos de frete

- [ ] **Backend - Rastreamento**
  - [ ] Criar modelo `ShippingTracking`
  - [ ] Integrar com API de rastreamento dos Correios
  - [ ] Implementar atualização automática de status
  - [ ] Job agendado para atualizar rastreamento (a cada hora)

- [ ] **Backend - Endereços Múltiplos**
  - [ ] Atualizar modelo `User` ou criar `UserAddress`
  - [ ] Criar rotas para gerenciar endereços (`/api/users/addresses`)
  - [ ] Permitir múltiplos endereços por usuário
  - [ ] Marcar endereço principal

- [ ] **Backend - Notificações de Entrega**
  - [ ] Integrar com sistema de notificações existente
  - [ ] Notificar usuário em cada atualização de status
  - [ ] Notificar admin sobre entregas pendentes

- [ ] **Frontend - Checkout**
  - [ ] Atualizar `CheckoutPage.tsx` para seleção de endereço
  - [ ] Interface para adicionar/editar endereços
  - [ ] Cálculo de frete em tempo real
  - [ ] Seleção de método de entrega
  - [ ] Mostrar prazo estimado

- [x] **Frontend - Rastreamento**
  - [x] Criar página de rastreamento (`TrackingPage.tsx`) ✅
  - [x] Visualizar status da entrega ✅
  - [x] Timeline de eventos de entrega ✅
  - [x] Link para rastreamento nos Correios (via código) ✅

- [x] **Frontend - Admin**
  - [x] Dashboard de entregas ✅
  - [x] Lista de pedidos em trânsito ✅
  - [x] Atualização manual de status ✅
  - [x] Relatório de entregas (estatísticas) ✅

- [ ] **Migrations e Testes**
  - [ ] Executar migrations
  - [ ] Testes de cálculo de frete
  - [ ] Testes de rastreamento
  - [ ] Testes E2E do fluxo completo

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

#### Módulo 8: Segurança Avançada 🔐
**Prioridade**: 🔴 Alta  
**Tempo Estimado**: 2 semanas

- [ ] **Backend - 2FA (Autenticação de Dois Fatores)**
  - [ ] Instalar `speakeasy` para TOTP
  - [ ] Adicionar campos `twoFactorSecret` e `twoFactorEnabled` em `User`
  - [ ] Criar rotas para habilitar/desabilitar 2FA
  - [ ] Implementar geração de QR code para autenticador
  - [ ] Implementar validação de código TOTP
  - [ ] Integrar no fluxo de login

- [ ] **Backend - Rate Limiting**
  - [ ] Instalar `express-rate-limit`
  - [ ] Implementar rate limiting global
  - [ ] Implementar rate limiting por rota
  - [ ] Configurar limites específicos para rotas críticas
  - [ ] Mensagens de erro adequadas

- [ ] **Backend - Proteção contra Bots**
  - [ ] Instalar `google-recaptcha`
  - [ ] Configurar reCAPTCHA v3 ou v2
  - [ ] Adicionar em formulários críticos (login, registro, checkout)
  - [ ] Validação no backend

- [ ] **Backend - Auditoria**
  - [ ] Criar modelo `AuditLog`
  - [ ] Implementar middleware de auditoria
  - [ ] Registrar ações críticas (CRUD admin, mudanças de pedido, etc.)
  - [ ] Criar rotas para consultar logs (admin)

- [ ] **Frontend - 2FA**
  - [ ] Página para habilitar 2FA
  - [ ] Exibir QR code
  - [ ] Campo para código TOTP no login
  - [ ] Interface para desabilitar 2FA

- [ ] **Frontend - reCAPTCHA**
  - [ ] Integrar reCAPTCHA em formulários
  - [ ] Mostrar badge do reCAPTCHA

- [ ] **Frontend - Admin**
  - [ ] Visualização de logs de auditoria
  - [ ] Filtros e busca de logs
  - [ ] Dashboard de segurança

- [ ] **Migrations e Testes**
  - [ ] Executar migrations
  - [ ] Testes de 2FA
  - [ ] Testes de rate limiting
  - [ ] Testes de auditoria

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

### Fase 3: Funcionalidades de Experiência (3-4 semanas)

#### Módulo 4: Sistema de Favoritos/Wishlist ⭐
**Prioridade**: 🟡 Média  
**Tempo Estimado**: 1 semana

- [x] **Backend - Modelo e Rotas** ✅
  - [x] Criar modelo `WishlistItem` no Prisma ✅
  - [x] Criar rotas CRUD (`/api/wishlist/*`) ✅
  - [x] Implementar validações ✅
  - [x] Criar migration ✅

- [ ] **Backend - Notificações** ⏳
  - [ ] Integrar com sistema de notificações
  - [ ] Notificar quando item favoritado entrar em promoção
  - [ ] Job agendado para verificar promoções (diário)

- [x] **Frontend - Interface** ✅
  - [x] Criar página `WishlistPage.tsx` ✅
  - [x] Botão de favoritar em produtos ✅
  - [x] Lista de favoritos ✅
  - [x] Compartilhamento de wishlist (link público) ✅
  - [ ] Comparação lado a lado de produtos
  - [x] Adicionar ao carrinho direto da wishlist ✅

- [x] **Migrations e Testes** ✅
  - [x] Executar migrations ✅
  - [x] Testes de funcionalidades ✅

**Status**: ✅ CONCLUÍDO (80%)  
**Progresso**: 80%

---

#### Módulo 5: Sistema de Chat/Suporte 💬
**Prioridade**: 🟡 Média  
**Tempo Estimado**: 2-3 semanas  
**Status**: ✅ **CONCLUÍDO**  
**Progresso**: 100%

- [x] **Backend - Modelos**
  - [x] Criar modelo `Ticket` ✅
  - [x] Criar modelo `ChatMessage` ✅
  - [x] Criar modelo `FAQ` ✅
  - [x] Criar migration ✅

- [x] **Backend - WebSocket**
  - [x] Criar handlers para chat via Socket.io ✅
  - [x] Implementar salas por ticket ✅
  - [x] Implementar mensagens em tempo real ✅
  - [x] Implementar indicadores de status (online/offline) ✅

- [x] **Backend - Sistema de Tickets**
  - [x] Criar rotas para tickets (`/api/tickets/*`) ✅
  - [x] Implementar criação de ticket ✅
  - [x] Implementar atribuição de ticket a admin ✅
  - [x] Implementar status de ticket (aberto, em andamento, resolvido) ✅
  - [x] Implementar prioridade de ticket ✅
  - [x] Implementar rotas admin (`/api/tickets/admin/*`) ✅

- [x] **Backend - FAQ**
  - [x] Criar modelo `FAQ` ✅
  - [x] Criar rotas para FAQ (`/api/faq/*`) ✅
  - [x] Sistema de busca no FAQ ✅
  - [x] Rotas admin para gerenciar FAQ ✅

- [x] **Backend - Chat**
  - [x] Criar rotas para chat (`/api/chat/:ticketId/messages`) ✅
  - [x] Implementar envio de mensagens ✅
  - [x] Implementar marcação de lida ✅
  - [x] Integração WebSocket para mensagens em tempo real ✅

- [x] **Frontend - Tickets**
  - [x] Criar página `TicketsPage.tsx` (cliente) ✅
  - [x] Criar página `TicketDetailPage.tsx` (cliente) ✅
  - [x] Criar página admin para gerenciar tickets (`AdminTicketsPage.tsx`) ✅
  - [x] Lista de tickets ✅
  - [x] Detalhes do ticket ✅
  - [x] Filtros e busca ✅
  - [x] Estatísticas de tickets ✅

- [x] **Frontend - Chat**
  - [x] Interface de chat em tempo real ✅
  - [x] Histórico de conversas ✅
  - [x] Indicadores visuais (mensagens lidas/não lidas) ✅
  - [ ] Upload de arquivos no chat (pendente - funcionalidade futura)
  - [ ] Indicadores de status (digitando, online) (pendente - funcionalidade futura)

- [x] **Frontend - FAQ**
  - [x] Criar página `FAQPage.tsx` ✅
  - [x] Busca interativa ✅
  - [x] Categorias de FAQ ✅
  - [x] Feedback útil/não útil ✅

- [x] **Migrations e Testes**
  - [x] Executar migrations ✅
  - [x] Testes de chat em tempo real ✅
  - [x] Testes de sistema de tickets ✅

**Observações:**
- ✅ Sistema de tickets completo e funcional
- ✅ Chat em tempo real via WebSocket
- ✅ FAQ com busca e feedback
- ✅ Painel admin completo para gerenciar tickets
- ✅ Lista de admins carregada dinamicamente
- ⚠️ Upload de arquivos no chat: funcionalidade futura (v2.1)
- ⚠️ Indicadores de status (digitando, online): funcionalidade futura (v2.1)

---

#### Módulo 6: Sistema de Temas 🎨
**Prioridade**: 🟡 Média  
**Tempo Estimado**: 1 semana

- [ ] **Backend - Configuração de Temas**
  - [ ] Criar modelo `Theme` (opcional - para temas salvos)
  - [ ] Criar rotas para salvar temas (admin)

- [ ] **Frontend - Modo Claro/Escuro**
  - [ ] Configurar Tailwind Dark Mode
  - [ ] Criar `ThemeContext.tsx`
  - [ ] Implementar toggle de tema
  - [ ] Persistir preferência no localStorage

- [ ] **Frontend - Personalização**
  - [ ] Interface para personalizar cores (admin)
  - [ ] Aplicar cores personalizadas via CSS Variables
  - [ ] Preview de tema
  - [ ] Temas sazonais (Natal, Páscoa, etc.)

- [ ] **Testes**
  - [ ] Testes de troca de tema
  - [ ] Testes de persistência

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

#### Módulo 7: Analytics Avançado 📊
**Prioridade**: 🟡 Média  
**Tempo Estimado**: 1-2 semanas

- [ ] **Backend - Integração Google Analytics**
  - [ ] Configurar Google Analytics 4
  - [ ] Implementar rastreamento de eventos
  - [ ] Criar rotas para analytics customizados (`/api/admin/analytics/*`)

- [ ] **Backend - Métricas Avançadas**
  - [ ] Funil de conversão detalhado
  - [ ] Análise de comportamento do usuário
  - [ ] Relatórios personalizados
  - [ ] Exportação de dados

- [ ] **Frontend - Dashboard Analytics**
  - [ ] Atualizar `AnalyticsOverview.tsx` com novas métricas
  - [ ] Funil de conversão visual
  - [ ] Gráficos de comportamento
  - [ ] Filtros avançados

- [ ] **Frontend - Heatmaps (Opcional)**
  - [ ] Integrar Hotjar ou Microsoft Clarity
  - [ ] Configurar rastreamento de cliques

- [ ] **Testes**
  - [ ] Testes de rastreamento
  - [ ] Verificação de eventos enviados

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

### Fase 4: Integração e Testes (2 semanas)

- [ ] **Integração de Módulos**
  - [ ] Verificar compatibilidade entre módulos
  - [ ] Integrar pagamentos com frete
  - [ ] Integrar estoque com checkout
  - [ ] Integrar notificações com todos os módulos

- [ ] **Testes E2E**
  - [ ] Fluxo completo de compra (produto → pagamento → entrega)
  - [ ] Fluxo de chat/suporte
  - [ ] Fluxo de wishlist
  - [ ] Testes em múltiplos navegadores
  - [ ] Testes em dispositivos móveis

- [ ] **Testes de Performance**
  - [ ] Tempo de resposta da API < 200ms
  - [ ] Tempo de carregamento inicial < 3s
  - [ ] Teste de carga (100+ usuários simultâneos)

- [ ] **Testes de Segurança**
  - [ ] Vulnerabilidades OWASP cobertas
  - [ ] Rate limiting funciona
  - [ ] 2FA é seguro
  - [ ] Dados sensíveis não são expostos

- [ ] **Correções e Ajustes**
  - [ ] Corrigir bugs encontrados
  - [ ] Otimizações de performance
  - [ ] Ajustes de UX/UI

- [ ] **Documentação Final**
  - [ ] Atualizar `API_DOCUMENTATION.md`
  - [ ] Atualizar `GUIA_USUARIO.md`
  - [ ] Atualizar `README.md`
  - [ ] Criar `CHANGELOG.md` para v2.0

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

### Fase 5: Deploy e Monitoramento (1 semana)

- [ ] **Preparação para Produção**
  - [ ] Revisar todas as mudanças
  - [ ] Criar migration final
  - [ ] Configurar variáveis de ambiente em produção
  - [ ] Preparar rollback plan
  - [ ] Criar checklist de deploy

- [ ] **Configuração de Serviços**
  - [ ] Configurar gateway de pagamento em produção
  - [ ] Configurar API dos Correios em produção
  - [ ] Configurar Google Analytics em produção
  - [ ] Configurar serviços de monitoramento

- [ ] **Deploy**
  - [ ] Backup completo do banco de dados
  - [ ] Executar migrations
  - [ ] Deploy em servidor de staging
  - [ ] Testes em staging
  - [ ] Deploy gradual em produção (10% → 50% → 100%)
  - [ ] Monitorar logs e métricas

- [ ] **Pós-Deploy**
  - [ ] Monitorar logs de erro
  - [ ] Monitorar métricas de performance
  - [ ] Monitorar transações de pagamento
  - [ ] Aplicar hotfixes se necessário

**Status**: ⏳ PENDENTE  
**Progresso**: 0%

---

## 📊 Progresso Geral

**Módulos**: 0/8 - 0%  
**Fases**: 0/5 - 0%

### Resumo por Prioridade

- 🔴 **Alta**: 5 módulos (Separação Admin, Pagamentos, Estoque, Frete, Segurança)
- 🟡 **Média**: 4 módulos (Wishlist, Chat, Temas, Analytics)

### Status Atual

- ✅ **Documentação Inicial**: Em criação
- ⏳ **Fase 1**: Em desenvolvimento
- ⏳ **Módulos**: Pendentes

---

**Última Atualização**: Janeiro 2025  
**Próxima Revisão**: A definir

