#!/bin/bash

echo "🔧 Resolvendo erro 401 no login do admin..."
echo "=========================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando se o backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   ⚠️  Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 15
else
    echo "   ✅ Backend está rodando"
fi

# 2. Verificar usuários admin existentes
echo -e "\n2️⃣ Verificando usuários admin existentes..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.log('   Usuários admin encontrados:', admins.length);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log('   - ID:', admin.id, '| Email:', admin.email, '| Nome:', admin.name, '| Criado em:', admin.createdAt);
      });
    } else {
      console.log('   ⚠️  Nenhum usuário admin encontrado!');
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 3. Criar usuário admin se não existir
echo -e "\n3️⃣ Criando usuário admin (se não existir)..."
docker-compose exec backend node scripts/create-admin-auto.js

# 4. Verificar se foi criado
echo -e "\n4️⃣ Verificando usuários admin após criação..."
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
    if (admins.length > 0) {
      console.log('   ✅ Credenciais padrão:');
      admins.forEach(admin => {
        console.log('      Email:', admin.email);
        console.log('      Senha: admin123456 (padrão)');
        console.log('      Nome:', admin.name);
        console.log('');
      });
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 5. Verificar configuração do reCAPTCHA
echo -e "\n5️⃣ Verificando configuração do reCAPTCHA..."
RECAPTCHA_ENABLED=$(grep "^RECAPTCHA_ENABLED" .env | cut -d '=' -f2 || echo "false")
echo "   RECAPTCHA_ENABLED: $RECAPTCHA_ENABLED"

if [ "$RECAPTCHA_ENABLED" = "true" ]; then
    echo "   ⚠️  reCAPTCHA está habilitado. Desabilitando temporariamente..."
    sed -i 's/^RECAPTCHA_ENABLED=true/RECAPTCHA_ENABLED=false/' .env
    docker-compose restart backend
    sleep 10
    echo "   ✅ reCAPTCHA desabilitado e backend reiniciado"
fi

# 6. Verificar logs recentes
echo -e "\n6️⃣ Verificando logs recentes do backend (últimas 20 linhas)..."
docker-compose logs backend --tail=20 | grep -i "error\|login\|401\|unauthorized" || echo "   Nenhum erro relevante encontrado"

echo -e "\n✅ Resolução concluída!"
echo ""
echo "📝 Credenciais padrão do admin:"
echo "   Email: admin@primeiratroca.com.br"
echo "   Senha: admin123456"
echo ""
echo "💡 Se ainda não conseguir fazer login:"
echo "   1. Verifique se está usando as credenciais corretas"
echo "   2. Limpe o cache do navegador (Ctrl+Shift+Del)"
echo "   3. Tente em modo anônimo/privado"
echo "   4. Verifique os logs: docker-compose logs backend -f"
echo ""

