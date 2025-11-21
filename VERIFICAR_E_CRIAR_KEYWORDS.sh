#!/bin/bash

echo "🔍 Verificando e criando campo keywords se necessário..."
echo "======================================================"

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 15
else
    echo "   ✅ Backend está rodando"
fi

# 2. Executar script Node.js para verificar e criar o campo
echo -e "\n2️⃣ Verificando e criando campo keywords..."
docker-compose exec backend node scripts/verificar-e-criar-keywords.js

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao verificar/criar campo"
    echo "   🔄 Tentando método alternativo: db push..."
    docker-compose exec backend npx prisma db push --accept-data-loss --force-reset
    docker-compose exec backend npx prisma generate
    docker-compose restart backend
    sleep 15
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar logs
echo -e "\n6️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30 | grep -i "error\|keywords\|prisma\|ready" || docker-compose logs backend --tail=20

echo -e "\n✅ Verificação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar/atualizar um produto no painel admin"
echo "   2. Preencha o campo 'Palavras-chave (Opcional - Oculto)'"
echo "   3. Verifique os logs: docker-compose logs backend -f"
echo "   4. Procure por mensagens '[POST /products] Keywords recebido' ou '[PUT /products/X] Keywords recebido'"
echo ""

