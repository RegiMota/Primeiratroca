#!/bin/bash

echo "🔍 Diagnosticando Por Que Admin Não Mostra Registros"
echo "===================================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando se backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend não está rodando!"
    exit 1
fi
echo "✅ Backend está rodando"
echo ""

echo "2️⃣ Verificando se há dados no banco..."
DB_COUNTS=$(docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

Promise.all([
  prisma.user.count(),
  prisma.order.count(),
  prisma.payment.count(),
  prisma.product.count()
])
.then(([users, orders, payments, products]) => {
  console.log(JSON.stringify({
    users: users,
    orders: orders,
    payments: payments,
    products: products
  }));
  prisma.\$disconnect();
})
.catch(error => {
  console.error('Erro:', error.message);
  process.exit(1);
});
" 2>&1)

echo "$DB_COUNTS"
echo ""

echo "3️⃣ Testando rota /api/admin/dashboard (sem autenticação)..."
DASHBOARD_TEST=$(curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:5000/api/admin/dashboard 2>/dev/null)
echo "   Status: $DASHBOARD_TEST"
if [ "$DASHBOARD_TEST" = "HTTP 401" ] || [ "$DASHBOARD_TEST" = "HTTP 403" ]; then
    echo "   ✅ Autenticação está funcionando (esperado)"
else
    echo "   ⚠️  Status inesperado"
fi
echo ""

echo "4️⃣ Verificando logs do backend para erros de admin..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs backend 2>/dev/null | grep -i -E "(admin|dashboard|orders|payments|users|error|erro)" | tail -20 || echo "   Nenhum log relevante encontrado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "5️⃣ Verificando se há pedidos no banco..."
ORDERS_COUNT=$(docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.order.count()
.then(count => {
  console.log(count);
  prisma.\$disconnect();
})
.catch(error => {
  console.error('Erro:', error.message);
  process.exit(1);
});
" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ -z "$ORDERS_COUNT" ] || [ "$ORDERS_COUNT" = "0" ]; then
    echo "⚠️  Não há pedidos no banco de dados"
    echo "   Isso explica por que o admin não mostra registros"
    echo ""
    echo "💡 Para testar, faça um pedido no site primeiro"
else
    echo "✅ Há $ORDERS_COUNT pedido(s) no banco"
    echo ""
    echo "6️⃣ Verificando formato da resposta da API..."
    echo "   (Isso requer autenticação, então vamos verificar os logs)"
fi
echo ""

echo "7️⃣ Verificando se admin container está rodando..."
if docker-compose ps admin | grep -q "Up"; then
    echo "✅ Admin container está rodando"
else
    echo "❌ Admin container NÃO está rodando!"
    echo "   Iniciando..."
    docker-compose up -d admin
    sleep 10
fi
echo ""

echo "8️⃣ Testando acesso ao admin..."
ADMIN_HTTP=$(curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:8081 2>/dev/null)
echo "   Status local: $ADMIN_HTTP"
echo ""

echo "===================================="
echo "📋 RESUMO:"
echo ""
echo "   Pedidos no banco: ${ORDERS_COUNT:-0}"
echo "   Backend: $(docker-compose ps backend | grep -q 'Up' && echo '✅ Rodando' || echo '❌ Parado')"
echo "   Admin: $(docker-compose ps admin | grep -q 'Up' && echo '✅ Rodando' || echo '❌ Parado')"
echo ""
if [ -z "$ORDERS_COUNT" ] || [ "$ORDERS_COUNT" = "0" ]; then
    echo "💡 SOLUÇÃO:"
    echo "   O banco de dados não tem pedidos ainda."
    echo "   Faça um pedido no site primeiro para aparecer no admin."
else
    echo "💡 Se há pedidos mas não aparecem no admin:"
    echo "   1. Verifique o console do navegador (F12)"
    echo "   2. Verifique se está logado como admin"
    echo "   3. Verifique os logs: docker-compose logs -f backend | grep admin"
fi

