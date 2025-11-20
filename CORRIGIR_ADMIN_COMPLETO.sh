#!/bin/bash

echo "🔧 Corrigindo Admin - Solução Completa"
echo "======================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Descartando mudanças locais e atualizando código..."
git checkout -- CORRIGIR_CORS.sh 2>/dev/null
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
sleep 15
echo ""

echo "5️⃣ Reconstruindo admin com a correção..."
echo "   (Isso pode levar 2-5 minutos)"
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
for i in {1..15}; do
    sleep 5
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ Admin está respondendo! (HTTP $HTTP_CODE)"
        break
    fi
    echo "   Aguardando... ($((i*5))s) - Status: $HTTP_CODE"
done
echo ""

echo "7️⃣ Verificando se CORS está configurado no backend..."
docker-compose exec -T backend node -e "
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '(não definido)');
" 2>/dev/null || echo "⚠️  Não foi possível verificar (backend pode estar iniciando)"
echo ""

echo "===================================="
echo "✅ Correção completa aplicada!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+Del)"
echo "   2. Acesse: https://admin.primeiratrocaecia.com.br/login"
echo "   3. Faça login com: admin@primeiratroca.com.br / admin"
echo ""
echo "💡 Se ainda houver erro:"
echo "   - Verifique logs: docker-compose logs -f admin"
echo "   - Verifique backend: docker-compose logs -f backend | grep CORS"

