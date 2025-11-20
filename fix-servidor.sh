#!/bin/bash

echo "🔧 Script de Correção do Servidor - Primeira Troca"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando foi bem-sucedido
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

echo "📋 Passo 1: Parando containers..."
docker-compose down
check_success "Containers parados"

echo ""
echo "📋 Passo 2: Verificando rede Docker..."
docker network inspect primeiratroca_primeira-troca-network > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Rede não existe, será criada automaticamente"
fi

echo ""
echo "📋 Passo 3: Verificando se banco está acessível..."
# Iniciar apenas o banco primeiro
docker-compose up -d postgres
check_success "Banco iniciado"

echo ""
echo "⏳ Aguardando banco inicializar completamente (30 segundos)..."
sleep 30

echo ""
echo "📋 Passo 4: Testando conexão com banco..."
docker-compose exec -T postgres psql -U primeiratroca -d primeiratroca -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Banco está acessível${NC}"
else
    echo -e "${YELLOW}⚠️  Banco ainda não está pronto, aguardando mais 20 segundos...${NC}"
    sleep 20
    docker-compose exec -T postgres psql -U primeiratroca -d primeiratroca -c "SELECT 1;" > /dev/null 2>&1
    check_success "Banco está acessível"
fi

echo ""
echo "📋 Passo 5: Verificando e corrigindo credenciais do banco..."
# O banco foi criado com usuário primeiratroca como superusuário
# Vamos apenas garantir que a senha está correta e permissões estão OK
docker-compose exec -T postgres psql -U primeiratroca -d primeiratroca <<EOF
-- Verificar se conseguimos conectar
SELECT 'Conexão OK' as status;

-- Garantir que temos todas as permissões
GRANT ALL PRIVILEGES ON DATABASE primeiratroca TO primeiratroca;

-- Verificar usuário atual
SELECT current_user, current_database();

\q
EOF

# Se o comando acima funcionou, está tudo OK
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Credenciais estão corretas${NC}"
else
    echo -e "${YELLOW}⚠️  Tentando corrigir credenciais...${NC}"
    # Tentar criar usuário postgres se não existir e depois usar
    docker-compose exec -T postgres psql -U primeiratroca -d postgres <<EOF 2>/dev/null
CREATE USER postgres WITH SUPERUSER PASSWORD 'primeiratroca123';
\q
EOF
    # Agora tentar com postgres
    docker-compose exec -T postgres psql -U postgres <<EOF 2>/dev/null
ALTER USER primeiratroca WITH PASSWORD 'primeiratroca123';
GRANT ALL PRIVILEGES ON DATABASE primeiratroca TO primeiratroca;
\q
EOF
    check_success "Credenciais verificadas/corrigidas"
fi

echo ""
echo "📋 Passo 6: Removendo container do backend antigo..."
docker-compose rm -f backend 2>/dev/null
echo "✅ Container removido (se existia)"

echo ""
echo "📋 Passo 7: Recriando backend..."
docker-compose up -d --build --force-recreate backend
check_success "Backend recriado"

echo ""
echo "⏳ Aguardando backend inicializar (15 segundos)..."
sleep 15

echo ""
echo "📋 Passo 8: Verificando status dos containers..."
docker-compose ps

echo ""
echo "📋 Passo 9: Verificando logs do backend (últimas 20 linhas)..."
echo "----------------------------------------"
docker-compose logs --tail=20 backend

echo ""
echo "=================================================="
echo "🎯 Verificação Final:"
echo "=================================================="

# Verificar se backend está rodando
BACKEND_STATUS=$(docker-compose ps backend | grep -c "Up")
if [ $BACKEND_STATUS -eq 1 ]; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${RED}❌ Backend não está rodando${NC}"
    echo "Ver logs com: docker-compose logs backend"
    exit 1
fi

# Verificar se banco está saudável
DB_STATUS=$(docker-compose ps postgres | grep -c "healthy")
if [ $DB_STATUS -eq 1 ]; then
    echo -e "${GREEN}✅ Banco está saudável${NC}"
else
    echo -e "${YELLOW}⚠️  Banco pode não estar totalmente pronto${NC}"
fi

# Testar conexão do backend ao banco
echo ""
echo "📋 Testando se backend consegue conectar ao banco..."
docker-compose exec -T backend sh -c "timeout 5 npx prisma db push --skip-generate" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend consegue conectar ao banco!${NC}"
else
    echo -e "${YELLOW}⚠️  Ainda pode estar inicializando...${NC}"
    echo "Aguarde mais alguns segundos e verifique os logs"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo "=================================================="
echo ""
echo "📊 Para monitorar os logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "📊 Para ver status:"
echo "   docker-compose ps"
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "   Backend:  http://$(hostname -I | awk '{print $1}'):5000"
echo "   Admin:    http://$(hostname -I | awk '{print $1}'):8081"
echo ""

