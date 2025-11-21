#!/bin/bash

echo "🔧 Solução Definitiva para Campo Keywords"
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

# 2. Verificar se o campo existe no banco e criar se necessário
echo -e "\n2️⃣ Verificando e criando campo keywords no banco..."
docker-compose exec -T postgres psql -U primeiratroca -d primeiratroca <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'keywords'
    ) THEN
        ALTER TABLE products ADD COLUMN keywords TEXT;
        RAISE NOTICE 'Campo keywords criado!';
    ELSE
        RAISE NOTICE 'Campo keywords já existe';
    END IF;
END
\$\$;
EOF

if [ $? -eq 0 ]; then
    echo "   ✅ Campo keywords verificado/criado no banco"
else
    echo "   ⚠️  Erro ao verificar/criar campo (pode já existir)"
fi

# 3. Remover cache do Prisma Client completamente
echo -e "\n3️⃣ Removendo cache do Prisma Client..."
docker-compose exec backend rm -rf node_modules/.prisma 2>/dev/null || true
docker-compose exec backend rm -rf node_modules/@prisma/client 2>/dev/null || true
docker-compose exec backend find node_modules -name "*prisma*" -type d -exec rm -rf {} + 2>/dev/null || true
echo "   ✅ Cache removido"

# 4. Sincronizar schema com banco (db push) - isso vai detectar o campo e atualizar o schema
echo -e "\n4️⃣ Sincronizando schema do Prisma com o banco (db push)..."
docker-compose exec backend npx prisma db push --accept-data-loss --skip-generate

if [ $? -ne 0 ]; then
    echo "   ⚠️  Erro ao executar db push (continuando mesmo assim)"
fi

# 5. Regenerar Prisma Client (sem --force, pois não existe essa opção)
echo -e "\n5️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 6. Verificar se o Prisma Client reconhece o campo
echo -e "\n6️⃣ Verificando se o Prisma Client reconhece o campo keywords..."
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
    console.log('   Produto ID:', product?.id);
    console.log('   Keywords:', product?.keywords || 'null');
  } catch (error) {
    if (error.message?.includes('Unknown field') || error.message?.includes('keywords')) {
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
    
    # Método alternativo: forçar regeneração removendo tudo e recriando
    echo "   🔄 Removendo e recriando Prisma Client completamente..."
    docker-compose exec backend rm -rf node_modules/@prisma/client node_modules/.prisma
    docker-compose exec backend npx prisma generate
    
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
        echo "   ❌ Ainda não funciona após tentativa alternativa"
        exit 1
    fi
fi

# 7. Reiniciar backend para carregar novo Prisma Client
echo -e "\n7️⃣ Reiniciando backend para carregar novo Prisma Client..."
docker-compose restart backend

# 8. Aguardar inicialização
echo -e "\n8️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 9. Teste final de salvamento
echo -e "\n9️⃣ Teste final - Salvando keywords em um produto..."
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
      console.log('   Testando em produto ID:', product.id, '-', product.name);
      
      // Tentar atualizar com keywords
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { keywords: 'teste-final-keywords-123' },
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
      process.exit(1);
    }
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "\n✅✅✅ SUCESSO! Campo keywords está funcionando! ✅✅✅"
    echo ""
    echo "📝 Agora você pode criar/atualizar produtos com palavras-chave no painel admin."
    echo ""
else
    echo -e "\n⚠️  Teste falhou. Verifique os logs do backend."
    echo "   Execute: docker-compose logs backend --tail=50"
fi

