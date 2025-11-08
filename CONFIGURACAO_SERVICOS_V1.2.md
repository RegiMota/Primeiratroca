# ⚙️ Configuração de Serviços Externos - Versão 1.2
## Primeira Troca - Guia de Setup

**Data**: Janeiro 2025  
**Versão**: 1.2.0  
**Status**: 📋 Configuração

---

## 📋 Índice

1. [Cloud Storage (Upload de Imagens)](#-cloud-storage-upload-de-imagens)
2. [Email Service (Sistema de Emails)](#-email-service-sistema-de-emails)
3. [WebSocket (Notificações em Tempo Real)](#-websocket-notificações-em-tempo-real)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 📸 Cloud Storage (Upload de Imagens)

### Opção 1: Cloudinary (Recomendado para Início)

**Por quê Cloudinary?**
- ✅ Setup mais simples
- ✅ Free tier generoso (25GB storage, 25GB bandwidth/mês)
- ✅ Redimensionamento automático
- ✅ Otimização automática
- ✅ CDN incluído

**Setup:**

1. **Criar conta:**
   - Acesse: https://cloudinary.com/
   - Crie uma conta gratuita
   - Após login, você verá suas credenciais no Dashboard

2. **Obter credenciais:**
   - Cloud Name: `dxxxxxxx` (aparece no Dashboard)
   - API Key: `123456789012345`
   - API Secret: `abc123def456...`

3. **Instalar dependência:**
   ```bash
   npm install cloudinary
   ```

4. **Configurar .env:**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. **Código de exemplo** (será criado em `server/services/ImageService.ts`):
   ```typescript
   import { v2 as cloudinary } from 'cloudinary';

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
   });
   ```

---

### Opção 2: AWS S3 (Recomendado para Produção)

**Por quê AWS S3?**
- ✅ Escalável
- ✅ Mais barato em volume
- ✅ Integração com outros serviços AWS
- ✅ Controle total

**Setup:**

1. **Criar conta AWS:**
   - Acesse: https://aws.amazon.com/
   - Crie uma conta (exige cartão de crédito, mas free tier disponível)

2. **Criar S3 Bucket:**
   - Acesse AWS Console → S3
   - Clique em "Create bucket"
   - Nome: `primeiratroca-images` (ou similar)
   - Região: `us-east-1` (ou próxima de você)
   - Desabilitar "Block all public access" (para permitir acesso público às imagens)
   - Criar bucket

3. **Criar IAM User:**
   - Acesse AWS Console → IAM
   - Criar usuário: `primeiratroca-s3-user`
   - Anexar política: `AmazonS3FullAccess` (ou criar política customizada mais restrita)
   - Salvar Access Key ID e Secret Access Key

4. **Instalar dependências:**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

5. **Configurar .env:**
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=primeiratroca-images
   ```

---

### Opção 3: Armazenamento Local (Desenvolvimento/Teste)

**Para testes locais**, podemos usar armazenamento local temporariamente:

```env
# Usar armazenamento local
IMAGE_STORAGE_TYPE=local
IMAGE_STORAGE_PATH=./uploads/images
```

⚠️ **Nota**: Não recomendado para produção, mas útil para desenvolvimento sem configuração externa.

---

## 📧 Email Service (Sistema de Emails)

### Opção 1: SendGrid (Recomendado)

**Por quê SendGrid?**
- ✅ API simples e fácil de usar
- ✅ Free tier: 100 emails/dia
- ✅ Templates HTML fáceis
- ✅ Analytics incluído

**Setup:**

1. **Criar conta:**
   - Acesse: https://sendgrid.com/
   - Crie uma conta gratuita
   - Complete a verificação de email

2. **Criar API Key:**
   - Acesse: Settings → API Keys
   - Clique em "Create API Key"
   - Nome: `Primeira Troca API`
   - Permissões: "Full Access" (ou "Restricted Access" apenas para envio)
   - Copie a API Key (aparece apenas uma vez!)

3. **Verificar remetente:**
   - Acesse: Settings → Sender Authentication
   - Clique em "Verify a Single Sender"
   - Preencha informações
   - Use o email verificado como remetente

4. **Instalar dependência:**
   ```bash
   npm install @sendgrid/mail
   ```

5. **Configurar .env:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br
   SENDGRID_FROM_NAME=Primeira Troca
   ```

---

### Opção 2: Nodemailer com SMTP (Gmail/Outlook)

**Por quê Nodemailer?**
- ✅ Gratuito (usando Gmail/Outlook)
- ✅ Flexível
- ✅ Não precisa de serviço externo

**Setup com Gmail:**

1. **Habilitar App Password:**
   - Acesse: https://myaccount.google.com/
   - Security → 2-Step Verification (ativar se não tiver)
   - Security → App passwords
   - Gerar nova senha para "Mail"

2. **Instalar dependência:**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

3. **Configurar .env:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false  # true para porta 465
   SMTP_USER=seuemail@gmail.com
   SMTP_PASS=sua_app_password_aqui
   SMTP_FROM=noreply@primeiratroca.com.br
   ```

⚠️ **Limite**: Gmail permite ~500 emails/dia. Para mais, use SendGrid ou AWS SES.

---

### Opção 3: AWS SES (Produção)

**Por quê AWS SES?**
- ✅ Muito barato ($0.10 por 1000 emails)
- ✅ Altamente escalável
- ✅ Integração com outros serviços AWS

**Setup:**

1. **Criar conta AWS** (se ainda não tiver)
2. **Acessar SES:**
   - AWS Console → SES (Simple Email Service)
   - Verificar domínio ou email remetente
3. **Sair do Sandbox:**
   - Por padrão, SES está em "Sandbox" (só envia para emails verificados)
   - Enviar solicitação para sair do Sandbox (leva ~24h)
4. **Instalar dependência:**
   ```bash
   npm install @aws-sdk/client-ses
   ```
5. **Configurar .env:**
   ```env
   AWS_SES_REGION=us-east-1
   AWS_SES_FROM_EMAIL=noreply@primeiratroca.com.br
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   ```

---

## 🔔 WebSocket (Notificações em Tempo Real)

### Opção 1: Socket.io (Recomendado)

**Por quê Socket.io?**
- ✅ Mais fácil de usar
- ✅ Reconexão automática
- ✅ Suporta rooms/channels
- ✅ Compatibilidade com vários navegadores

**Setup:**

1. **Instalar dependências:**
   ```bash
   # Backend
   npm install socket.io
   
   # Frontend
   npm install socket.io-client
   ```

2. **Configurar servidor** (em `server/index.ts`):
   ```typescript
   import { Server } from 'socket.io';
   import { createServer } from 'http';
   
   const httpServer = createServer(app);
   const io = new Server(httpServer, {
     cors: {
       origin: process.env.FRONTEND_URL || "http://localhost:3000",
       methods: ["GET", "POST"]
     }
   });
   
   httpServer.listen(PORT, () => {
     console.log(`🚀 Server running on http://localhost:${PORT}`);
   });
   ```

3. **Configurar .env:**
   ```env
   # WebSocket (opcional, usa mesma porta do Express por padrão)
   WEBSOCKET_PORT=5001  # Opcional, se quiser porta separada
   WEBSOCKET_CORS_ORIGIN=http://localhost:3000
   ```

---

### Opção 2: ws (Nativo - Mais Leve)

**Por quê ws?**
- ✅ Mais leve
- ✅ Nativo do Node.js
- ✅ Menor overhead

**Setup:**

1. **Instalar dependência:**
   ```bash
   npm install ws
   npm install --save-dev @types/ws
   ```

2. **Configurar servidor**:
   ```typescript
   import { WebSocketServer } from 'ws';
   
   const wss = new WebSocketServer({ 
     port: parseInt(process.env.WEBSOCKET_PORT || '5001'),
     cors: {
       origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000"
     }
   });
   ```

⚠️ **Nota**: Socket.io é mais fácil de usar e recomenda-se para início.

---

## 🔐 Variáveis de Ambiente

### Arquivo .env Atualizado

```env
# ============================================
# Configurações Existentes (Versão 1.0)
# ============================================
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"
JWT_SECRET="sua_chave_secreta_aqui_mude_em_producao"
PORT=5000

# ============================================
# Novas Configurações (Versão 1.2)
# ============================================

# Cloud Storage (escolher uma opção)
# --- Opção 1: Cloudinary ---
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# --- Opção 2: AWS S3 ---
# AWS_ACCESS_KEY_ID=your_access_key_id
# AWS_SECRET_ACCESS_KEY=your_secret_access_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET_NAME=primeiratroca-images

# --- Opção 3: Local (desenvolvimento) ---
# IMAGE_STORAGE_TYPE=local
# IMAGE_STORAGE_PATH=./uploads/images

# Email Service (escolher uma opção)
# --- Opção 1: SendGrid ---
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br
SENDGRID_FROM_NAME=Primeira Troca

# --- Opção 2: Nodemailer SMTP ---
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=seuemail@gmail.com
# SMTP_PASS=sua_app_password
# SMTP_FROM=noreply@primeiratroca.com.br

# --- Opção 3: AWS SES ---
# AWS_SES_REGION=us-east-1
# AWS_SES_FROM_EMAIL=noreply@primeiratroca.com.br

# WebSocket (opcional)
WEBSOCKET_PORT=5001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Frontend URL (para emails e notificações)
FRONTEND_URL=http://localhost:3000

# Email Templates (opcional)
EMAIL_TEMPLATES_PATH=./server/templates/emails

# Feature Flags (para ativar/desativar módulos)
FEATURE_MULTIPLE_IMAGES=true
FEATURE_COUPONS=true
FEATURE_NOTIFICATIONS=true
FEATURE_EMAILS=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_ADVANCED_SEARCH=true
```

---

## ✅ Checklist de Configuração

### Cloud Storage
- [ ] Escolher provedor (Cloudinary / AWS S3 / Local)
- [ ] Criar conta e obter credenciais
- [ ] Instalar dependências necessárias
- [ ] Configurar variáveis de ambiente
- [ ] Testar upload de imagem

### Email Service
- [ ] Escolher provedor (SendGrid / Nodemailer / AWS SES)
- [ ] Criar conta e obter credenciais
- [ ] Verificar remetente
- [ ] Instalar dependências necessárias
- [ ] Configurar variáveis de ambiente
- [ ] Testar envio de email

### WebSocket
- [ ] Escolher biblioteca (Socket.io / ws)
- [ ] Instalar dependências
- [ ] Configurar servidor WebSocket
- [ ] Configurar cliente WebSocket
- [ ] Testar conexão

### Variáveis de Ambiente
- [ ] Criar/atualizar arquivo .env
- [ ] Preencher todas as variáveis necessárias
- [ ] Verificar que .env está no .gitignore
- [ ] Criar .env.example com valores de exemplo
- [ ] Documentar variáveis no README

---

## 🧪 Testes de Configuração

### Teste de Cloud Storage

```bash
# Criar script de teste
node scripts/test-image-upload.js
```

### Teste de Email

```bash
# Criar script de teste
node scripts/test-email.js
```

### Teste de WebSocket

```bash
# Testar conexão WebSocket
# Backend deve mostrar conexão
# Frontend deve receber mensagens
```

---

## 📝 Próximos Passos

Após configurar os serviços:

1. ✅ Testar cada serviço individualmente
2. ✅ Criar serviços reutilizáveis (`ImageService.ts`, `EmailService.ts`, `NotificationService.ts`)
3. ✅ Integrar no sistema existente
4. ✅ Testar integração completa
5. ✅ Documentar uso dos serviços

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 📋 Configuração

---

*Siga este guia para configurar os serviços externos necessários para a versão 1.2.*

