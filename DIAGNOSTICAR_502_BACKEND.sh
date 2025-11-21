#!/bin/bash

echo "🔍 DIAGNÓSTICO DE ERRO 502 NO BACKEND"
echo "======================================"

# 1. Verificar status dos containers
echo -e "\n1️⃣ Status dos containers Docker:"
docker-compose ps

# 2. Verificar logs do backend (últimas 100 linhas)
echo -e "\n2️⃣ Últimos 100 logs do backend:"
docker-compose logs backend --tail=100

# 3. Verificar se o backend está respondendo localmente
echo -e "\n3️⃣ Testando conexão local do backend (http://localhost:5000/api/health):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:5000/api/health || echo "❌ Backend não está respondendo"

# 4. Verificar se o container está rodando
echo -e "\n4️⃣ Verificando se o container backend está rodando:"
BACKEND_STATUS=$(docker-compose ps backend --format "{{.State}}" 2>/dev/null)
if [ -z "$BACKEND_STATUS" ]; then
    echo "❌ Container backend não encontrado!"
    echo "   Tentando iniciar..."
    docker-compose up -d backend
    sleep 5
else
    echo "Status do container: $BACKEND_STATUS"
fi

# 5. Verificar logs de erro específicos
echo -e "\n5️⃣ Buscando erros nos logs do backend:"
docker-compose logs backend --tail=200 | grep -i "error\|exception\|fatal\|crash" | tail -20

# 6. Verificar conexão com o banco de dados
echo -e "\n6️⃣ Verificando conexão com o banco de dados:"
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Conexão com banco OK');
    return prisma.\$disconnect();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  });
" 2>&1 || echo "❌ Erro ao testar conexão com banco"

# 7. Verificar se há problemas com o schema do Prisma
echo -e "\n7️⃣ Verificando schema do Prisma:"
docker-compose exec -T backend npx prisma validate 2>&1 | head -20

# 8. Tentar reiniciar o backend
echo -e "\n8️⃣ Reiniciando backend..."
docker-compose restart backend
sleep 10

# 9. Testar novamente após reiniciar
echo -e "\n9️⃣ Testando novamente após reiniciar:"
sleep 5
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:5000/api/health || echo "❌ Ainda não está respondendo"

# 10. Verificar logs após reiniciar
echo -e "\n🔟 Últimos logs após reiniciar:"
docker-compose logs backend --tail=30

echo -e "\n✅ Diagnóstico concluído!"
echo "Se o problema persistir, verifique:"
echo "  - Logs do backend: docker-compose logs backend"
echo "  - Status dos containers: docker-compose ps"
echo "  - Configuração do Nginx: /etc/nginx/sites-available/primeira-troca-api.conf"

