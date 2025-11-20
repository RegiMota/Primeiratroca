#!/bin/bash

echo "🔧 Corrigindo Configuração de CORS"
echo "===================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando configuração atual..."
if [ -f .env ]; then
    echo "📄 Arquivo .env encontrado"
    echo ""
    echo "Configuração atual de CORS:"
    grep -E "CORS_ORIGIN" .env || echo "   (não encontrado)"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo ""
echo "2️⃣ Configurando CORS_ORIGIN..."
echo ""

# Verificar se CORS_ORIGIN já existe
if grep -q "^CORS_ORIGIN" .env; then
    echo "📝 Atualizando CORS_ORIGIN existente..."
    # Atualizar linha existente
    sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://primeiratrocaecia.com.br,https://www.primeiratrocaecia.com.br,https://admin.primeiratrocaecia.com.br|' .env
else
    echo "📝 Adicionando CORS_ORIGIN..."
    # Adicionar no final do arquivo
    echo "" >> .env
    echo "# CORS - Origens permitidas" >> .env
    echo "CORS_ORIGIN=https://primeiratrocaecia.com.br,https://www.primeiratrocaecia.com.br,https://admin.primeiratrocaecia.com.br" >> .env
fi

echo "✅ CORS_ORIGIN configurado"
echo ""

echo "3️⃣ Verificando configuração final..."
echo ""
grep -E "CORS_ORIGIN" .env
echo ""

echo "4️⃣ Reiniciando backend para aplicar mudanças..."
docker-compose restart backend

echo ""
echo "5️⃣ Aguardando backend iniciar..."
sleep 10

echo ""
echo "6️⃣ Testando login via HTTPS..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://primeiratrocaecia.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://primeiratrocaecia.com.br" \
  -d '{"email":"admin@primeiratroca.com.br","password":"admin"}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY" | head -3
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login via HTTPS funcionando!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Credenciais inválidas (mas CORS está funcionando!)"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Ainda há erro - verifique os logs do backend"
else
    echo "⚠️  Status HTTP: $HTTP_CODE"
fi

echo ""
echo "===================================="
echo "✅ Configuração de CORS aplicada!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste o login no navegador: https://primeiratrocaecia.com.br/login"
echo "   2. Se ainda houver erro, verifique os logs:"
echo "      docker-compose logs -f backend"

