#!/bin/bash

echo "🔧 Criando Campo Keywords - Solução Definitiva"
echo "=============================================="

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

# 2. Copiar script para o container (se necessário)
echo -e "\n2️⃣ Preparando script Node.js..."
# O script já deve estar no repositório, então vamos executá-lo diretamente

# 3. Executar script Node.js dentro do container
echo -e "\n3️⃣ Executando script para criar campo keywords..."
docker-compose exec -T backend node scripts/criar-campo-keywords-definitivo.js

if [ $? -ne 0 ]; then
    echo "   ⚠️  Script falhou. Tentando método alternativo via psql..."
    
    # Método alternativo: via psql direto
    DB_USER=$(grep "POSTGRES_USER" .env | cut -d '=' -f2 || echo "postgres")
    DB_NAME=$(grep "POSTGRES_DB" .env | cut -d '=' -f2 || echo "primeiratroca")
    
    echo "   Tentando criar via psql (usuário: $DB_USER, banco: $DB_NAME)..."
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT;" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Campo criado via psql!"
    else
        echo "   ❌ Falha ao criar campo via psql também"
        echo ""
        echo "   📝 Execute manualmente:"
        echo "   docker-compose exec postgres psql -U $DB_USER -d $DB_NAME"
        echo "   E então: ALTER TABLE products ADD COLUMN keywords TEXT;"
        exit 1
    fi
fi

# 4. Regenerar Prisma Client
echo -e "\n4️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao regenerar Prisma Client"
    exit 1
fi

echo "   ✅ Prisma Client regenerado!"

# 5. Reiniciar backend
echo -e "\n5️⃣ Reiniciando backend..."
docker-compose restart backend

# 6. Aguardar inicialização
echo -e "\n6️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 7. Verificar logs
echo -e "\n7️⃣ Verificando logs do backend..."
docker-compose logs backend --tail=30 | grep -i "keywords\|error\|ready" || docker-compose logs backend --tail=10

# 8. Teste final
echo -e "\n8️⃣ Teste final - Verificando se keywords funciona..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const check = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords confirmado!');
      
      // Testar salvamento
      const product = await prisma.product.findFirst();
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { keywords: 'teste-final' }
        });
        const updated = await prisma.product.findUnique({
          where: { id: product.id },
          select: { keywords: true }
        });
        console.log('✅ Keywords salvo e recuperado:', updated.keywords);
        
        // Limpar
        await prisma.product.update({
          where: { id: product.id },
          data: { keywords: null }
        });
      }
    } else {
      console.log('❌ Campo ainda não existe');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>/dev/null

echo -e "\n✅ Processo concluído!"
echo ""
echo "📝 Agora você pode criar/atualizar produtos com palavras-chave no painel admin."
echo ""

