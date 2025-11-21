#!/bin/bash

echo "🔧 Corrigindo Backend - Instalando tsx"
echo "======================================"

cd /root/Primeiratroca || exit 1

# 1. Primeiro, resolver conflito do git
echo -e "\n1️⃣ Resolvendo conflito do git..."
git stash
git pull

# 2. Verificar se o backend está rodando
echo -e "\n2️⃣ Verificando status do backend..."
docker-compose ps backend

# 3. Parar o backend
echo -e "\n3️⃣ Parando backend..."
docker-compose stop backend

# 4. Reinstalar dependências no container
echo -e "\n4️⃣ Reinstalando dependências no container do backend..."
docker-compose run --rm backend npm install

# 5. Verificar se tsx foi instalado
echo -e "\n5️⃣ Verificando se tsx foi instalado..."
docker-compose run --rm backend npx tsx --version

if [ $? -ne 0 ]; then
    echo "   ⚠️  tsx não encontrado. Instalando manualmente..."
    docker-compose run --rm backend npm install tsx --save-dev
fi

# 6. Reconstruir o container do backend para garantir que as dependências estão instaladas
echo -e "\n6️⃣ Reconstruindo container do backend..."
docker-compose build --no-cache backend

# 7. Iniciar o backend
echo -e "\n7️⃣ Iniciando backend..."
docker-compose up -d backend

# 8. Aguardar inicialização
echo -e "\n8️⃣ Aguardando backend inicializar (30 segundos)..."
sleep 30

# 9. Verificar logs
echo -e "\n9️⃣ Verificando logs do backend..."
docker-compose logs backend --tail=50 | grep -i "error\|tsx\|listening\|ready\|started\|server" || docker-compose logs backend --tail=30

# 10. Testar se o backend está respondendo
echo -e "\n🔟 Testando se o backend está respondendo..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "   ✅ Backend está respondendo (HTTP $HTTP_CODE)"
    echo ""
    echo "✅✅✅ Backend está funcionando! ✅✅✅"
else
    echo "   ❌ Backend ainda não está respondendo (HTTP $HTTP_CODE)"
    echo ""
    echo "📝 Verifique os logs:"
    echo "   docker-compose logs backend -f"
    echo ""
    echo "💡 Se ainda não funcionar, verifique se o tsx está no package.json:"
    echo "   docker-compose exec backend cat package.json | grep tsx"
fi

echo ""
