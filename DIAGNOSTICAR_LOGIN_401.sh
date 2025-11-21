#!/bin/bash

echo "🔍 Diagnosticando erro 401 no login..."
echo "======================================"

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ❌ Backend não está rodando!"
    exit 1
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar configuração do reCAPTCHA
echo -e "\n2️⃣ Verificando configuração do reCAPTCHA..."
RECAPTCHA_ENABLED=$(grep "RECAPTCHA_ENABLED" .env | cut -d '=' -f2)
RECAPTCHA_SECRET=$(grep "RECAPTCHA_SECRET_KEY" .env | cut -d '=' -f2)

echo "   RECAPTCHA_ENABLED: $RECAPTCHA_ENABLED"
if [ -n "$RECAPTCHA_SECRET" ]; then
    echo "   RECAPTCHA_SECRET_KEY: ${RECAPTCHA_SECRET:0:20}... (oculto)"
else
    echo "   RECAPTCHA_SECRET_KEY: (não configurado)"
fi

# 3. Verificar logs recentes do backend relacionados a login
echo -e "\n3️⃣ Verificando logs recentes do backend (últimas 50 linhas)..."
docker-compose logs backend --tail=50 | grep -i "login\|401\|unauthorized\|recaptcha\|auth" || echo "   Nenhum log relevante encontrado"

# 4. Testar login via API (sem reCAPTCHA se estiver desabilitado)
echo -e "\n4️⃣ Testando login via API..."
echo "   (Este teste requer credenciais válidas)"
echo ""
read -p "   Digite o email do admin: " ADMIN_EMAIL
read -sp "   Digite a senha do admin: " ADMIN_PASSWORD
echo ""

# Fazer requisição de teste
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "   Status HTTP: $HTTP_CODE"
echo "   Resposta: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Login bem-sucedido!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ❌ Erro 401: Credenciais inválidas ou usuário não encontrado"
    echo ""
    echo "   💡 Possíveis causas:"
    echo "      - Email ou senha incorretos"
    echo "      - Usuário não existe no banco"
    echo "      - Senha não corresponde ao hash no banco"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "   ❌ Erro 400: Requisição inválida"
    echo "   💡 Pode ser problema com reCAPTCHA ou dados faltando"
elif [ "$HTTP_CODE" = "429" ]; then
    echo "   ❌ Erro 429: Rate limiting ativo"
    echo "   💡 Aguarde alguns minutos ou reinicie o backend"
else
    echo "   ⚠️  Status inesperado: $HTTP_CODE"
fi

# 5. Verificar se há usuários admin no banco
echo -e "\n5️⃣ Verificando usuários admin no banco..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, name: true }
    });
    console.log('   Usuários admin encontrados:', admins.length);
    admins.forEach(admin => {
      console.log('   - ID:', admin.id, '| Email:', admin.email, '| Nome:', admin.name);
    });
  } catch (error) {
    console.error('   Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null || echo "   ⚠️  Não foi possível verificar usuários (pode ser normal)"

# 6. Verificar variáveis de ambiente do backend
echo -e "\n6️⃣ Verificando variáveis de ambiente do backend..."
docker-compose exec backend printenv | grep -E "RECAPTCHA|NODE_ENV|JWT_SECRET" | head -5 || echo "   ⚠️  Não foi possível verificar variáveis"

echo -e "\n✅ Diagnóstico concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Se o reCAPTCHA estiver habilitado, desabilite temporariamente:"
echo "      echo 'RECAPTCHA_ENABLED=false' >> .env"
echo "      docker-compose restart backend"
echo ""
echo "   2. Se as credenciais estiverem incorretas, crie um novo admin:"
echo "      docker-compose exec backend node scripts/create-admin-auto.js"
echo ""
echo "   3. Se o rate limiting estiver bloqueando, aguarde 15 minutos ou reinicie:"
echo "      docker-compose restart backend"
echo ""

