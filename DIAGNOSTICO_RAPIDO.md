# 🔍 Diagnóstico Rápido - Erro 500

## ⚠️ Erro 500 (Internal Server Error)

Quando você vê erros 500, significa que o servidor está rodando, mas há um problema interno (geralmente banco de dados).

## 🔧 Passos Rápidos para Resolver

### 1️⃣ Verificar se MySQL está rodando

**XAMPP:**
1. Abra XAMPP Control Panel
2. Verifique se MySQL está **verde** (rodando)
3. Se não estiver, clique em **Start**

**MySQL como serviço:**
```powershell
# Verificar se o serviço está rodando
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

### 2️⃣ Verificar se o banco de dados existe

Execute no terminal MySQL:
```sql
SHOW DATABASES;
```

Se não existir `primeira_troca`, crie:
```sql
CREATE DATABASE primeira_troca;
```

### 3️⃣ Verificar variável DATABASE_URL

Crie/edite `.env` na raiz do projeto:
```env
DATABASE_URL="mysql://root:@localhost:3306/primeira_troca?schema=public"
```

**Ajuste conforme seu MySQL:**
- Se tiver senha: `mysql://root:SUA_SENHA@localhost:3306/primeira_troca?schema=public`
- Se usar porta diferente: mude `3306` para sua porta
- Se usar outro usuário: mude `root` para seu usuário

### 4️⃣ Executar Prisma

```bash
# 1. Gerar Prisma Client
npm run db:generate

# 2. Criar tabelas no banco
npm run db:push

# 3. (Opcional) Popular com dados iniciais
npm run db:seed
```

### 5️⃣ Testar conexão

Após reiniciar o servidor, teste:
- **Health Check**: `http://localhost:5000/api/health`
  - Deve mostrar: `{"status":"ok","message":"Primeira Troca API is running","database":"connected"}`
  
- **Teste de Banco**: `http://localhost:5000/api/test/db`
  - Deve mostrar: `{"status":"success","message":"Database connection successful"}`

### 6️⃣ Verificar logs do servidor

No terminal onde o servidor está rodando, procure por:
- `✅ Server running on http://localhost:5000`
- Erros como `P1001` ou `Can't reach database`

## 🚨 Erros Comuns

### Erro: `P1001: Can't reach database server`
**Solução:** MySQL não está rodando ou DATABASE_URL está incorreta

### Erro: `Table 'primeira_troca.users' doesn't exist`
**Solução:** Execute `npm run db:push` para criar as tabelas

### Erro: `Unknown database 'primeira_troca'`
**Solução:** Crie o banco: `CREATE DATABASE primeira_troca;`

## 📝 Checklist

- [ ] MySQL está rodando (XAMPP ou serviço)
- [ ] Banco `primeira_troca` existe
- [ ] `.env` tem `DATABASE_URL` configurada corretamente
- [ ] `npm run db:generate` executado com sucesso
- [ ] `npm run db:push` executado com sucesso
- [ ] Servidor backend reiniciado após mudanças
- [ ] `http://localhost:5000/api/health` retorna sucesso
- [ ] `http://localhost:5000/api/test/db` retorna sucesso

## 🆘 Se ainda não funcionar

1. **Verifique os logs do servidor** no terminal - eles mostram o erro específico
2. **Teste a conexão manualmente:**
   ```bash
   mysql -u root -p
   USE primeira_troca;
   SHOW TABLES;
   ```
3. **Verifique se o Prisma Client está gerado:**
   ```bash
   ls node_modules/.prisma/client
   ```

## 🔗 URLs de Teste

- Health Check: `http://localhost:5000/api/health`
- Teste de Banco: `http://localhost:5000/api/test/db`
- Logo: `http://localhost:5000/api/settings/logo`
- Login: `POST http://localhost:5000/api/auth/login`
