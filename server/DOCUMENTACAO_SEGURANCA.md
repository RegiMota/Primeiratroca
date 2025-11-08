# 🔐 Documentação - Módulo 8: Segurança Avançada
## Versão 2.0

**Status**: ✅ Backend Concluído  
**Versão**: 2.0.0  
**Data**: Janeiro 2025

---

## 📋 Visão Geral

O Módulo 8 implementa funcionalidades avançadas de segurança para proteger o sistema contra ataques e garantir a integridade dos dados.

### Funcionalidades Implementadas

1. ✅ **2FA (Autenticação de Dois Fatores)** - TOTP via apps autenticadores
2. ✅ **Rate Limiting** - Proteção contra ataques de força bruta
3. ✅ **reCAPTCHA** - Proteção contra bots
4. ✅ **Auditoria** - Registro de ações críticas

---

## 🔐 2FA (Autenticação de Dois Fatores)

### Visão Geral

O sistema implementa 2FA usando TOTP (Time-based One-Time Password), compatível com apps como Google Authenticator, Authy, Microsoft Authenticator, etc.

### Configuração

#### 1. Adicionar campos ao banco de dados

Execute a migration:

```bash
# Executar migration SQL
mysql -u root -p primeira_troca < prisma/migrations/add_2fa_fields.sql
```

Ou via Prisma:

```bash
npx prisma db push
```

#### 2. Variáveis de Ambiente

Não são necessárias variáveis de ambiente específicas para 2FA. O sistema usa `speakeasy` que não requer configuração externa.

### Rotas da API

#### Setup 2FA

```http
POST /api/auth/2fa/setup
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,...",
  "backupCodes": ["12345678", "87654321", ...]
}
```

#### Verificar e Habilitar 2FA

```http
POST /api/auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Desabilitar 2FA

```http
POST /api/auth/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "senha_do_usuario"
}
```

#### Regenerar Códigos de Backup

```http
POST /api/auth/2fa/backup-codes
Authorization: Bearer <token>
```

#### Verificar Status do 2FA

```http
GET /api/auth/2fa/status
Authorization: Bearer <token>
```

### Integração no Login

O login agora suporta 2FA:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha",
  "twoFactorToken": "123456"  // Opcional se 2FA estiver habilitado
}
```

**Se 2FA estiver habilitado e token não fornecido:**
```json
{
  "requiresTwoFactor": true,
  "message": "Código 2FA necessário"
}
```

### Códigos de Backup

Cada usuário recebe 8 códigos de backup quando configura 2FA. Estes códigos podem ser usados caso o app autenticador não esteja disponível.

**Importante**: Os códigos de backup são exibidos apenas uma vez durante a configuração. Anote-os em local seguro!

---

## 🛡️ Rate Limiting

### Visão Geral

O sistema implementa rate limiting em múltiplas camadas para proteger contra ataques de força bruta e abuso da API.

### Rate Limiters Implementados

#### 1. Global Rate Limiter

- **Limite**: 100 requisições por IP a cada 15 minutos
- **Aplicado**: Todas as rotas `/api/*`
- **Ação**: Retorna 429 (Too Many Requests)

#### 2. Auth Rate Limiter

- **Limite**: 5 tentativas por IP a cada 15 minutos
- **Aplicado**: `/api/auth/login`, `/api/auth/register`
- **Ação**: Retorna 429 (Too Many Requests)
- **Nota**: Não conta requisições bem-sucedidas

#### 3. Admin Rate Limiter

- **Limite**: 50 requisições por IP a cada 15 minutos
- **Aplicado**: Todas as rotas `/api/admin/*`
- **Ação**: Retorna 429 (Too Many Requests)

#### 4. Checkout Rate Limiter

- **Limite**: 10 tentativas por IP a cada 15 minutos
- **Aplicado**: `/api/orders` (POST)
- **Ação**: Retorna 429 (Too Many Requests)

#### 5. Password Reset Rate Limiter

- **Limite**: 3 tentativas por IP a cada hora
- **Aplicado**: `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Ação**: Retorna 429 (Too Many Requests)

### Headers de Resposta

O sistema retorna headers padrão de rate limiting:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640995200
Retry-After: 900
```

### Configuração

Os limites podem ser ajustados em `server/middleware/rateLimit.ts`.

---

## 🤖 reCAPTCHA

### Visão Geral

O sistema implementa reCAPTCHA v2 (checkbox) e v3 (score-based) para proteger formulários contra bots.

### Configuração

#### Variáveis de Ambiente

```env
# Habilitar reCAPTCHA
RECAPTCHA_ENABLED=true

# Chave secreta do Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Score mínimo para reCAPTCHA v3 (0.0 a 1.0)
RECAPTCHA_MIN_SCORE=0.5
```

#### Obter Chaves reCAPTCHA

1. Acesse [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Crie um novo site
3. Escolha reCAPTCHA v2 ou v3
4. Copie a chave secreta para `RECAPTCHA_SECRET_KEY`

### Middleware

#### verifyRecaptcha (Obrigatório)

Bloqueia requisições se reCAPTCHA falhar.

```typescript
router.post('/register', verifyRecaptcha, async (req, res) => {
  // ...
});
```

#### optionalRecaptcha (Opcional)

Não bloqueia, apenas verifica e loga.

```typescript
router.post('/order', optionalRecaptcha, async (req, res) => {
  // ...
});
```

### Uso no Frontend

#### reCAPTCHA v2 (Checkbox)

```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
```

```javascript
// Obter token
const token = grecaptcha.getResponse();
```

#### reCAPTCHA v3 (Score-based)

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

```javascript
// Obter token
grecaptcha.ready(() => {
  grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' }).then((token) => {
    // Enviar token no body ou header
    fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'x-recaptcha-token': token,
      },
      body: JSON.stringify({ ... }),
    });
  });
});
```

### Rotas Protegidas

- ✅ `/api/auth/register` - Registro de usuário
- ✅ `/api/auth/login` - Login

### Desabilitar em Desenvolvimento

Se `RECAPTCHA_ENABLED=false` ou `RECAPTCHA_SECRET_KEY` não estiver definido, o middleware permite todas as requisições (apenas em desenvolvimento).

---

## 📝 Auditoria

### Visão Geral

O sistema registra todas as ações críticas realizadas por usuários e administradores.

### Modelo AuditLog

```prisma
model AuditLog {
  id          Int
  userId      Int?
  userEmail   String?
  action      String      // 'create', 'update', 'delete', 'login', etc.
  resourceType String     // 'user', 'product', 'order', 'auth', etc.
  resourceId  Int?
  details     String?     // JSON com detalhes adicionais
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime
}
```

### Ações Registradas

#### Autenticação
- `login_success` - Login bem-sucedido
- `login_failed` - Login falhado
- `login_2fa_required` - Login requer 2FA
- `login_2fa_failed` - Token 2FA inválido
- `2fa_setup_initiated` - Início da configuração de 2FA
- `2fa_enabled` - 2FA habilitado
- `2fa_disabled` - 2FA desabilitado
- `2fa_backup_codes_regenerated` - Códigos de backup regenerados

#### Pedidos
- `order_created` - Pedido criado

#### Produtos (Admin)
- `create` - Produto criado
- `update` - Produto atualizado
- `delete` - Produto deletado

#### Pedidos (Admin)
- `update` - Status de pedido atualizado

### Rotas Admin

#### Listar Logs

```http
GET /api/admin/audit/logs?userId=1&action=login&page=1&limit=50
Authorization: Bearer <admin_token>
```

**Parâmetros de Query:**
- `userId` - Filtrar por usuário
- `action` - Filtrar por ação
- `resourceType` - Filtrar por tipo de recurso
- `resourceId` - Filtrar por ID do recurso
- `startDate` - Data inicial (ISO 8601)
- `endDate` - Data final (ISO 8601)
- `page` - Página (padrão: 1)
- `limit` - Limite por página (padrão: 50)

#### Estatísticas

```http
GET /api/admin/audit/stats?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <admin_token>
```

**Resposta:**
```json
{
  "totalLogs": 1523,
  "logsByAction": [
    { "action": "login_success", "count": 450 },
    { "action": "order_created", "count": 123 },
    ...
  ],
  "logsByResourceType": [
    { "resourceType": "auth", "count": 500 },
    { "resourceType": "order", "count": 123 },
    ...
  ],
  "topUsers": [...]
}
```

### Uso no Código

```typescript
import { AuditService } from '../services/AuditService';

// Registrar ação
await AuditService.log({
  userId: req.userId,
  userEmail: req.user?.email,
  action: 'create',
  resourceType: 'product',
  resourceId: product.id,
  details: { name: product.name, price: product.price },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

---

## 🔧 Configuração Completa

### Variáveis de Ambiente

```env
# JWT
JWT_SECRET=your_jwt_secret_here

# Rate Limiting (opcional - usar padrões)
# Os limites são configurados em server/middleware/rateLimit.ts

# reCAPTCHA
RECAPTCHA_ENABLED=true
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_MIN_SCORE=0.5

# Auditoria (não requer configuração)
# AuditLog já está no schema Prisma
```

### Executar Migrations

```bash
# Opção 1: Via Prisma
npx prisma db push

# Opção 2: Via SQL direto
mysql -u root -p primeira_troca < prisma/migrations/add_2fa_fields.sql
```

### Instalar Dependências

Todas as dependências já estão no `package.json`:
- ✅ `speakeasy` - 2FA TOTP
- ✅ `qrcode` - Geração de QR codes
- ✅ `express-rate-limit` - Rate limiting
- ✅ `axios` - Verificação reCAPTCHA (já instalado)

---

## 🧪 Testes

### Testar 2FA

1. **Configurar 2FA:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/2fa/setup \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

2. **Escanear QR Code** com app autenticador

3. **Verificar e Habilitar:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/2fa/verify \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"token": "123456"}'
   ```

4. **Testar Login com 2FA:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "senha"}'
   # Retorna: {"requiresTwoFactor": true}
   
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "senha", "twoFactorToken": "123456"}'
   ```

### Testar Rate Limiting

```bash
# Fazer múltiplas requisições rapidamente
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# Deve retornar 429 após 5 tentativas
```

### Testar reCAPTCHA

1. **Sem token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Test", "email": "test@example.com", "password": "123456"}'
   # Deve retornar erro se RECAPTCHA_ENABLED=true
   ```

2. **Com token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -H "x-recaptcha-token: <token_from_frontend>" \
     -d '{"name": "Test", "email": "test@example.com", "password": "123456"}'
   ```

### Testar Auditoria

```bash
# Fazer login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha"}'

# Verificar logs
curl -X GET "http://localhost:5000/api/admin/audit/logs?action=login_success" \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📊 Monitoramento

### Logs de Segurança

O sistema registra logs importantes:

```
[StockJob] Iniciando verificação de estoque baixo...
[Audit] Admin Action: admin@example.com - create - product
[RateLimit] IP 192.168.1.100 excedeu limite de requisições
[reCAPTCHA] Score too low: 0.3 (min: 0.5)
```

### Métricas Recomendadas

- **Login falhados**: Monitorar `login_failed` na auditoria
- **Tentativas de 2FA inválidas**: Monitorar `login_2fa_failed`
- **Rate limiting ativado**: Monitorar logs de 429
- **reCAPTCHA falhado**: Monitorar logs de verificação
- **Ações admin**: Monitorar todas as ações em rotas `/api/admin/*`

---

## 🚀 Próximos Passos (v2.1)

### Frontend

- [ ] Interface para habilitar/desabilitar 2FA
- [ ] Exibição de QR code no frontend
- [ ] Campo TOTP no formulário de login
- [ ] Integração reCAPTCHA nos formulários
- [ ] Dashboard de segurança no admin
- [ ] Visualização de logs de auditoria no admin

### Melhorias

- [ ] SMS como método alternativo de 2FA
- [ ] Email como método alternativo de 2FA
- [ ] Notificações de segurança (login suspeito, etc.)
- [ ] Detecção de atividades suspeitas (IA)
- [ ] Whitelist de IPs para admin

---

## 📚 Referências

- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Backend Concluído - Frontend Pendente (v2.1)

