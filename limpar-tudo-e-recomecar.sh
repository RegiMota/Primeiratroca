#!/bin/bash

echo "🧹 Script de Limpeza Completa - Primeira Troca"
echo "=============================================="
echo ""
echo "⚠️  ATENÇÃO: Este script vai apagar TUDO!"
echo "   - Todos os containers Docker"
echo "   - Todas as imagens Docker"
echo "   - Todos os volumes Docker (incluindo banco de dados!)"
echo "   - Todas as redes Docker"
echo "   - Todo o código do repositório"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirmacao

if [ "$confirmacao" != "SIM" ]; then
    echo "❌ Operação cancelada."
    exit 1
fi

echo ""
echo "📋 Passo 1: Parando todos os containers..."
docker-compose down -v 2>/dev/null
docker stop $(docker ps -aq) 2>/dev/null
echo "✅ Containers parados"

echo ""
echo "📋 Passo 2: Removendo todos os containers..."
docker rm -f $(docker ps -aq) 2>/dev/null
echo "✅ Containers removidos"

echo ""
echo "📋 Passo 3: Removendo todas as imagens Docker..."
docker rmi -f $(docker images -q) 2>/dev/null
echo "✅ Imagens removidas"

echo ""
echo "📋 Passo 4: Removendo todos os volumes Docker..."
docker volume rm $(docker volume ls -q) 2>/dev/null
echo "✅ Volumes removidos"

echo ""
echo "📋 Passo 5: Removendo todas as redes Docker (exceto as padrões)..."
docker network prune -f
echo "✅ Redes removidas"

echo ""
echo "📋 Passo 6: Limpando sistema Docker..."
docker system prune -a -f --volumes
echo "✅ Sistema limpo"

echo ""
echo "📋 Passo 7: Removendo diretório do projeto..."
cd /root
if [ -d "Primeiratroca" ]; then
    rm -rf Primeiratroca
    echo "✅ Diretório Primeiratroca removido"
else
    echo "⚠️  Diretório Primeiratroca não encontrado"
fi

echo ""
echo "📋 Passo 8: Clonando repositório novamente..."
git clone https://github.com/RegiMota/Primeiratroca.git
cd Primeiratroca
echo "✅ Repositório clonado"

echo ""
echo "📋 Passo 9: Verificando arquivos..."
ls -la
echo "✅ Arquivos verificados"

echo ""
echo "=============================================="
echo -e "✅ \033[1;32mLimpeza completa! Tudo foi removido e repositório foi clonado novamente.\033[0m"
echo "=============================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "2. Construa e inicie os containers:"
echo "   docker-compose up -d --build"
echo ""
echo "3. Aguarde tudo inicializar (60 segundos):"
echo "   sleep 60"
echo ""
echo "4. Verifique o status:"
echo "   docker-compose ps"
echo ""
echo "5. Veja os logs:"
echo "   docker-compose logs -f"
echo ""

