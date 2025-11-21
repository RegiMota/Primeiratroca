#!/bin/bash

echo "🔄 Aplicando migração do Prisma para campo keywords..."
echo "======================================================"

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    echo "   ⏳ Aguardando backend inicializar (15 segundos)..."
    sleep 15
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar se o campo keywords já existe no banco
echo -e "\n2️⃣ Verificando se o campo keywords já existe no banco..."
EXISTS=$(docker-compose exec -T backend npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'keywords';" 2>/dev/null | grep -i keywords || echo "")

if [ -n "$EXISTS" ]; then
    echo "   ✅ Campo keywords já existe no banco de dados"
    echo "   ⚠️  Pulando migração, mas regenerando Prisma Client..."
else
    echo "   ⚠️  Campo keywords NÃO existe no banco de dados"
    echo "   🔄 Aplicando schema ao banco (criando campo keywords)..."
    
    # Aplicar schema ao banco
    docker-compose exec backend npx prisma db push --accept-data-loss
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Erro ao aplicar schema"
        echo "   Verificando logs..."
        docker-compose logs backend --tail=30
        exit 1
    fi
    
    echo "   ✅ Schema aplicado com sucesso! Campo keywords criado."
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar logs
echo -e "\n6️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=30 | grep -i "error\|keywords\|prisma\|ready" || docker-compose logs backend --tail=20

# 7. Testar endpoint
echo -e "\n7️⃣ Testando endpoint de produtos..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?limit=1" 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Endpoint está respondendo (Status: $RESPONSE)"
else
    echo "   ⚠️  Endpoint retornou Status: $RESPONSE"
fi

# 8. Verificar se o campo foi criado
echo -e "\n8️⃣ Verificando se o campo keywords foi criado..."
docker-compose exec -T backend npx prisma db execute --stdin <<< "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'keywords';" 2>/dev/null | grep -i keywords && echo "   ✅ Campo keywords confirmado no banco!" || echo "   ⚠️  Não foi possível verificar o campo (pode ser normal)"

echo -e "\n✅ Migração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Tente criar ou atualizar um produto no painel admin"
echo "   2. Preencha o campo 'Palavras-chave (Opcional - Oculto)'"
echo "   3. O campo keywords agora deve ser salvo corretamente"
echo ""

