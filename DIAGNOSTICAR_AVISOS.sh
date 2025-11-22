#!/bin/bash

echo "🔍 Diagnosticando Problema com Avisos"
echo "====================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ❌ Backend não está rodando!"
    exit 1
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar avisos no banco de dados
echo -e "\n2️⃣ Verificando avisos no banco de dados..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const all = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Total de avisos no banco:', all.length);
    all.forEach(a => {
      console.log(\`  - ID: \${a.id}, Título: \${a.title}, Ativo: \${a.isActive}, Tipo: \${a.type}\`);
      console.log(\`    Data início: \${a.startDate || 'null'}, Data fim: \${a.endDate || 'null'}\`);
      console.log(\`    Tem imagem: \${!!a.imageUrl}\`);
    });
    
    const now = new Date();
    const active = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
    });
    console.log('\\nAvisos ativos (filtrados):', active.length);
    active.forEach(a => {
      console.log(\`  - \${a.title} (ID: \${a.id})\`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 3. Testar API de avisos
echo -e "\n3️⃣ Testando API de avisos..."
HTTP_CODE=$(curl -s -o /tmp/announcements_response.json -w "%{http_code}" http://localhost:5000/api/announcements 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API retornou 200"
    echo "   📝 Resposta:"
    cat /tmp/announcements_response.json | head -20
    echo ""
else
    echo "   ❌ API retornou HTTP $HTTP_CODE"
    if [ -f /tmp/announcements_response.json ]; then
        cat /tmp/announcements_response.json
    fi
fi

# 4. Verificar logs do backend para erros
echo -e "\n4️⃣ Verificando logs recentes do backend..."
docker-compose logs backend --tail=50 | grep -i "announcement\|error\|warning" || echo "   Nenhum log relevante encontrado"

# 5. Verificar se a rota está registrada
echo -e "\n5️⃣ Verificando se a rota de avisos está registrada..."
docker-compose exec backend grep -r "announcements" server/index.ts server/routes/ 2>/dev/null | head -5 || echo "   ⚠️  Não foi possível verificar"

echo -e "\n✅ Diagnóstico concluído!"
echo ""
echo "📝 Se os avisos não aparecem, verifique:"
echo "   1. Se isActive está true no banco"
echo "   2. Se as datas de início/fim estão corretas"
echo "   3. Se a API está retornando os avisos"
echo "   4. Se o componente AnnouncementBanner está sendo renderizado"
echo ""

