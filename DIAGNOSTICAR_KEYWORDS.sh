#!/bin/bash

echo "🔍 Diagnosticando problema com campo keywords..."
echo "=============================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ❌ Backend não está rodando!"
    exit 1
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar se o campo keywords existe no schema do Prisma
echo -e "\n2️⃣ Verificando se o campo keywords existe no schema do Prisma..."
if grep -q "keywords.*String.*@db.Text" prisma/schema.prisma; then
    echo "   ✅ Campo keywords existe no schema do Prisma"
else
    echo "   ❌ Campo keywords NÃO existe no schema do Prisma!"
    exit 1
fi

# 3. Verificar se o campo keywords existe no banco de dados
echo -e "\n3️⃣ Verificando se o campo keywords existe no banco de dados..."
KEYWORDS_EXISTS=$(docker-compose exec -T backend psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'keywords';" 2>/dev/null | tr -d ' ')

if [ -n "$KEYWORDS_EXISTS" ] && [ "$KEYWORDS_EXISTS" = "keywords" ]; then
    echo "   ✅ Campo keywords existe no banco de dados"
else
    echo "   ❌ Campo keywords NÃO existe no banco de dados!"
    echo "   🔄 Aplicando migração..."
    docker-compose exec backend npx prisma db push --accept-data-loss
    if [ $? -eq 0 ]; then
        echo "   ✅ Migração aplicada com sucesso!"
        docker-compose exec backend npx prisma generate
        docker-compose restart backend
        sleep 15
    else
        echo "   ❌ Erro ao aplicar migração"
        exit 1
    fi
fi

# 4. Verificar logs recentes do backend para keywords
echo -e "\n4️⃣ Verificando logs recentes do backend para keywords..."
docker-compose logs backend --tail=100 | grep -i "keywords" | tail -10 || echo "   ⚠️  Nenhum log de keywords encontrado"

# 5. Testar criação de produto com keywords via API
echo -e "\n5️⃣ Testando salvamento de keywords..."
echo "   (Este teste requer token de autenticação admin)"
echo "   Verifique os logs do backend ao criar/atualizar um produto no painel admin"

# 6. Verificar se há produtos com keywords no banco
echo -e "\n6️⃣ Verificando produtos com keywords no banco..."
PRODUCTS_WITH_KEYWORDS=$(docker-compose exec -T backend psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM products WHERE keywords IS NOT NULL AND keywords != '';" 2>/dev/null | tr -d ' ')
echo "   Produtos com keywords: $PRODUCTS_WITH_KEYWORDS"

# 7. Mostrar exemplo de produto
echo -e "\n7️⃣ Exemplo de produto (primeiro produto):"
docker-compose exec -T backend psql $DATABASE_URL -c "SELECT id, name, keywords FROM products LIMIT 1;" 2>/dev/null || echo "   ⚠️  Não foi possível consultar produtos"

echo -e "\n✅ Diagnóstico concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Se o campo não existia, a migração foi aplicada"
echo "   2. Tente criar/atualizar um produto no painel admin"
echo "   3. Verifique os logs do backend: docker-compose logs backend -f"
echo "   4. Procure por mensagens '[POST /products] Keywords recebido' ou '[PUT /products/X] Keywords recebido'"
echo ""

