#!/bin/bash

echo "🔍 Diagnosticando Erro 500 no Login"
echo "===================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando status dos containers..."
docker-compose ps
echo ""

echo "2️⃣ Verificando logs do backend (últimas 50 linhas)..."
docker-compose logs --tail=50 backend | grep -i "error\|login\|auth" || docker-compose logs --tail=50 backend
echo ""

echo "3️⃣ Testando conexão com o banco de dados..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Conexão com banco OK');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Erro de conexão:', err.message);
    process.exit(1);
  });
"
echo ""

echo "4️⃣ Verificando se JWT_SECRET está configurado..."
docker-compose exec -T backend node -e "
const secret = process.env.JWT_SECRET;
if (secret && secret.length > 10) {
  console.log('✅ JWT_SECRET configurado');
} else {
  console.log('❌ JWT_SECRET não configurado ou muito curto!');
}
"
echo ""

echo "5️⃣ Testando rota de health..."
curl -s http://localhost:5000/api/health | head -5
echo ""

echo "6️⃣ Verificando se há usuários no banco..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => {
    console.log(\`📊 Total de usuários: \${count}\`);
    return prisma.user.findMany({ select: { id: true, email: true, isAdmin: true }, take: 5 });
  })
  .then(users => {
    console.log('👥 Primeiros usuários:');
    users.forEach(u => console.log(\`   - \${u.email} (Admin: \${u.isAdmin})\`));
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
"
echo ""

echo "7️⃣ Testando login via API (simulação)..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"teste"}' \
  2>&1 | head -10
echo ""

echo "===================================="
echo "✅ Diagnóstico completo!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique os logs acima para identificar o erro"
echo "   2. Se o banco não conectar, verifique DATABASE_URL no .env"
echo "   3. Se não houver usuários, crie um admin:"
echo "      docker-compose exec backend node scripts/create-admin-simple.js"
echo "   4. Verifique se o backend está rodando:"
echo "      docker-compose logs -f backend"

