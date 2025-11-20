#!/bin/bash

echo "🔍 Verificando Backend e Testando Login"
echo "========================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando status do backend..."
docker-compose ps backend
echo ""

echo "2️⃣ Verificando logs do backend (últimas 30 linhas)..."
docker-compose logs --tail=30 backend
echo ""

echo "3️⃣ Aguardando backend estar pronto..."
sleep 10

echo "4️⃣ Testando health check..."
curl -s http://localhost:5000/api/health
echo ""
echo ""

echo "5️⃣ Testando login com credenciais do admin..."
echo "Email: admin@primeiratroca.com.br"
echo "Senha: admin"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@primeiratroca.com.br","password":"admin"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login funcionando!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Credenciais inválidas - verifique a senha"
    echo ""
    echo "💡 Para criar/alterar senha do admin:"
    echo "   docker-compose exec backend node scripts/create-admin-simple.js admin@primeiratroca.com.br NovaSenha123"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Erro 500 - verifique os logs acima"
    echo ""
    echo "📋 Verificando logs de erro..."
    docker-compose logs --tail=50 backend | grep -i "error\|exception\|failed" | tail -10
else
    echo "❌ Erro desconhecido (HTTP $HTTP_CODE)"
fi

echo ""
echo "===================================="

