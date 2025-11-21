#!/bin/bash

echo "🔧 Forçando Criação do Campo Keywords"
echo "======================================"

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

# 2. Criar campo keywords via SQL direto (forçar)
echo -e "\n2️⃣ Criando campo keywords via SQL direto..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Verificar se existe primeiro
    const check = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords já existe');
    } else {
      console.log('⚠️  Campo não existe. Criando...');
      // Tentar criar sem IF NOT EXISTS primeiro (PostgreSQL pode não suportar)
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN keywords TEXT\`;
        console.log('✅ Campo keywords criado com sucesso!');
      } catch (error1) {
        // Se falhar, tentar com IF NOT EXISTS
        if (error1.message.includes('already exists') || error1.message.includes('duplicate')) {
          console.log('✅ Campo keywords já existe (verificação anterior falhou)');
        } else {
          // Tentar método alternativo
          try {
            await prisma.\$executeRawUnsafe('ALTER TABLE products ADD COLUMN keywords TEXT');
            console.log('✅ Campo keywords criado com sucesso (método alternativo)!');
          } catch (error2) {
            if (error2.message.includes('already exists') || error2.message.includes('duplicate')) {
              console.log('✅ Campo keywords já existe');
            } else {
              console.error('❌ Erro ao criar campo:', error2.message);
              process.exit(1);
            }
          }
        }
      }
    }
    
    // Verificar novamente
    const verify = await prisma.\$queryRaw\`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (verify && verify.length > 0) {
      console.log('✅ Campo keywords confirmado!');
      console.log('   Tipo:', verify[0].data_type);
    } else {
      console.log('❌ Campo ainda não existe após tentativa de criação');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao criar campo. Tentando método alternativo..."
    # Tentar via psql direto se disponível
    docker-compose exec -T postgres psql -U postgres -d primeiratroca -c "ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT;" 2>/dev/null || echo "   ⚠️  Não foi possível usar psql diretamente"
fi

# 3. Regenerar Prisma Client
echo -e "\n3️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

# 4. Reiniciar backend
echo -e "\n4️⃣ Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 6. Verificar novamente e testar
echo -e "\n6️⃣ Verificando e testando campo keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Verificar se existe
    const check = await prisma.\$queryRaw\`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords confirmado no banco!');
      console.log('   Tipo:', check[0].data_type);
      
      // Testar salvamento
      const product = await prisma.product.findFirst({
        select: { id: true, name: true }
      });
      
      if (product) {
        console.log('   Testando salvamento em produto ID:', product.id);
        const updated = await prisma.product.update({
          where: { id: product.id },
          data: { keywords: 'teste-123' },
          select: { id: true, keywords: true }
        });
        console.log('   ✅ Keywords salvo com sucesso:', updated.keywords);
        
        // Limpar teste
        await prisma.product.update({
          where: { id: product.id },
          data: { keywords: null }
        });
        console.log('   ✅ Teste concluído e limpo');
      }
    } else {
      console.log('❌ Campo keywords AINDA não existe!');
      console.log('   Execute manualmente no banco:');
      console.log('   ALTER TABLE products ADD COLUMN keywords TEXT;');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('   Código:', error.code);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

# 7. Verificar logs
echo -e "\n7️⃣ Verificando logs do backend..."
docker-compose logs backend --tail=20 | grep -i "keywords\|error\|ready" || docker-compose logs backend --tail=10

echo -e "\n✅ Processo concluído!"
echo ""
echo "📝 Se o campo ainda não existir, execute manualmente:"
echo "   docker-compose exec postgres psql -U postgres -d primeiratroca -c \"ALTER TABLE products ADD COLUMN keywords TEXT;\""
echo ""

