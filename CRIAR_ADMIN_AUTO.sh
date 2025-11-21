#!/bin/bash

echo "👤 CRIANDO USUÁRIO ADMIN AUTOMATICAMENTE"
echo "========================================"

# Valores padrão (pode ser alterado via variáveis de ambiente)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@primeiratroca.com.br}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123456}"
ADMIN_NAME="${ADMIN_NAME:-Administrador}"

echo ""
echo "📋 Parâmetros:"
echo "   Email: $ADMIN_EMAIL"
echo "   Senha: $ADMIN_PASSWORD"
echo "   Nome: $ADMIN_NAME"
echo ""

# Verificar se o backend está rodando
if ! docker-compose ps backend | grep -q "Up"; then
    echo "⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 5
fi

# Executar script de criação automática de admin
echo "🔄 Criando usuário admin automaticamente..."
docker-compose exec backend node scripts/create-admin-auto.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Processo concluído!"
    echo ""
    echo "📝 Credenciais de acesso:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   Senha: $ADMIN_PASSWORD"
    echo ""
    echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
else
    echo ""
    echo "❌ Erro ao criar usuário admin. Verifique os logs acima."
    exit 1
fi

