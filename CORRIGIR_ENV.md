# 🔧 Corrigir Arquivo .env no Servidor

## ❌ Problema Identificado

O arquivo `.env` tem um erro de sintaxe:
```
ASAAS_API_KEY=ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTIxNzliNj1kY2Y5ZDFjYjU5YjY40g
```

**Problemas:**
1. A chave está duplicada (`ASAAS_API_KEY=ASAAS_API_KEY=`)
2. O `$` no início do token está sendo interpretado como variável de ambiente

## ✅ Solução - Execute no Servidor

```bash
cd /root/Primeiratroca

# 1. Fazer backup do .env atual
cp .env .env.backup

# 2. Corrigir o arquivo .env
cat > .env <<'EOF'
# Database
DATABASE_URL=postgresql://primeiratroca:primeiratroca123@postgres:5432/primeiratroca?schema=public

# JWT
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao

# Node
NODE_ENV=production
PORT=5000

# Asaas (IMPORTANTE: Coloque seu token REAL aqui, começando com $aact_)
ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTIxNzliNj1kY2Y5ZDFjYjU5YjY40g
ASAAS_ENVIRONMENT=production

# WebSocket
SOCKET_IO_ENABLED=true
WEBSOCKET_CORS_ORIGIN=https://primeiratrocaecia.com.br

# Webhook Token (opcional, se configurou no Asaas)
# ASAAS_WEBHOOK_TOKEN=seu_token_webhook
EOF

# 3. Verificar se está correto
cat .env

# 4. Se o token estiver correto, recriar backend
docker-compose down backend
docker-compose up -d --build backend

# 5. Aguardar
sleep 15

# 6. Verificar se Asaas está configurado
docker-compose logs backend | grep -i asaas
```

## 🔍 Se o Token Começar com `$`

Se o token do Asaas começar com `$`, você precisa **escapar** ou usar aspas. Duas opções:

### Opção 1: Escapar o `$` (Recomendado)

```bash
# Editar manualmente
nano .env
```

E na linha do `ASAAS_API_KEY`, use **aspas simples** ou escape o `$`:

```env
# Com aspas simples (recomendado)
ASAAS_API_KEY='$aact_YTU5YTE0M2M2N2I4MTIxNzliNj1kY2Y5ZDFjYjU5YjY40g'

# OU escape o $
ASAAS_API_KEY=\$aact_YTU5YTE0M2M2N2I4MTIxNzliNj1kY2Y5ZDFjYjU5YjY40g
```

### Opção 2: Usar comando sed para corrigir

```bash
# Remover linha duplicada e corrigir
sed -i 's/ASAAS_API_KEY=ASAAS_API_KEY=/ASAAS_API_KEY=/' .env
sed -i "s/ASAAS_API_KEY=\$/ASAAS_API_KEY='\$/" .env
sed -i "s/\$/'\$/" .env
```

## ✅ Verificação Final

```bash
# Verificar se está correto
grep ASAAS_API_KEY .env
# Deve mostrar apenas: ASAAS_API_KEY='$aact_...' (com aspas)

# Testar se docker-compose consegue ler
docker-compose config | grep ASAAS_API_KEY

# Se não der erro, recriar backend
docker-compose up -d --build backend
```

