# 🔧 Solução Definitiva - Problema Backend não Conecta ao Banco

## 🎯 Problema
Backend não consegue conectar ao banco mesmo que o banco esteja funcionando.

## ✅ Solução Definitiva - Execute no Servidor

### Opção 1: Comandos Manuais (Recomendado)

```bash
cd /root/Primeiratroca

# 1. Parar tudo
docker-compose down

# 2. Verificar e limpar containers órfãos
docker ps -a | grep primeira-troca
docker rm -f primeira-troca-backend 2>/dev/null

# 3. Iniciar apenas o banco
docker-compose up -d postgres

# 4. Aguardar banco estar 100% pronto
echo "Aguardando banco inicializar..."
sleep 40

# 5. Testar conexão
docker-compose exec postgres psql -U primeiratroca -d primeiratroca -c "SELECT version();"

# 6. Recriar backend com delay maior
docker-compose up -d --build --force-recreate backend

# 7. Aguardar backend inicializar
sleep 30

# 8. Ver status
docker-compose ps

# 9. Ver logs
docker-compose logs --tail=100 backend
```

### Opção 2: Editar docker-compose.yml e Adicionar Delay

```bash
cd /root/Primeiratroca

# 1. Fazer backup
cp docker-compose.yml docker-compose.yml.backup

# 2. Editar o arquivo
nano docker-compose.yml
```

**Altere a linha do `command` do backend de:**
```yaml
command: sh -c "npx prisma generate && npx prisma db push && npm run dev:server"
```

**Para:**
```yaml
command: sh -c "sleep 15 && npx prisma generate && sleep 5 && npx prisma db push --accept-data-loss && npm run dev:server"
```

**Salve (Ctrl+O, Enter, Ctrl+X)**

```bash
# 3. Recriar backend
docker-compose stop backend
docker-compose rm -f backend
docker-compose up -d --build backend

# 4. Aguardar
sleep 30

# 5. Ver logs
docker-compose logs -f backend
```

### Opção 3: Verificar e Corrigir Rede Docker

```bash
# 1. Verificar rede
docker network ls | grep primeira-troca

# 2. Ver containers na rede
docker network inspect primeiratroca_primeira-troca-network

# 3. Se backend não estiver na rede, recriar tudo
docker-compose down
docker-compose up -d

# 4. Verificar novamente
docker network inspect primeiratroca_primeira-troca-network | grep primeira-troca-backend
```

## 🔍 Diagnóstico Detalhado

Se ainda não funcionar, execute para diagnosticar:

```bash
# 1. Verificar se backend consegue resolver hostname postgres
docker-compose run --rm backend ping -c 2 postgres

# 2. Verificar variável DATABASE_URL dentro do container
docker-compose run --rm backend env | grep DATABASE_URL

# 3. Testar conexão manualmente do backend ao banco
docker-compose run --rm backend sh -c "npx prisma db push --skip-generate"

# 4. Ver logs detalhados do banco
docker-compose logs postgres | tail -50
```

## 🚨 Solução de Último Recurso

Se NADA funcionar, recrie tudo do zero:

```bash
cd /root/Primeiratroca

# ⚠️ ATENÇÃO: Isso apaga todos os dados do banco!
docker-compose down -v

# Remover containers órfãos
docker-compose down --remove-orphans

# Limpar tudo
docker system prune -f

# Recriar do zero
docker-compose up -d --build

# Aguardar tudo inicializar
sleep 60

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
```

## ✅ Verificação Final

Após aplicar qualquer solução, verifique:

```bash
# 1. Status
docker-compose ps
# Backend deve estar "Up", não "Exited"

# 2. Logs sem erros de autenticação
docker-compose logs backend | grep -i "error\|authentication\|P1000"
# Não deve aparecer erros

# 3. Backend respondendo
curl http://localhost:5000/api/health
# Ou
curl http://localhost:5000/

# 4. Testar conexão Prisma
docker-compose exec backend npx prisma db push --skip-generate
# Deve funcionar sem erros
```

## 📝 Notas Importantes

- O delay de 15 segundos garante que o banco está totalmente pronto
- `--accept-data-loss` no db push evita erros de schema
- Se o banco tem dados importantes, NÃO use a solução de último recurso
- Sempre verifique os logs após cada tentativa

