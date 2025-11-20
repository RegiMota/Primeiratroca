#!/bin/bash

echo "🔍 Verificando se CORS está funcionando"
echo "======================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando se backend está rodando..."
docker-compose ps backend
echo ""

echo "2️⃣ Aguardando backend iniciar completamente..."
echo "   (Isso pode levar 30-60 segundos)"
for i in {1..12}; do
    sleep 5
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend está respondendo!"
        break
    fi
    echo "   Aguardando... ($((i*5))s)"
done
echo ""

echo "3️⃣ Testando health check..."
curl -s http://localhost:5000/api/health
echo ""
echo ""

echo "4️⃣ Verificando variáveis de ambiente no container..."
docker-compose exec -T backend node -e "
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '(não definido)');
console.log('NODE_ENV:', process.env.NODE_ENV || '(não definido)');
"
echo ""

echo "5️⃣ Testando login via HTTPS..."
sleep 2
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://primeiratrocaecia.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://primeiratrocaecia.com.br" \
  -d '{"email":"admin@primeiratroca.com.br","password":"admin"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY" | head -5
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login via HTTPS funcionando!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Credenciais inválidas (mas CORS está funcionando!)"
    echo "   Verifique a senha do admin"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Erro 500 - Verifique os logs do backend"
    echo ""
    echo "📋 Últimos logs de erro:"
    docker-compose logs --tail=30 backend | grep -i "error\|cors" | tail -10
elif [ "$HTTP_CODE" = "502" ]; then
    echo "❌ 502 Bad Gateway - Backend não está respondendo"
    echo ""
    echo "📋 Verificando status do backend:"
    docker-compose ps backend
    echo ""
    echo "📋 Últimos logs:"
    docker-compose logs --tail=20 backend | tail -10
else
    echo "⚠️  Status HTTP: $HTTP_CODE"
fi

echo ""
echo "===================================="

