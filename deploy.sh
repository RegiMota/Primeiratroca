#!/bin/bash

# Script de Deploy para VPS
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.prod.yml não encontrado!${NC}"
    echo "Execute este script na pasta do projeto."
    exit 1
fi

# Verificar se .env.prod existe
if [ ! -f ".env.prod" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.prod não encontrado!${NC}"
    echo "Criando .env.prod a partir do .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.prod
        echo -e "${YELLOW}⚠️  Edite o arquivo .env.prod com suas configurações antes de continuar!${NC}"
        exit 1
    else
        echo -e "${RED}❌ Arquivo .env.example também não encontrado!${NC}"
        exit 1
    fi
fi

# Carregar variáveis de ambiente
echo -e "${YELLOW}📝 Carregando variáveis de ambiente...${NC}"
export $(cat .env.prod | grep -v '^#' | xargs)

# Atualizar código (se for um repositório git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Atualizando código do Git...${NC}"
    git pull origin main || echo "Aviso: Não foi possível atualizar do Git"
fi

# Build e iniciar containers
echo -e "${YELLOW}🐳 Construindo e iniciando containers...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Aguardar containers iniciarem
echo -e "${YELLOW}⏳ Aguardando containers iniciarem...${NC}"
sleep 10

# Executar migrações
echo -e "${YELLOW}📊 Executando migrações do banco de dados...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || echo "Aviso: Erro ao executar migrações"

# Verificar status
echo -e "${YELLOW}🔍 Verificando status dos containers...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique os logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   2. Teste as URLs do seu domínio"
echo "   3. Configure o Nginx se ainda não configurou"

