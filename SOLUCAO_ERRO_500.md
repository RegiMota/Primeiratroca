# 🔧 Solução: Erro 500 (Internal Server Error)

## ❌ Erro
```
GET http://localhost:5000/api/settings/logo 500 (Internal Server Error)
POST http://localhost:5000/api/auth/login 500 (Internal Server Error)
```

## ✅ Soluções

### 1️⃣ Verificar se o Banco de Dados está rodando

O erro 500 geralmente indica que o banco de dados não está conectado.

**Se estiver usando XAMPP:**
1. Abra o **XAMPP Control Panel**
2. Verifique se o **MySQL** está rodando (botão verde)
3. Se não estiver, clique em **Start** ao lado do MySQL

**Se estiver usando MySQL diretamente:**
1. Verifique se o serviço MySQL está rodando
2. Verifique a conexão no arquivo `.env`

### 2️⃣ Verificar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na **raiz do projeto**:

```env
# Banco de Dados
DATABASE_URL="mysql://root:@localhost:3306/primeira_troca?schema=public"

# JWT Secret
JWT_SECRET=seu-secret-key-aqui-mude-em-producao

# reCAPTCHA (opcional - pode deixar desabilitado)
RECAPTCHA_ENABLED=false

# Porta do servidor
PORT=5000
```

### 3️⃣ Verificar se o Banco de Dados existe

Execute no terminal:
```bash
# Verificar se o banco existe
mysql -u root -p
# Depois execute:
SHOW DATABASES;
```

Se o banco `primeira_troca` não existir, crie:
```sql
CREATE DATABASE primeira_troca;
```

### 4️⃣ Executar Migrações do Prisma

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas no banco
npm run db:push

# Popular banco com dados iniciais (opcional)
npm run db:seed
```

### 5️⃣ Verificar Logs do Servidor

No terminal onde o servidor está rodando, veja os logs de erro. Procure por:
- `P1001` - Erro de conexão com banco
- `Can't reach database` - Banco não está acessível
- `Table doesn't exist` - Tabelas não foram criadas

### 6️⃣ Verificar Conexão do Banco

Teste a conexão manualmente:
```bash
# No terminal MySQL
mysql -u root -p
USE primeira_troca;
SHOW TABLES;
```

### 7️⃣ Reiniciar o Servidor

Depois de corrigir os problemas:
1. Pare o servidor (Ctrl+C)
2. Inicie novamente:
   ```bash
   npm run dev:server
   ```

## 🔍 Checklist de Verificação

- [ ] MySQL está rodando (XAMPP ou serviço MySQL)
- [ ] Arquivo `.env` existe e tem `DATABASE_URL` configurada
- [ ] Banco de dados `primeira_troca` existe
- [ ] Tabelas foram criadas (`npm run db:push`)
- [ ] Servidor backend está rodando sem erros
- [ ] Logs do servidor não mostram erros de conexão

## 🆘 Se ainda não funcionar

1. Verifique os logs completos do servidor no terminal
2. Verifique se há erros de sintaxe no código
3. Tente acessar diretamente: `http://localhost:5000/api/health`
4. Verifique se o Prisma Client está gerado: `npm run db:generate`

## 📝 Logs Importantes

Se o servidor mostrar erros como:
- `P1001: Can't reach database server`
- `Table 'primeira_troca.users' doesn't exist`
- `Connection refused`

Isso indica problemas de conexão ou banco não configurado corretamente.
