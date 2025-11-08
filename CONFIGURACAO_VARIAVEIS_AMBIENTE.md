# 🔐 Configuração de Variáveis de Ambiente
## Versão 2.0 - Módulo 8: Segurança Avançada

**Status**: ✅ Documentação Criada  
**Versão**: 2.0.0  
**Data**: Janeiro 2025

---

## 📋 Visão Geral

Este guia explica como configurar as variáveis de ambiente necessárias para o Módulo 8: Segurança Avançada e outras funcionalidades do sistema.

---

## 🚀 Configuração Rápida

### 1. Criar arquivo .env

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

### 2. Configurar variáveis básicas

Edite o arquivo `.env` e configure:

```env
# Banco de dados
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"

# JWT Secret (gerar uma chave segura)
JWT_SECRET=sua_chave_secreta_aqui

# Porta do servidor
PORT=5000
```

### 3. Gerar JWT Secret seguro

```bash
# Gerar chave aleatória
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Configuração do Módulo 8: Segurança Avançada

### 1. reCAPTCHA

#### Obter chaves do Google reCAPTCHA

1. Acesse: https://www.google.com/recaptcha/admin
2. Clique em "Create"
3. Preencha:
   - **Label**: Primeira Troca
   - **reCAPTCHA type**: Escolha v2 (Checkbox) ou v3 (Score-based)
   - **Domains**: localhost (para desenvolvimento)
4. Copie as chaves:
   - **Site Key** (para frontend)
   - **Secret Key** (para backend)

#### Configurar no .env

```env
# Habilitar reCAPTCHA
RECAPTCHA_ENABLED=true

# Chave secreta (obrigatória se habilitado)
RECAPTCHA_SECRET_KEY=sua_chave_secreta_aqui

# Chave pública (opcional - para frontend)
RECAPTCHA_SITE_KEY=sua_chave_publica_aqui

# Score mínimo para v3 (0.0 a 1.0)
# Recomendado: 0.5
RECAPTCHA_MIN_SCORE=0.5
```

#### Desabilitar em desenvolvimento

Para desenvolvimento local, você pode desabilitar:

```env
RECAPTCHA_ENABLED=false
```

**Nota**: Em desenvolvimento, o middleware permite requisições mesmo sem token se `RECAPTCHA_ENABLED=false`.

---

### 2. IP Whitelist para Admin (Opcional)

Para maior segurança, você pode restringir acesso ao painel admin por IP:

```env
# Lista de IPs permitidos (separado por vírgula)
ADMIN_IP_WHITELIST=192.168.1.100,192.168.1.101
```

**Nota**: Se não configurado, qualquer IP pode acessar (desde que autenticado como admin).

---

### 3. Jobs Agendados

Os jobs agendados (verificação de estoque, wishlist) são habilitados automaticamente em produção.

Para desenvolvimento, você pode habilitar:

```env
ENABLE_JOBS=true
```

**Nota**: Se `ENABLE_JOBS=false` em desenvolvimento, os jobs não serão executados.

---

### 4. Correios API (Frete e Rastreamento) - Módulo 3

Para usar a API real dos Correios para cálculo de frete e rastreamento:

#### Obter credenciais dos Correios

1. Acesse: https://www.correios.com.br/
2. Entre em contato com os Correios para obter acesso à API
3. Obtenha:
   - **Usuário** (login)
   - **Senha** (senha)
   - **Código de Contrato** (opcional, se aplicável)
   - **CEP de Origem** (CEP da loja/ponto de expedição)

#### Configurar no .env

```env
# Habilitar API dos Correios
USE_CORREIOS_API=true

# URL da API (padrão: https://api.correios.com.br)
CORREIOS_API_URL=https://api.correios.com.br

# Credenciais (obrigatórias se habilitado)
CORREIOS_API_USER=seu_usuario_aqui
CORREIOS_API_PASSWORD=sua_senha_aqui

# Código de contrato (opcional)
CORREIOS_API_CODE=

# CEP de origem (padrão: 01310-100 - Av. Paulista, SP)
CORREIOS_ORIGIN_CEP=01310-100
```

#### Desabilitar em desenvolvimento

Para desenvolvimento local, você pode usar cálculos simulados:

```env
USE_CORREIOS_API=false
```

**Nota**: Se `USE_CORREIOS_API=false`, o sistema usa cálculos simulados baseados em peso e distância.

#### Funcionalidades

Quando habilitado, a API dos Correios é usada para:
- ✅ Cálculo de frete real (PAC, SEDEX, SEDEX 10)
- ✅ Rastreamento automático de pedidos
- ✅ Atualização de status de entrega
- ✅ Job agendado atualiza rastreamentos a cada hora

---

### 5. Google Analytics 4 (Analytics Avançado) - Módulo 7

Para usar o Google Analytics 4 para rastreamento de eventos:

#### Obter Measurement ID do Google Analytics

1. Acesse: https://analytics.google.com/
2. Faça login com sua conta Google
3. Crie uma propriedade (ou use uma existente)
4. Em "Administração" → "Fluxos de dados"
5. Clique em "Fluxo de dados web" (ou crie um novo)
6. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

#### Configurar no .env

```env
# Habilitar Google Analytics 4
# Se não configurado, o rastreamento será desabilitado (silencioso)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Desabilitar em desenvolvimento

Para desenvolvimento local, você pode deixar vazio:

```env
# Deixar vazio para desenvolvimento
VITE_GA_MEASUREMENT_ID=
```

**Nota**: Se `VITE_GA_MEASUREMENT_ID` não estiver configurado, o sistema funcionará normalmente, mas os eventos não serão enviados ao Google Analytics.

#### Funcionalidades

Quando configurado, o Google Analytics rastreia:
- ✅ Visualização de páginas (page_view)
- ✅ Visualização de produtos (view_item)
- ✅ Adição ao carrinho (add_to_cart)
- ✅ Remoção do carrinho (remove_from_cart)
- ✅ Início do checkout (begin_checkout)
- ✅ Compra concluída (purchase)
- ✅ Busca (search)
- ✅ Adição à wishlist (add_to_wishlist)
- ✅ Visualização de categoria (view_item_list)

#### Eventos Customizados

O sistema envia eventos no formato padrão do Google Analytics 4 (GA4), incluindo:
- `item_id`: ID do produto
- `item_name`: Nome do produto
- `item_category`: Categoria do produto
- `value`: Valor monetário
- `currency`: Moeda (BRL)
- `quantity`: Quantidade
- `coupon`: Código do cupom (se aplicável)

---

## 📝 Variáveis de Ambiente Completas

### Variáveis Básicas (Obrigatórias)

```env
# Banco de dados
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"

# JWT Secret
JWT_SECRET=sua_chave_secreta_aqui

# Porta do servidor
PORT=5000

# Ambiente
NODE_ENV=development
```

### Variáveis do Módulo 8 (Segurança Avançada)

```env
# reCAPTCHA
RECAPTCHA_ENABLED=false
RECAPTCHA_SECRET_KEY=
RECAPTCHA_SITE_KEY=
RECAPTCHA_MIN_SCORE=0.5

# Admin IP Whitelist (opcional)
ADMIN_IP_WHITELIST=
```

### Variáveis do Módulo 7 (Analytics Avançado)

```env
# Google Analytics 4
# Measurement ID (formato: G-XXXXXXXXXX)
# Obter em: https://analytics.google.com/
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Variáveis do Módulo 1 (Sistema de Pagamentos - Mercado Pago)

```env
# Mercado Pago Configuration
# Obter em: https://www.mercadopago.com.br/developers/panel
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...

# Para frontend (Vite)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

### Variáveis de Serviços Externos (Opcionais)

```env
# Cloudinary (Upload de imagens)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SendGrid (Emails)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br
SENDGRID_FROM_NAME=Primeira Troca

# Socket.io (Notificações em tempo real)
SOCKET_IO_ENABLED=false
WEBSOCKET_PORT=5001
WEBSOCKET_CORS_ORIGIN=http://localhost:5173

# Correios (Frete e Rastreamento) - Módulo 3
USE_CORREIOS_API=false
CORREIOS_API_URL=https://api.correios.com.br
CORREIOS_API_USER=
CORREIOS_API_PASSWORD=
CORREIOS_API_CODE=
CORREIOS_ORIGIN_CEP=01310-100

# Mercado Pago (Pagamentos) - Módulo 1
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

---

## 🔧 Configuração por Ambiente

### Desenvolvimento

```env
NODE_ENV=development
RECAPTCHA_ENABLED=false
ENABLE_JOBS=true
SOCKET_IO_ENABLED=false
```

### Produção

```env
NODE_ENV=production
RECAPTCHA_ENABLED=true
RECAPTCHA_SECRET_KEY=sua_chave_secreta_real
RECAPTCHA_SITE_KEY=sua_chave_publica_real
ENABLE_JOBS=true  # Habilitado automaticamente
SOCKET_IO_ENABLED=true
```

---

## ✅ Verificar Configuração

### Verificar se .env está configurado

```bash
# Verificar se arquivo existe
ls -la .env

# Verificar variáveis (sem mostrar valores)
grep -v "^#" .env | grep "=" | cut -d= -f1
```

### Testar conexão com banco

```bash
# Iniciar servidor
npm run dev:server

# Se conectar sem erros, está OK!
```

### Testar reCAPTCHA

1. Configure `RECAPTCHA_ENABLED=true`
2. Tente fazer registro sem token: deve retornar erro
3. Tente fazer registro com token válido: deve funcionar

---

## 🚨 Segurança

### ⚠️ IMPORTANTE

1. **Nunca commite o arquivo .env** no Git
   - O arquivo `.env` já está no `.gitignore`
   - Use `.env.example` como template

2. **JWT Secret**
   - Use uma chave forte e aleatória
   - Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **reCAPTCHA Secret Key**
   - Mantenha a chave secreta segura
   - Não exponha no frontend

4. **Produção**
   - Use variáveis de ambiente do servidor
   - Não use arquivo `.env` em produção
   - Configure diretamente no servidor (Heroku, Vercel, etc.)

---

## 📚 Referências

- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [Prisma Environment Variables](https://www.prisma.io/docs/concepts/more/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)

---

## 🔍 Troubleshooting

### Erro: "RECAPTCHA_SECRET_KEY is required"

**Solução**: Configure `RECAPTCHA_SECRET_KEY` no `.env` ou defina `RECAPTCHA_ENABLED=false`.

### Erro: "Can't connect to MySQL"

**Solução**: Verifique `DATABASE_URL` no `.env` e se o MySQL está rodando.

### Jobs não estão executando

**Solução**: Configure `ENABLE_JOBS=true` em desenvolvimento ou use `NODE_ENV=production`.

### reCAPTCHA sempre falha

**Solução**: 
- Verifique se `RECAPTCHA_SECRET_KEY` está correto
- Verifique se o domínio está configurado no Google reCAPTCHA
- Em desenvolvimento, use `RECAPTCHA_ENABLED=false`

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Documentação Completa

