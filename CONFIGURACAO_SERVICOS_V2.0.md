# ⚙️ Configuração de Serviços - Versão 2.0
## Primeira Troca - Guia de Configuração de Serviços Externos

**Versão**: 2.0.0  
**Status**: 📋 Planejamento  
**Data**: Janeiro 2025

---

## 📋 Overview

Este documento detalha a configuração de todos os serviços externos necessários para a Versão 2.0.

**Serviços Necessários:**
1. 💳 Gateway de Pagamento (Stripe/Mercado Pago/PagSeguro)
2. 📮 API dos Correios (Frete)
3. 📊 Google Analytics (Opcional)
4. 🗺️ Hotjar/Microsoft Clarity (Opcional - Analytics)

**Serviços Já Configurados (v1.2):**
- ✅ Cloudinary (Upload de Imagens)
- ✅ SendGrid (Emails)
- ✅ Socket.io (Notificações em Tempo Real)

---

## 💳 1. Gateway de Pagamento

### Opções Disponíveis

#### Opção 1: Mercado Pago (Recomendado para Brasil)
**Vantagens:**
- ✅ Aceita PIX, boleto e cartão
- ✅ Aprovação rápida
- ✅ Documentação em português
- ✅ SDK Node.js oficial

**Desvantagens:**
- Taxas um pouco mais altas

**Processo de Aprovação:** 1-3 dias úteis

---

#### Opção 2: Stripe
**Vantagens:**
- ✅ Internacional, usado globalmente
- ✅ Taxas competitivas
- ✅ Excelente documentação
- ✅ SDK Node.js robusto

**Desvantagens:**
- Aprovação pode demorar (7-14 dias)
- Focado principalmente em cartão de crédito (PIX e boleto via checkout separado)

**Processo de Aprovação:** 7-14 dias úteis

---

#### Opção 3: PagSeguro
**Vantagens:**
- ✅ Brasileiro, popular no Brasil
- ✅ Aceita PIX, boleto e cartão
- ✅ Aprovação rápida

**Desvantagens:**
- Documentação menos moderna
- SDK Node.js menos atualizado

**Processo de Aprovação:** 2-5 dias úteis

---

### Configuração: Mercado Pago

#### Passo 1: Criar Conta
1. Acessar: https://www.mercadopago.com.br/
2. Criar conta (pessoal ou empresa)
3. Completar cadastro

#### Passo 2: Obter Credenciais
1. Acessar: https://www.mercadopago.com.br/developers/panel
2. Criar nova aplicação
3. Copiar:
   - **Access Token** (Produção)
   - **Public Key** (Frontend)

#### Passo 3: Configurar Webhooks
1. Em "Webhooks", adicionar URL:
   ```
   https://api.primeiratroca.com.br/api/webhooks/payments/mercadopago
   ```
2. Selecionar eventos:
   - `payment`
   - `payment.updated`

#### Passo 4: Configurar no .env

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR_PUB_xxxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxxxxx

# Ambiente
PAYMENT_GATEWAY=mercadopago
PAYMENT_ENVIRONMENT=sandbox  # ou production
```

#### Passo 5: Instalar SDK

```bash
npm install mercadopago
```

#### Passo 6: Testar Integração

```bash
# Testar com cartão de teste
npm run test:payment
```

---

### Configuração: Stripe

#### Passo 1: Criar Conta
1. Acessar: https://stripe.com/
2. Criar conta
3. Completar cadastro e verificar email

#### Passo 2: Obter API Keys
1. Acessar: https://dashboard.stripe.com/apikeys
2. Copiar:
   - **Secret Key** (Produção)
   - **Publishable Key** (Frontend)

#### Passo 3: Configurar Webhooks
1. Acessar: https://dashboard.stripe.com/webhooks
2. Adicionar endpoint:
   ```
   https://api.primeiratroca.com.br/api/webhooks/payments/stripe
   ```
3. Selecionar eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

#### Passo 4: Configurar no .env

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Ambiente
PAYMENT_GATEWAY=stripe
PAYMENT_ENVIRONMENT=production
```

#### Passo 5: Instalar SDK

```bash
npm install stripe
```

---

## 📮 2. API dos Correios

### Passo 1: Criar Conta
1. Acessar: https://www.correios.com.br/
2. Criar conta empresarial (se necessário)
3. Acessar: https://www.correios.com.br/precisa-de-ajuda/atendimento/aplicativo-mobile-e-servicos-on-line

### Passo 2: Obter Credenciais
1. Acessar: https://www.correios.com.br/precisa-de-ajuda/acesso-a-informacao/sobre-codigos-e-funcionalidades-dos-correios
2. Solicitar acesso à API:
   - **CEP Web Service** (gratuito, limitado)
   - **Precificação** (precisa de contrato)
   - **Rastreamento** (gratuito via SOAP)

### Passo 3: Configurar no .env

```env
# Correios
CORREIOS_USER=xxxxxxxxxx
CORREIOS_PASSWORD=xxxxxxxxxx
CORREIOS_CODE=xxxxxxxxxx  # Código administrativo (se aplicável)

# Cache (opcional)
CORREIOS_CACHE_ENABLED=true
CORREIOS_CACHE_TTL=3600  # 1 hora em segundos
```

### Passo 4: Instalar SDK

```bash
npm install correios-brasil
# OU
npm install @correios/soap
```

### Passo 5: Implementar Serviço

```typescript
// server/services/ShippingService.ts
import { calcularPrecoPrazo } from 'correios-brasil';

export class ShippingService {
  static async calculateShipping(
    cep: string,
    dimensions: { width: number; height: number; length: number },
    weight: number
  ) {
    // Implementar cálculo de frete
  }
}
```

---

## 📊 3. Google Analytics

### Passo 1: Criar Conta
1. Acessar: https://analytics.google.com/
2. Criar conta (gratuita)
3. Criar propriedade para o site

### Passo 2: Obter Measurement ID
1. Em "Administração" → "Fluxos de dados"
2. Criar fluxo de dados web
3. Copiar **Measurement ID** (ex: `G-XXXXXXXXXX`)

### Passo 3: Configurar no Frontend

```typescript
// src/lib/analytics.ts
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inicializar
gtag('config', GA_MEASUREMENT_ID);
```

### Passo 4: Configurar no .env

```env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Passo 5: Instalar SDK

```bash
npm install @analytics/google-analytics
```

---

## 🗺️ 4. Hotjar/Microsoft Clarity (Opcional)

### Opção 1: Microsoft Clarity (Recomendado - Gratuito)

#### Passo 1: Criar Conta
1. Acessar: https://clarity.microsoft.com/
2. Criar conta com Microsoft
3. Criar novo projeto

#### Passo 2: Obter Script
1. Copiar script de rastreamento
2. Adicionar no `index.html`:

```html
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "XXXXXXXXXX");
</script>
```

### Opção 2: Hotjar

#### Passo 1: Criar Conta
1. Acessar: https://www.hotjar.com/
2. Criar conta (plano gratuito disponível)
3. Criar site

#### Passo 2: Obter Site ID
1. Copiar **Site ID**
2. Adicionar no frontend

---

## 🔐 5. Configuração de Segurança (2FA e reCAPTCHA)

### reCAPTCHA v3

#### Passo 1: Criar Conta
1. Acessar: https://www.google.com/recaptcha/admin
2. Criar novo site
3. Escolher **reCAPTCHA v3**

#### Passo 2: Obter Keys
1. Copiar:
   - **Site Key** (Frontend)
   - **Secret Key** (Backend)

#### Passo 3: Configurar no .env

```env
# reCAPTCHA
RECAPTCHA_SITE_KEY=xxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=xxxxxxxxxxxxx
```

#### Passo 4: Instalar SDK

```bash
npm install google-recaptcha-v3
```

---

## 📋 Variáveis de Ambiente Completas (.env.example)

```env
# ============================================
# PRIMEIRA TROCA - Versão 2.0
# ============================================

# ============================================
# BANCO DE DADOS
# ============================================
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"

# ============================================
# AUTENTICAÇÃO
# ============================================
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# ============================================
# SERVIDOR
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# PAGAMENTO - MERCADO PAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR_PUB_xxxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxxxxx
PAYMENT_GATEWAY=mercadopago
PAYMENT_ENVIRONMENT=sandbox  # ou production

# ============================================
# PAGAMENTO - STRIPE (Alternativa)
# ============================================
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
# PAYMENT_GATEWAY=stripe

# ============================================
# FRETE - CORREIOS
# ============================================
CORREIOS_USER=xxxxxxxxxx
CORREIOS_PASSWORD=xxxxxxxxxx
CORREIOS_CODE=xxxxxxxxxx
CORREIOS_CACHE_ENABLED=true
CORREIOS_CACHE_TTL=3600

# ============================================
# IMAGENS - CLOUDINARY (v1.2)
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ============================================
# EMAILS - SENDGRID (v1.2)
# ============================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br
SENDGRID_FROM_NAME=Primeira Troca

# ============================================
# NOTIFICAÇÕES - SOCKET.IO (v1.2)
# ============================================
SOCKET_IO_ENABLED=true
WEBSOCKET_PORT=5001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# ============================================
# ANALYTICS - GOOGLE ANALYTICS
# ============================================
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# SEGURANÇA - reCAPTCHA
# ============================================
RECAPTCHA_SITE_KEY=xxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=xxxxxxxxxxxxx

# ============================================
# FRONTEND
# ============================================
VITE_API_URL=http://localhost:5000
```

---

## ✅ Checklist de Configuração

### Fase 1: Serviços Críticos
- [ ] Gateway de pagamento escolhido
- [ ] Conta criada e aprovada
- [ ] Credenciais obtidas
- [ ] Webhooks configurados
- [ ] Testado em sandbox

- [ ] API dos Correios configurada
- [ ] Credenciais obtidas
- [ ] Teste de cálculo de frete funcionando

### Fase 2: Serviços Opcionais
- [ ] Google Analytics configurado
- [ ] Measurement ID adicionado

- [ ] Microsoft Clarity ou Hotjar configurado
- [ ] Script adicionado no frontend

- [ ] reCAPTCHA configurado
- [ ] Site Key e Secret Key obtidos

### Fase 3: Validação
- [ ] Todas as variáveis de ambiente configuradas
- [ ] `.env.example` atualizado
- [ ] Serviços testados individualmente
- [ ] Integração completa testada

---

## 🔧 Troubleshooting

### Gateway de Pagamento

**Erro: "Invalid credentials"**
- Verificar se está usando credenciais corretas (sandbox vs produção)
- Verificar se conta foi aprovada

**Webhook não está sendo recebido**
- Verificar URL pública (usar ngrok para desenvolvimento)
- Verificar se eventos estão selecionados corretamente
- Verificar logs do servidor

### API dos Correios

**Erro: "Usuário não autorizado"**
- Verificar credenciais
- Verificar se contrato está ativo
- Contatar suporte dos Correios se necessário

**Cálculo de frete retorna erro**
- Verificar formato do CEP
- Verificar dimensões e peso (valores máximos)

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Planejamento

