# 🔐 Documentação de Acesso - Admin Panel
## Versão 2.0 - Painel Administrativo Separado

**Status**: ✅ Concluído  
**Versão**: 2.0.0  
**Data**: Janeiro 2025

---

## 📋 Visão Geral

O painel administrativo foi **completamente separado** do site principal na Versão 2.0 para maior segurança e isolamento.

### Características de Segurança

- ✅ **Aplicação React separada** - Build independente
- ✅ **URL separada** - Porta 3001 em desenvolvimento
- ✅ **Autenticação isolada** - Token separado (`admin_token`)
- ✅ **Middleware de segurança adicional** - `requireAdminSecure`
- ✅ **Validação dupla** - Token JWT + verificação no banco
- ✅ **Rate limiting** - Proteção contra ataques
- ✅ **IP Whitelist** - Opcional (configurável via env)

---

## 🚀 Como Acessar

### Desenvolvimento

1. **Iniciar o servidor backend** (se ainda não estiver rodando):
   ```bash
   cd server
   npm run dev
   ```
   O servidor estará em: `http://localhost:5000`

2. **Iniciar o admin panel**:
   ```bash
   cd admin
   npm install  # Se ainda não instalou
   npm run dev
   ```
   O admin estará em: `http://localhost:3001`

3. **Acessar o admin**:
   - Abra o navegador em: `http://localhost:3001`
   - Faça login com credenciais de administrador
   - Apenas usuários com `isAdmin: true` podem acessar

### Produção

1. **Build do admin**:
   ```bash
   cd admin
   npm run build
   ```

2. **Configurar servidor web**:
   - Configure nginx ou similar para servir o admin em subdomínio ou rota dedicada
   - Exemplo: `admin.primeiratroca.com.br` ou `primeiratroca.com.br/admin`
   - Configure CORS no backend para permitir o domínio do admin

3. **Variáveis de ambiente**:
   ```env
   # Backend (.env)
   CORS_ORIGIN=https://admin.primeiratroca.com.br,https://primeiratroca.com.br
   ADMIN_IP_WHITELIST=true  # Opcional
   ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50  # IPs permitidos (opcional)
   ```

---

## 🔐 Autenticação

### Requisitos

- ✅ Usuário deve estar autenticado
- ✅ Usuário deve ter `isAdmin: true` no banco de dados
- ✅ Token JWT válido deve estar presente
- ✅ Token é armazenado como `admin_token` no localStorage

### Fluxo de Autenticação

1. **Login**:
   - Usuário faz login em `/login`
   - Backend valida credenciais e verifica se é admin
   - Se válido, retorna token JWT
   - Token é armazenado como `admin_token` no localStorage

2. **Acesso às Rotas**:
   - Todas as rotas admin são protegidas por `ProtectedRoute`
   - Token é enviado no header `Authorization: Bearer <token>`
   - Backend valida token e verifica permissões

3. **Validação Dupla**:
   - Token JWT é verificado
   - Usuário é verificado no banco de dados
   - Se não for admin, acesso é negado

### Logout

- Token é removido do localStorage
- Usuário é redirecionado para `/login`

---

## 🛡️ Segurança

### Middleware de Segurança

Todas as rotas `/api/admin/*` usam o middleware `requireAdminSecure` que:

1. ✅ Verifica token JWT
2. ✅ Valida se usuário é admin no token
3. ✅ Verifica se usuário ainda é admin no banco
4. ✅ Valida IP (se IP whitelist estiver ativado)
5. ✅ Registra ações (auditoria - em desenvolvimento)

### Rate Limiting

- Rotas admin têm rate limiting específico
- Proteção contra ataques de força bruta
- Limites configuráveis via middleware

### IP Whitelist (Opcional)

Para ativar restrição de IP:

```env
# .env do backend
ADMIN_IP_WHITELIST=true
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50
```

**Nota**: Em desenvolvimento, IP whitelist é ignorado. Em produção, bloqueia IPs não autorizados.

---

## 📁 Estrutura de Arquivos

```
admin/
├── src/
│   ├── components/          # Componentes do admin
│   │   ├── ui/              # Componentes Shadcn UI
│   │   └── AdminLayout.tsx # Layout principal
│   ├── pages/               # Páginas do admin
│   │   ├── LoginPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # Contexto de autenticação isolado
│   ├── lib/
│   │   ├── api.ts           # API client com validação admin
│   │   └── validation.ts
│   ├── App.tsx              # App principal com rotas protegidas
│   └── main.tsx             # Entry point
├── index.html
├── vite.config.ts           # Configuração Vite
├── package.json
└── tsconfig.json
```

---

## 🔗 API Backend

### Rotas Admin

Todas as rotas admin estão em `/api/admin/*`:

- `/api/admin/dashboard` - Estatísticas do dashboard
- `/api/admin/products` - Gerenciamento de produtos
- `/api/admin/orders` - Gerenciamento de pedidos
- `/api/admin/users` - Gerenciamento de usuários
- `/api/admin/payments` - Gerenciamento de pagamentos
- `/api/admin/stock` - Gerenciamento de estoque
- `/api/admin/shipping` - Gerenciamento de entregas
- `/api/admin/tickets` - Gerenciamento de tickets
- E mais...

### Middleware de Proteção

Todas as rotas admin usam:
- `requireAdminSecure` - Validação de segurança adicional
- `adminRateLimiter` - Rate limiting específico para admin

---

## 🧪 Testes

### Testes Manuais

1. **Teste de Isolamento**:
   - Acesse `http://localhost:3000` (site principal)
   - Verifique que não há links para admin
   - Acesse `http://localhost:3001` (admin)
   - Verifique que admin funciona independentemente

2. **Teste de Autenticação**:
   - Tente acessar `/dashboard` sem login → deve redirecionar para `/login`
   - Faça login com usuário não-admin → deve negar acesso
   - Faça login com usuário admin → deve permitir acesso

3. **Teste de Token**:
   - Faça login no admin
   - Verifique `localStorage.getItem('admin_token')` → deve ter token
   - Faça logout → token deve ser removido

---

## 📝 Checklist de Deploy

### Pré-Deploy

- [ ] Build do admin executado (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado no backend
- [ ] IP whitelist configurado (se necessário)
- [ ] Testes de isolamento executados

### Deploy

- [ ] Servidor web configurado para admin
- [ ] URL do admin configurada (subdomínio ou rota)
- [ ] Certificado SSL configurado
- [ ] Backend configurado para aceitar requisições do admin

### Pós-Deploy

- [ ] Teste de acesso ao admin em produção
- [ ] Teste de autenticação em produção
- [ ] Monitoramento de logs configurado
- [ ] Backup de configurações

---

## ⚠️ Troubleshooting

### Admin não carrega

1. Verifique se o servidor backend está rodando
2. Verifique `VITE_API_URL` no `.env` do admin
3. Verifique console do navegador para erros

### Erro 401/403 ao acessar rotas

1. Verifique se token está presente no localStorage
2. Verifique se usuário tem `isAdmin: true`
3. Verifique se token não expirou
4. Tente fazer logout e login novamente

### CORS Error

1. Verifique `CORS_ORIGIN` no backend
2. Certifique-se que a URL do admin está incluída
3. Verifique se `credentials: true` está configurado

---

## 📚 Referências

- [README do Admin](./README.md)
- [Cronograma V2.0](../CRONOGRAMA_V2.0.md)
- [Progresso V2.0](../PROGRESSO_V2.0.md)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Concluído

