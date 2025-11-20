# 🔧 Guia de Correção - Problema de Banco de Dados no Servidor

## 🎯 Problema Identificado

Após `git pull` e `docker-compose up -d --build`, o backend não consegue conectar ao banco de dados:
- Erro: `P1000: Authentication failed against database server`
- Backend está parando (Exited)
- Banco está rodando e saudável, mas credenciais não batem

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar Status Atual

```bash
# Ver status de todos os containers
docker-compose ps -a

# Ver logs do backend
docker-compose logs --tail=50 backend

# Ver logs do banco
docker-compose logs --tail=50 postgres
```

### 2. Verificar Credenciais do Banco

```bash
# Tentar conectar ao banco com as credenciais configuradas
docker-compose exec postgres psql -U primeiratroca -d primeiratroca -c "SELECT 1;"
```

**Se der erro de autenticação**, continue com as soluções abaixo.

## ✅ Solução 1: Recriar Volume do Banco (PERDE DADOS)

⚠️ **ATENÇÃO**: Esta solução apaga todos os dados do banco!

Use apenas se:
- Não houver dados importantes
- Ou tiver backup dos dados

```bash
# 1. Parar todos os containers
docker-compose down

# 2. Remover volume do banco
docker volume rm primeiratroca_postgres_data

# 3. Verificar se foi removido
docker volume ls | grep postgres

# 4. Recriar tudo
docker-compose up -d

# 5. Aguardar o banco inicializar (30-60 segundos)
sleep 30

# 6. Verificar logs do backend
docker-compose logs -f backend
```

## ✅ Solução 2: Corrigir Credenciais do Banco Existente (MANTÉM DADOS)

Use esta solução se quiser manter os dados existentes:

```bash
# 1. Entrar no container do banco como superusuário
docker-compose exec postgres psql -U postgres

# 2. Dentro do PostgreSQL, executar:
```

```sql
-- Verificar usuários existentes
\du

-- Verificar se o usuário existe
SELECT usename FROM pg_user WHERE usename = 'primeiratroca';

-- Se não existir, criar
CREATE USER primeiratroca WITH PASSWORD 'primeiratroca123';
ALTER USER primeiratroca CREATEDB;

-- Se existir, alterar senha
ALTER USER primeiratroca WITH PASSWORD 'primeiratroca123';

-- Verificar se o banco existe
\l

-- Se não existir, criar
CREATE DATABASE primeiratroca OWNER primeiratroca;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE primeiratroca TO primeiratroca;

-- Sair
\q
```

```bash
# 3. Reiniciar o backend
docker-compose restart backend

# 4. Verificar logs
docker-compose logs -f backend
```

## ✅ Solução 3: Verificar e Corrigir DATABASE_URL

Pode ser que o `DATABASE_URL` no docker-compose não esteja correto:

```bash
# 1. Verificar variável DATABASE_URL no container
docker-compose exec backend env | grep DATABASE_URL

# 2. Verificar docker-compose.yml
cat docker-compose.yml | grep -A 5 DATABASE_URL

# 3. Verificar se está correto:
# DATABASE_URL=postgresql://primeiratroca:primeiratroca123@postgres:5432/primeiratroca?schema=public
```

Se estiver diferente, edite o `docker-compose.yml`:

```yaml
environment:
  DATABASE_URL: postgresql://primeiratroca:primeiratroca123@postgres:5432/primeiratroca?schema=public
```

Depois:

```bash
# Recriar backend
docker-compose up -d --force-recreate backend
```

## ✅ Solução 4: Verificar Rede Docker

Os containers podem não estar na mesma rede:

```bash
# 1. Verificar rede
docker network inspect primeiratroca_primeira-troca-network

# 2. Verificar se ambos containers estão na mesma rede
docker inspect primeira-troca-backend | grep -A 10 Networks
docker inspect primeira-troca-db | grep -A 10 Networks

# 3. Se não estiverem, recriar tudo
docker-compose down
docker-compose up -d
```

## 🔄 Sequência Completa de Recuperação (Recomendada)

Execute estes comandos na ordem:

```bash
# 1. Parar tudo
docker-compose down

# 2. Verificar volumes
docker volume ls

# 3. Se quiser manter dados, pule o próximo comando
# Se não tiver dados importantes, remova o volume:
# docker volume rm primeiratroca_postgres_data

# 4. Recriar containers
docker-compose up -d

# 5. Aguardar banco inicializar
echo "Aguardando banco inicializar..."
sleep 30

# 6. Verificar se banco está saudável
docker-compose ps postgres

# 7. Testar conexão
docker-compose exec postgres psql -U primeiratroca -d primeiratroca -c "SELECT version();"

# 8. Se conexão funcionar, verificar backend
docker-compose logs --tail=100 backend

# 9. Se backend ainda não conectar, verificar DATABASE_URL
docker-compose exec backend env | grep DATABASE

# 10. Reiniciar backend
docker-compose restart backend

# 11. Monitorar logs
docker-compose logs -f backend
```

## 🎯 Verificação Final

Após aplicar uma das soluções, verifique:

```bash
# 1. Status de todos os containers
docker-compose ps

# Todos devem estar "Up" e saudáveis

# 2. Backend deve estar rodando
curl http://localhost:5000/api/health
# Ou
curl http://localhost:5000/

# 3. Verificar logs do backend (não deve ter erros de banco)
docker-compose logs backend | grep -i error

# 4. Testar conexão do backend ao banco
docker-compose exec backend npx prisma db push
```

## 🚨 Se Nada Funcionar

Como último recurso:

```bash
# 1. Parar tudo
docker-compose down -v  # Remove volumes também

# 2. Limpar containers órfãos
docker-compose down --remove-orphans

# 3. Verificar se há containers antigos
docker ps -a | grep primeira-troca

# 4. Remover containers antigos se necessário
docker rm -f primeira-troca-backend primeira-troca-db primeira-troca-frontend

# 5. Recriar tudo do zero
docker-compose up -d --build

# 6. Aguardar e verificar
sleep 30
docker-compose ps
docker-compose logs backend
```

## 📝 Notas Importantes

- **Backup**: Se tiver dados importantes, faça backup antes:
  ```bash
  docker-compose exec postgres pg_dump -U primeiratroca primeiratroca > backup.sql
  ```

- **Credenciais**: As credenciais padrão são:
  - Usuário: `primeiratroca`
  - Senha: `primeiratroca123`
  - Banco: `primeiratroca`
  - Host: `postgres` (nome do serviço no docker-compose)

- **Rede**: Todos os containers devem estar na mesma rede Docker (`primeira-troca-network`)

## ✅ Checklist de Sucesso

Após resolver, confirme:

- [ ] Container do banco está "Up" e "healthy"
- [ ] Container do backend está "Up" (não "Exited")
- [ ] Logs do backend não mostram erros de autenticação
- [ ] Backend responde em `http://localhost:5000`
- [ ] Admin está acessível em `http://IP:8081`
- [ ] Frontend está acessível em `http://IP:3000`

