# 📝 Changelog - Primeira Troca
## Histórico de Versões e Mudanças

Todos os destaques notáveis deste projeto serão documentados neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.2.0] - ✅ Versão Completa e Testada

### Adicionado
- **Planejamento e Documentação:**
  - Plano completo de desenvolvimento da versão 1.2 (`PLANO_V1.2.md`)
  - Cronograma detalhado por módulos (`CRONOGRAMA_V1.2.md`)
  - Checklist de execução (`CHECKLIST_V1.2.md`)
  - Análise de arquitetura atual (`ANALISE_ARQUITETURA_V1.2.md`)
  - Estruturas de dados definidas (`ESTRUTURAS_DADOS_V1.2.md`)
  - Scripts de migração (`MIGRATIONS_V1.2.md`)
  - Guia de configuração de serviços (`CONFIGURACAO_SERVICOS_V1.2.md`)
  - Acompanhamento de progresso (`PROGRESSO_V1.2.md`)

- **Novos Modelos no Banco de Dados:**
  - Modelo `ProductImage` para múltiplas imagens por produto
  - Modelo `Coupon` para sistema de cupons e descontos
  - Modelo `Notification` para notificações em tempo real

- **Atualizações no Schema Prisma:**
  - Relação `Product.images` para múltiplas imagens
  - Campos `Order.couponId` e `Order.discountAmount` para cupons
  - Relação `User.notifications` para notificações
  - Índices otimizados para performance

### Em Desenvolvimento
- Sistema de upload de múltiplas imagens (Módulo 1)
- Sistema de cupons e descontos (Módulo 2)
- Sistema de notificações em tempo real (Módulo 3)
- Sistema completo de emails (Módulo 4)
- Dashboard de analytics avançado (Módulo 5)
- Busca avançada com filtros múltiplos (Módulo 6)

### Progresso Completo
- **Fase 1 - Dia 1**: ✅ Análise e Documentação (CONCLUÍDO)
- **Fase 1 - Dia 2**: ⏸️ Setup de Infraestrutura (POSTERGADO)
- **Fase 2 - Módulo 1**: ✅ Upload de Imagens (100% CONCLUÍDO)
- **Fase 3 - Módulo 2**: ✅ Cupons e Descontos (100% CONCLUÍDO)
- **Fase 4 - Módulo 3**: ✅ Notificações (100% CONCLUÍDO - usando polling)
- **Fase 5 - Módulo 4**: ✅ Emails (100% CONCLUÍDO - usando log temporário)
- **Fase 6 - Módulo 5**: ✅ Analytics (100% CONCLUÍDO)
- **Fase 7 - Módulo 6**: ✅ Busca Avançada (100% CONCLUÍDO E CORRIGIDO)
- **Fase 8 - Integração e Testes**: ✅ 100% CONCLUÍDA
  - ✅ Dia 35: Integração de Módulos
  - ✅ Dia 36: Testes E2E
  - ✅ Dia 37: Correções e Ajustes
  - ✅ Dia 38: Documentação Final

### Completado
- ✅ Migrations executadas (db:generate e db:push)
- ✅ Sistema rodando e testado
- ✅ Tabela `product_images` criada no banco de dados
- ✅ Tabela `coupons` criada no banco de dados (via schema)
- ✅ Tabela `notifications` criada no banco de dados (via schema)
- ✅ Campos `resetToken` e `resetTokenExpiry` adicionados ao User (via schema)

### Adicionado no Módulo 1
- **Backend**: Rotas completas para upload, listagem, atualização e exclusão de imagens
- **Frontend**: Componentes ImageUploader, ImageGallery e ProductImageManager
- **Integração**: Gerenciamento de imagens no AdminPage e galeria no ProductDetailPage

### Adicionado no Módulo 2
- **Backend**: Rotas CRUD completas para cupons (`/api/coupons`), rota de validação pública (`POST /api/coupons/validate`)
- **Backend**: Integração de cupons na criação de pedidos (cálculo de desconto, validação, atualização de uso)
- **Frontend**: Página AdminCouponsPage com CRUD completo de cupons
- **Frontend**: Componente CouponInput para checkout com validação em tempo real
- **Frontend**: Integração no CheckoutPage com exibição de desconto no resumo
- **Funcionalidades**: Descontos percentuais e fixos, compra mínima, desconto máximo, limite de usos, período de validade

### Adicionado no Módulo 3
- **Backend**: Rotas REST completas para notificações (`/api/notifications`) - GET, PATCH, DELETE
- **Backend**: Serviço `NotificationService` com métodos para criar notificações (pedidos, estoque, cupons, sistema)
- **Backend**: Integração de eventos automáticos (novo pedido → notifica admins, atualização status → notifica cliente, estoque baixo → notifica admins, cupom usado → notifica admins)
- **Frontend**: `NotificationContext` com polling automático (30 segundos)
- **Frontend**: Componente `NotificationDropdown` integrado no Header com badge de contagem
- **Frontend**: Interface completa de notificações (listar, marcar como lida, deletar, navegação por tipo)
- **Funcionalidades**: Notificações de pedidos, estoque, cupons e sistema, marcação como lida individual e em massa

### Adicionado no Módulo 4
- **Backend**: Serviço `EmailService` com templates HTML (registro, pedido, status, recuperação de senha)
- **Backend**: Rotas de recuperação de senha (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`)
- **Backend**: Campos `resetToken` e `resetTokenExpiry` no modelo User para recuperação de senha
- **Backend**: Integração de emails em eventos (registro → email de boas-vindas, pedido → email de confirmação, atualização status → email de status)
- **Frontend**: Página `ForgotPasswordPage` para solicitar recuperação de senha
- **Frontend**: Página `ResetPasswordPage` para redefinir senha com token
- **Frontend**: Link "Esqueceu sua senha?" no `LoginPage`
- **Frontend**: Métodos `forgotPassword` e `resetPassword` em `authAPI`
- **Funcionalidades**: Recuperação de senha com token temporário (1 hora), templates HTML responsivos, emails de confirmação automáticos

### Adicionado no Módulo 5
- **Backend**: Rotas de analytics (`GET /api/admin/analytics/overview`, `GET /api/admin/analytics/trends`)
- **Backend**: Métricas avançadas (taxa de conversão, ticket médio, abandono, cupons, clientes novos vs recorrentes, top produtos, categorias, horários de pico)
- **Backend**: Comparação de períodos para análise de tendências
- **Frontend**: Componente `AnalyticsOverview.tsx` com gráficos interativos (Line, Bar, Pie)
- **Frontend**: Filtros de período (data inicial e final) para análise personalizada
- **Frontend**: Integração no AdminPage (aba Analytics)
- **Funcionalidades**: Dashboard analytics completo com visualizações avançadas, filtros e comparações

### Adicionado no Módulo 6
- **Backend**: Busca avançada com filtros múltiplos (preço min/max, tamanho, cor, estoque, categoria)
- **Backend**: Busca case-insensitive otimizada para MySQL (removido `mode: insensitive`)
- **Backend**: Ordenação múltipla (preço, nome, data, featured) com direção (asc/desc)
- **Backend**: Rota de sugestões de busca (`GET /api/products/search/suggestions`)
- **Backend**: Autocomplete com busca parcial (mínimo 2 caracteres)
- **Backend**: Combinação correta de filtros usando `where.AND` (corrigido)
- **Backend**: Otimização de filtros de preço (só aplica quando necessário)
- **Frontend**: `SearchBar.tsx` melhorado com sugestões em tempo real
- **Frontend**: `SearchBar` adicionado no Header (visível em todas as páginas desktop)
- **Frontend**: Navegação por teclado nas sugestões (setas ↑↓, Enter, Escape)
- **Frontend**: Botão de limpar busca (X) no SearchBar
- **Frontend**: Ordenação avançada no `ShopPage.tsx` (dropdown de ordenação)
- **Frontend**: Filtros aplicados no backend (melhor performance)
- **Frontend**: Otimização de filtros de preço (só envia quando diferente de [0, 500])
- **Frontend**: Sincronização correta do `FilterSidebar` com `useEffect`
- **Frontend**: Leitura de parâmetros da URL (`?search=...`)
- **Frontend**: Método `getSearchSuggestions` em `productsAPI`
- **Funcionalidades**: Busca avançada com autocomplete, filtros múltiplos, ordenação flexível, sugestões inteligentes

### Corrigido no Módulo 6 (Janeiro 2025)
- **Bug**: Busca substituía outros filtros quando havia `where.OR`
  - **Fix**: Uso de `where.AND` para combinar filtros corretamente
- **Bug**: Filtros de preço sempre enviados mesmo quando padrão [0, 500]
  - **Fix**: Só envia quando diferente do padrão no frontend
  - **Fix**: Backend só aplica quando minPrice > 0 ou maxPrice < 10000
- **Bug**: FilterSidebar não sincronizava com mudanças externas
  - **Fix**: Adicionado `useEffect` para sincronizar `priceRange`
- **Bug**: SearchBar não estava visível facilmente
  - **Fix**: Adicionado SearchBar no Header (desktop)
- **Bug**: Parâmetros vazios sendo enviados desnecessariamente
  - **Fix**: Validação de parâmetros antes de enviar

### Decisões
- **Dia 2 Postergado**: Setup de infraestrutura (serviços externos) postergado para depois. Usando soluções temporárias (base64, polling, log) até configurar cloud storage, SendGrid e WebSocket.
- **Estratégia Base64**: Sistema funciona com base64 temporariamente, migração para cloud storage será transparente quando configurado.
- **Estratégia Polling**: Notificações usando polling (30s) em vez de WebSocket temporariamente. Migração para WebSocket será transparente quando configurado.
- **Estratégia Log de Emails**: Emails usando log em vez de SendGrid temporariamente. Migração para SendGrid será transparente quando configurado (apenas substituir método `sendEmail`).

---

## [1.0.0] - 2024-12 / 2025-01 - ✅ Versão Estável

### Adicionado
- **Backend Completo:**
  - Servidor Express com TypeScript
  - API RESTful completa
  - Autenticação JWT
  - Banco de dados MySQL com Prisma ORM
  - Sistema de avaliações de produtos
  - Upload e gerenciamento de logo do site

- **Frontend Completo:**
  - Interface React com TypeScript
  - Design responsivo e tema infantil
  - Sistema de autenticação completo
  - Carrinho de compras persistente
  - Sistema completo de checkout
  - Histórico de pedidos
  - Sistema de avaliações visível ao usuário

- **Painel Administrativo:**
  - Dashboard com estatísticas e gráficos
  - Gerenciamento completo de produtos
  - Gerenciamento de pedidos com atualização de status
  - Gerenciamento de categorias
  - Gerenciamento de usuários
  - Relatórios de vendas com exportação CSV
  - Upload e gerenciamento de logo

- **Segurança e Performance:**
  - Hash de senhas com bcrypt
  - Validação completa de formulários
  - Tratamento centralizado de erros
  - Otimizações de queries (correção de N+1)
  - Batch loading implementado

- **Documentação:**
  - README.md completo e detalhado
  - API_DOCUMENTATION.md
  - GUIA_USUARIO.md
  - MYSQL_SETUP.md
  - PERFORMANCE_OPTIMIZATIONS.md
  - MELHORIAS.md

### Características
- Interface 100% em português
- Design responsivo mobile-first
- Tema infantil com cores vibrantes
- Sistema completo de e-commerce
- Painel administrativo completo

---

## [Unreleased]

### Planejado para Futuro
- Integração com gateway de pagamento real
- Sistema de rastreamento de entregas
- PWA (Progressive Web App)
- Internacionalização (i18n)
- Sistema de cupons e descontos (em desenvolvimento v1.2)
- Upload real de imagens em cloud storage (em desenvolvimento v1.2)
- Notificações em tempo real (em desenvolvimento v1.2)
- Sistema completo de emails (em desenvolvimento v1.2)

---

## Tipos de Mudanças

- **Adicionado**: Para novas funcionalidades
- **Alterado**: Para mudanças em funcionalidades existentes
- **Deprecado**: Para funcionalidades que serão removidas
- **Removido**: Para funcionalidades removidas
- **Corrigido**: Para correções de bugs
- **Segurança**: Para vulnerabilidades corrigidas

---

**Última Atualização**: Janeiro 2025  
**Versão Atual**: 1.2.0 (Completa e Testada)  
**Versão Anterior**: 1.0.0 (Estável)

