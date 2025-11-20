#!/bin/bash

echo "🔍 Testando Login via HTTPS (como o navegador)"
echo "=============================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Monitorando logs do backend em tempo real..."
echo "   (Pressione Ctrl+C após testar no navegador)"
echo ""

# Iniciar monitoramento de logs em background
docker-compose logs -f backend &
LOG_PID=$!

# Aguardar um pouco
sleep 2

echo ""
echo "2️⃣ Testando login via HTTPS (simulando navegador)..."
echo ""

# Testar via HTTPS (como o navegador faz)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://primeiratrocaecia.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://primeiratrocaecia.com.br" \
  -H "Referer: https://primeiratrocaecia.com.br/login" \
  -d '{"email":"admin@primeiratroca.com.br","password":"admin"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login via HTTPS funcionando!"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Erro 500 - Verifique os logs acima"
    echo ""
    echo "📋 Últimos erros do backend:"
    docker-compose logs --tail=50 backend | grep -i "error\|exception\|failed" | tail -10
else
    echo "⚠️  Status HTTP: $HTTP_CODE"
fi

# Parar monitoramento
kill $LOG_PID 2>/dev/null

echo ""
echo "3️⃣ Verificando configuração do Nginx para /api/..."
echo ""

if [ -f /etc/nginx/conf.d/primeira-troca-frontend.conf ]; then
    echo "📄 Configuração do frontend:"
    grep -A 10 "location /api/" /etc/nginx/conf.d/primeira-troca-frontend.conf | head -15
else
    echo "❌ Arquivo de configuração não encontrado"
fi

echo ""
echo "===================================="
echo ""
echo "💡 Se o erro persistir:"
echo "   1. Verifique os logs do backend acima"
echo "   2. Teste fazer login no navegador e observe os logs"
echo "   3. Verifique se há erros no Nginx:"
echo "      tail -f /var/log/nginx/error.log"

