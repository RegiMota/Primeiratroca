#!/bin/bash

echo "🔧 Corrigindo Erro 502 Bad Gateway"
echo "==================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar status dos containers
echo -e "\n1️⃣ Verificando status dos containers..."
docker-compose ps

# 2. Verificar se o backend está rodando
echo -e "\n2️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 15
else
    echo "   ✅ Backend está rodando"
fi

# 3. Verificar logs do backend para erros
echo -e "\n3️⃣ Verificando logs recentes do backend..."
docker-compose logs backend --tail=50 | grep -i "error\|fatal\|exception\|prisma\|keywords" || docker-compose logs backend --tail=30

# 4. Verificar se o backend está respondendo na porta 5000
echo -e "\n4️⃣ Testando se o backend responde na porta 5000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -q "200\|404"; then
    echo "   ✅ Backend está respondendo na porta 5000"
else
    echo "   ❌ Backend NÃO está respondendo na porta 5000"
    echo "   🔄 Tentando reiniciar o backend..."
    docker-compose restart backend
    sleep 20
    echo "   🔄 Testando novamente..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -q "200\|404"; then
        echo "   ✅ Backend agora está respondendo"
    else
        echo "   ❌ Backend ainda não está respondendo"
        echo "   📝 Verificando logs detalhados..."
        docker-compose logs backend --tail=100
    fi
fi

# 5. Verificar status do Nginx
echo -e "\n5️⃣ Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx está rodando"
else
    echo "   ⚠️  Nginx não está rodando. Iniciando..."
    systemctl start nginx
    sleep 2
fi

# 6. Verificar configuração do Nginx para admin
echo -e "\n6️⃣ Verificando configuração do Nginx para admin..."
if [ -f "/etc/nginx/sites-available/admin.primeiratrocaecia.com.br" ]; then
    echo "   ✅ Arquivo de configuração existe"
    echo "   📝 Verificando se o proxy está configurado corretamente..."
    if grep -q "proxy_pass.*5000" /etc/nginx/sites-available/admin.primeiratrocaecia.com.br; then
        echo "   ✅ Proxy configurado para porta 5000"
    else
        echo "   ⚠️  Proxy pode não estar configurado corretamente"
    fi
else
    echo "   ❌ Arquivo de configuração não existe"
fi

# 7. Testar conexão do Nginx com o backend
echo -e "\n7️⃣ Testando conexão do Nginx com o backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' | grep -q "400\|401\|429"; then
    echo "   ✅ Backend está respondendo (mesmo que com erro de validação)"
else
    echo "   ❌ Backend não está respondendo corretamente"
fi

# 8. Verificar se há problemas com Prisma/Keywords que podem estar travando o backend
echo -e "\n8️⃣ Verificando se há problemas com Prisma que podem estar travando o backend..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$queryRaw\`SELECT 1\`;
    console.log('✅ Prisma está funcionando');
  } catch (error) {
    console.error('❌ Erro no Prisma:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 9. Reiniciar backend e Nginx
echo -e "\n9️⃣ Reiniciando backend e Nginx..."
docker-compose restart backend
sleep 5
systemctl reload nginx

# 10. Aguardar backend inicializar
echo -e "\n🔟 Aguardando backend inicializar (20 segundos)..."
sleep 20

# 11. Teste final
echo -e "\n1️⃣1️⃣ Teste final - Verificando se o backend responde..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "   ✅ Backend está respondendo (HTTP $HTTP_CODE)"
    echo ""
    echo "✅✅✅ Backend está funcionando! ✅✅✅"
    echo ""
    echo "📝 Se ainda houver erro 502, verifique:"
    echo "   1. Logs do Nginx: tail -f /var/log/nginx/error.log"
    echo "   2. Logs do backend: docker-compose logs backend -f"
    echo "   3. Configuração do Nginx: cat /etc/nginx/sites-available/admin.primeiratrocaecia.com.br"
else
    echo "   ❌ Backend ainda não está respondendo (HTTP $HTTP_CODE)"
    echo ""
    echo "📝 Verifique os logs:"
    echo "   docker-compose logs backend --tail=100"
    echo "   systemctl status nginx"
fi

echo ""

