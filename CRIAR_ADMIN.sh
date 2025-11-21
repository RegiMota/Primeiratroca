#!/bin/bash

echo "👤 CRIAR USUÁRIO ADMIN"
echo "====================="

# Verificar se os parâmetros foram fornecidos
if [ $# -eq 0 ]; then
    echo ""
    echo "Uso: ./CRIAR_ADMIN.sh [email] [senha] [nome]"
    echo ""
    echo "Exemplos:"
    echo "  ./CRIAR_ADMIN.sh"
    echo "  ./CRIAR_ADMIN.sh admin@exemplo.com"
    echo "  ./CRIAR_ADMIN.sh admin@exemplo.com senha123"
    echo "  ./CRIAR_ADMIN.sh admin@exemplo.com senha123 \"Nome do Admin\""
    echo ""
    echo "Se não fornecer parâmetros, serão usados valores padrão:"
    echo "  Email: admin@primeiratroca.com.br"
    echo "  Senha: admin"
    echo "  Nome: Administrador"
    echo ""
    read -p "Deseja continuar com os valores padrão? (s/N): " confirm
    
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
    
    EMAIL="admin@primeiratroca.com.br"
    PASSWORD="admin"
    NAME="Administrador"
else
    EMAIL="${1:-admin@primeiratroca.com.br}"
    PASSWORD="${2:-admin}"
    NAME="${3:-Administrador}"
fi

echo ""
echo "📋 Parâmetros:"
echo "   Email: $EMAIL"
echo "   Senha: $PASSWORD"
echo "   Nome: $NAME"
echo ""

# Verificar se o backend está rodando
if ! docker-compose ps backend | grep -q "Up"; then
    echo "⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 5
fi

# Executar script de criação de admin
echo "🔄 Criando usuário admin..."
docker-compose exec backend node scripts/create-admin-simple.js "$EMAIL" "$PASSWORD" "$NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Processo concluído!"
    echo ""
    echo "📝 Credenciais de acesso:"
    echo "   Email: $EMAIL"
    echo "   Senha: $PASSWORD"
    echo ""
    echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
else
    echo ""
    echo "❌ Erro ao criar usuário admin. Verifique os logs acima."
    exit 1
fi

