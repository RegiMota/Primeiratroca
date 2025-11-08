# 📧 Guia: Como Configurar SendGrid

## 🎯 Passo a Passo Completo

### Passo 1: Criar Conta no SendGrid

1. Acesse: https://sendgrid.com/
2. Clique em **"Start for free"** ou **"Sign Up"**
3. Preencha:
   - Nome completo
   - Email
   - Senha
   - Empresa (opcional)
4. Complete a verificação de email (verifique sua caixa de entrada)

### Passo 2: Criar API Key

1. Após fazer login, acesse:
   - **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Preencha:
   - **Nome**: `Primeira Troca API`
   - **Permissões**: 
     - Escolha **"Full Access"** (para começar)
     - Ou **"Restricted Access"** → selecione apenas "Mail Send"
4. Clique em **"Create & View"**
5. ⚠️ **IMPORTANTE**: Copie a API Key **AGORA** (ela só aparece uma vez!)
   - Exemplo: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Passo 3: Verificar Remetente (Sender)

1. Acesse: **Settings** → **Sender Authentication**
2. Clique em **"Verify a Single Sender"**
3. Preencha:
   - **From Email Address**: `noreply@primeiratroca.com.br` (ou seu email)
   - **From Name**: `Primeira Troca`
   - **Reply To**: (pode ser o mesmo ou outro)
   - **Company Address**: Endereço da empresa
   - **Website URL**: URL do seu site
4. Clique em **"Create"**
5. **Verifique o email** enviado para o endereço que você informou
6. Após verificar, o status ficará **"Verified"**

### Passo 4: Configurar no .env

Adicione as seguintes linhas no seu arquivo `.env`:

```env
# SendGrid Configuration (v1.2)
SENDGRID_API_KEY=SG.sua_chave_aqui_copie_do_sendgrid
SENDGRID_FROM_EMAIL=noreply@primeiratroca.com.br
SENDGRID_FROM_NAME=Primeira Troca
```

**Substitua:**
- `SG.sua_chave_aqui_copie_do_sendgrid` pela API Key que você copiou no Passo 2
- `noreply@primeiratroca.com.br` pelo email verificado no Passo 3

### Passo 5: Testar

1. Reinicie o servidor backend:
   ```bash
   npm run dev:server
   ```

2. Você verá no console:
   ```
   ✅ SendGrid: Configurado
   ```

3. Teste fazendo:
   - Criar uma nova conta (receberá email de boas-vindas)
   - Fazer um pedido (receberá email de confirmação)
   - Solicitar recuperação de senha (receberá email com link)

---

## ⚠️ Limitações do Plano Gratuito

- **100 emails/dia** (mais que suficiente para começar)
- Apenas um remetente verificado
- Sem suporte prioritário

---

## 🆘 Troubleshooting

### Email não chega?

1. Verifique se o remetente está **Verified** no SendGrid
2. Verifique se a API Key está correta
3. Verifique a caixa de **spam**
4. No console do servidor, procure por erros do SendGrid

### API Key não funciona?

1. Certifique-se de que copiou a **chave completa** (começa com `SG.`)
2. Não há espaços no início ou fim da chave
3. Verifique se a API Key não foi revogada no SendGrid

### Remetente não verificado? ❌ Erro 403 (Forbidden)

**Erro no console:**
```
❌ Erro ao enviar email: ResponseError: Forbidden
errors: [{
  message: 'The from address does not match a verified Sender Identity'
}]
```

**Solução:**

1. **Acesse o SendGrid Dashboard:**
   - 🌐 https://app.sendgrid.com/settings/sender_auth/senders

2. **Clique em "Verify a Single Sender" ou "Create New Sender"**

3. **Preencha os dados solicitados:**
   - **From Email**: `noreply@primeiratroca.com.br` (ou seu email)
   - **From Name**: `Primeira Troca`
   - **Reply To**: (seu email pessoal ou outro)
   - **Company Address**: Endereço completo
   - **City**: Sua cidade
   - **State**: Seu estado
   - **Country**: Brasil
   - **Zip**: Seu CEP

4. **Clique em "Create"**
   - SendGrid enviará um email de verificação

5. **Verifique seu email:**
   - Procure email do SendGrid na sua caixa de entrada
   - Clique no link de verificação no email
   - Ou copie o código de verificação

6. **Aguarde alguns minutos**
   - SendGrid processa a verificação
   - Verifique se o status ficou "Verified" (Verificado)

7. **Reinicie o servidor backend:**
   ```bash
   # Parar o servidor (Ctrl+C)
   npm run dev:server
   ```

**⚠️ DICA IMPORTANTE:**

Se você **não tem acesso ao domínio** `primeiratroca.com.br`, pode usar seu **email pessoal** temporariamente:

1. Use um email que você controla (ex: `seuemail@gmail.com`)
2. Atualize no `.env`:
   ```env
   SENDGRID_FROM_EMAIL=seuemail@gmail.com
   ```
3. Verifique esse email no SendGrid
4. Após verificar, os emails funcionarão!

---

## ✅ Pronto!

Após configurar, seu sistema enviará emails reais para os clientes!

---

## 🎉 Status Atual

**✅ SendGrid Configurado e Funcionando!**

- **API Key**: Configurada (primeiratrocaapi2)
- **Remetente**: reginaldomota02@hotmail.com (Verificado ✅)
- **Status**: Emails sendo enviados com sucesso
- **Funcionalidades Ativas**:
  - ✅ Email de Boas-vindas (Registro)
  - ✅ Email de Confirmação de Pedido
  - ✅ Email de Atualização de Status
  - ✅ Email de Recuperação de Senha

**Data de Configuração**: Janeiro 2025  
**Última Atualização**: Janeiro 2025

