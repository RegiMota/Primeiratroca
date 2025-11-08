# 🗄️ Configuração do MySQL (XAMPP) - Primeira Troca

## 📋 Pré-requisitos

1. **XAMPP instalado** com MySQL funcionando
2. **MySQL iniciado** no painel do XAMPP

## 🛠️ Passo a Passo

### 1. Criar o Banco de Dados

1. Abra o **phpMyAdmin** (http://localhost/phpmyadmin)
2. Crie um novo banco de dados chamado `primeiratroca`
3. Ou execute no terminal MySQL:

```sql
CREATE DATABASE primeiratroca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar o arquivo .env

Crie ou atualize o arquivo `.env` na raiz do projeto:

```env
# Database - MySQL (XAMPP)
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"

# JWT Secret (change in production!)
JWT_SECRET="primeira-troca-secret-key-change-in-production"

# Server Port
PORT=5000

# API URL (for frontend)
VITE_API_URL=http://localhost:5000/api
```

**Nota:** 
- Se você tiver senha no MySQL, altere para: `mysql://root:SUA_SENHA@localhost:3306/primeiratroca`
- A porta padrão do MySQL é 3306

### 3. Instalar Dependências (se ainda não instalou)

```bash
npm install
```

### 4. Gerar Prisma Client

```bash
npm run db:generate
```

### 5. Criar as Tabelas no Banco

Execute o comando para criar as tabelas:

```bash
npm run db:push
```

Ou use migrations do Prisma:

```bash
npx prisma migrate dev --name init
```

### 6. Popular com Dados Iniciais (Opcional)

```bash
npm run db:seed
```

## ✅ Verificar Configuração

Após configurar, você pode verificar se está tudo certo:

1. **Verificar conexão:**
   - Inicie o servidor backend: `npm run dev:server`
   - Se conectar sem erros, está tudo OK!

2. **Verificar tabelas no phpMyAdmin:**
   - Acesse http://localhost/phpmyadmin
   - Selecione o banco `primeiratroca`
   - Você deve ver as tabelas: `users`, `categories`, `products`, `orders`, `order_items`

## 🔧 Resolução de Problemas

### Erro: "Can't connect to MySQL server"

- Verifique se o MySQL está rodando no XAMPP
- Verifique a porta (padrão é 3306)
- Verifique se o usuário e senha estão corretos

### Erro: "Access denied for user 'root'"

- Se você configurou senha no MySQL, adicione no DATABASE_URL
- Ou altere a senha para vazia no MySQL

### Erro: "Unknown database 'primeiratroca'"

- Crie o banco de dados primeiro (veja passo 1)
- Ou altere o nome do banco no `.env`

### Erro ao rodar db:push

- Certifique-se que o banco existe
- Verifique se o DATABASE_URL está correto
- Tente usar migrations: `npx prisma migrate dev`

## 📝 Credenciais Padrão XAMPP

- **Host:** localhost
- **Porta:** 3306
- **Usuário:** root
- **Senha:** (vazia - padrão XAMPP)

## 🚀 Próximos Passos

Após configurar o MySQL:

1. ✅ Banco de dados criado
2. ✅ Tabelas criadas
3. ✅ Dados iniciais populados (se rodou o seed)
4. ✅ Servidor backend rodando

Agora você pode:
- Iniciar o frontend: `npm run dev`
- Acessar a loja: http://localhost:3000
- Fazer login como admin: `admin@primeiratroca.com.br` / `admin`

---

**Nota:** Lembre-se de manter o MySQL rodando no XAMPP enquanto estiver desenvolvendo!

