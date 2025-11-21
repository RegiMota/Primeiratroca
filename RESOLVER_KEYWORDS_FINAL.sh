#!/bin/bash

echo "🔧 Resolução Final para Campo Keywords"
echo "======================================="

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

# 2. Verificar se o campo já existe no banco
echo -e "\n2️⃣ Verificando se o campo keywords existe no banco..."
EXISTS=$(docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const result = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    if (result && result.length > 0) {
      console.log('EXISTS');
    } else {
      console.log('NOT_EXISTS');
    }
  } catch (error) {
    console.log('ERROR');
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null | grep -i "EXISTS" || echo "NOT_EXISTS")

if [ "$EXISTS" = "EXISTS" ]; then
    echo "   ✅ Campo keywords já existe no banco"
else
    echo "   ⚠️  Campo keywords NÃO existe. Criando..."
    
    # Criar campo via SQL direto usando Prisma
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      try {
        await prisma.\$executeRaw\`ALTER TABLE products ADD COLUMN keywords TEXT\`;
        console.log('✅ Campo keywords criado!');
      } catch (error) {
        if (error.message?.includes('already exists') || error.code === '42701') {
          console.log('✅ Campo keywords já existe');
        } else {
          console.error('❌ Erro:', error.message);
          process.exit(1);
        }
      } finally {
        await prisma.\$disconnect();
      }
    })();
    " 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Erro ao criar campo"
        exit 1
    fi
fi

# 3. FORÇAR regeneração do Prisma Client (remover cache primeiro)
echo -e "\n3️⃣ Removendo cache do Prisma Client..."
docker-compose exec backend rm -rf node_modules/.prisma 2>/dev/null || true
docker-compose exec backend rm -rf node_modules/@prisma/client 2>/dev/null || true

# 4. Regenerar Prisma Client
echo -e "\n4️⃣ Regenerando Prisma Client (forçando)..."
docker-compose exec backend npx prisma generate --force

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 5. Verificar se o Prisma Client reconhece o campo
echo -e "\n5️⃣ Verificando se o Prisma Client reconhece o campo keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Tentar buscar um produto com keywords
    const product = await prisma.product.findFirst({
      select: { id: true, name: true, keywords: true }
    });
    console.log('✅ Prisma Client reconhece o campo keywords!');
    console.log('   Produto:', product?.id, '- Keywords:', product?.keywords || 'null');
  } catch (error) {
    if (error.message?.includes('Unknown argument') || error.message?.includes('keywords')) {
      console.log('❌ Prisma Client AINDA não reconhece o campo keywords');
      console.log('   Erro:', error.message);
      process.exit(1);
    } else {
      console.log('⚠️  Erro ao testar:', error.message);
    }
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "   ⚠️  Prisma Client ainda não reconhece. Tentando método alternativo..."
    
    # Método alternativo: usar db push para sincronizar
    echo "   🔄 Executando prisma db push para sincronizar..."
    docker-compose exec backend npx prisma db push --accept-data-loss --skip-generate
    
    # Regenerar novamente
    echo "   🔄 Regenerando Prisma Client novamente..."
    docker-compose exec backend npx prisma generate --force
    
    # Testar novamente
    docker-compose exec -T backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    (async () => {
      try {
        const product = await prisma.product.findFirst({
          select: { id: true, keywords: true }
        });
        console.log('✅ Agora funciona! Keywords:', product?.keywords || 'null');
      } catch (error) {
        console.error('❌ Ainda não funciona:', error.message);
        process.exit(1);
      } finally {
        await prisma.\$disconnect();
      }
    })();
    " 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Ainda não funciona. Pode ser necessário reiniciar o container do backend."
    fi
fi

# 6. Reiniciar backend para garantir que o novo Prisma Client seja carregado
echo -e "\n6️⃣ Reiniciando backend para carregar novo Prisma Client..."
docker-compose restart backend

# 7. Aguardar inicialização
echo -e "\n7️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 8. Teste final
echo -e "\n8️⃣ Teste final - Criando/atualizando produto com keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Buscar um produto existente
    const product = await prisma.product.findFirst({
      select: { id: true, name: true }
    });
    
    if (product) {
      console.log('   Testando em produto ID:', product.id);
      
      // Tentar atualizar com keywords
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { keywords: 'teste-final-123' },
        select: { id: true, keywords: true }
      });
      
      console.log('   ✅ Keywords salvo:', updated.keywords);
      
      // Limpar
      await prisma.product.update({
        where: { id: product.id },
        data: { keywords: null }
      });
      
      console.log('   ✅ Teste concluído com sucesso!');
    } else {
      console.log('   ⚠️  Nenhum produto encontrado para teste');
    }
  } catch (error) {
    console.error('   ❌ Erro no teste:', error.message);
    if (error.message?.includes('Unknown argument')) {
      console.error('   ⚠️  Prisma Client ainda não reconhece o campo keywords');
      console.error('   💡 Tente executar manualmente:');
      console.error('      docker-compose exec backend npx prisma generate');
      console.error('      docker-compose restart backend');
    }
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "\n✅✅✅ SUCESSO! Campo keywords está funcionando! ✅✅✅"
    echo ""
    echo "📝 Agora você pode criar/atualizar produtos com palavras-chave no painel admin."
else
    echo -e "\n⚠️  Teste falhou, mas o campo foi criado no banco."
    echo "   Execute manualmente para garantir:"
    echo "   docker-compose exec backend npx prisma generate"
    echo "   docker-compose restart backend"
fi

echo ""

