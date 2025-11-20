#!/bin/bash

echo "🔧 Reconstruindo Admin com Correção de CORS"
echo "============================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Atualizando código..."
git pull origin main
echo ""

echo "2️⃣ Adicionando admin ao CORS_ORIGIN..."
if grep -q "^CORS_ORIGIN" .env; then
    # Verificar se admin já está incluído
    if grep -q "admin.primeiratrocaecia.com.br" .env; then
        echo "✅ Admin já está no CORS_ORIGIN"
    else
        echo "📝 Adicionando admin ao CORS_ORIGIN..."
        sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=https://primeiratrocaecia.com.br,https://www.primeiratrocaecia.com.br,https://admin.primeiratrocaecia.com.br|' .env
        echo "✅ Admin adicionado ao CORS_ORIGIN"
    fi
else
    echo "📝 Criando CORS_ORIGIN..."
    echo "" >> .env
    echo "# CORS - Origens permitidas" >> .env
    echo "CORS_ORIGIN=https://primeiratrocaecia.com.br,https://www.primeiratrocaecia.com.br,https://admin.primeiratrocaecia.com.br" >> .env
    echo "✅ CORS_ORIGIN criado"
fi

echo ""
echo "📋 CORS_ORIGIN atual:"
grep CORS_ORIGIN .env
echo ""

echo "3️⃣ Reiniciando backend para aplicar CORS..."
docker-compose restart backend
echo ""

echo "4️⃣ Aguardando backend iniciar..."
sleep 10
echo ""

echo "5️⃣ Reconstruindo admin com a correção..."
docker-compose up -d --build admin

if [ $? -eq 0 ]; then
    echo "✅ Admin reconstruído"
else
    echo "❌ Erro ao reconstruir admin"
    exit 1
fi
echo ""

echo "6️⃣ Aguardando admin iniciar completamente..."
echo "   (Isso pode levar 30-60 segundos)"
for i in {1..12}; do
    sleep 5
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        echo "✅ Admin está respondendo!"
        break
    fi
    echo "   Aguardando... ($((i*5))s)"
done
echo ""

echo "7️⃣ Verificando se admin está funcionando..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8081)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Admin está respondendo corretamente!"
else
    echo "⚠️  Status HTTP: $HTTP_CODE"
    echo "   Verifique os logs: docker-compose logs admin"
fi
echo ""

echo "8️⃣ Verificando se CORS está configurado no backend..."
docker-compose exec -T backend node -e "
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '(não definido)');
" 2>/dev/null || echo "⚠️  Não foi possível verificar (backend pode estar iniciando)"
echo ""

echo "===================================="
echo "✅ Reconstrução completa!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+Del)"
echo "   2. Acesse: https://admin.primeiratrocaecia.com.br/login"
echo "   3. Faça login com: admin@primeiratroca.com.br / admin"
echo ""
echo "💡 Se ainda houver erro de CORS:"
echo "   - Verifique se o backend reiniciou: docker-compose ps backend"
echo "   - Verifique os logs: docker-compose logs -f backend | grep CORS"

