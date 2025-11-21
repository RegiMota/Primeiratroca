#!/bin/bash

echo "🔧 Criando Campo Keywords via SQL Direto"
echo "========================================="

cd /root/Primeiratroca || exit 1

# 1. Verificar se o postgres está rodando
echo -e "\n1️⃣ Verificando se o postgres está rodando..."
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "   ❌ PostgreSQL não está rodando!"
    exit 1
else
    echo "   ✅ PostgreSQL está rodando"
fi

# 2. Obter variáveis de ambiente do banco
echo -e "\n2️⃣ Obtendo credenciais do banco..."
DB_USER=$(grep "POSTGRES_USER" .env | cut -d '=' -f2 || echo "postgres")
DB_PASSWORD=$(grep "POSTGRES_PASSWORD" .env | cut -d '=' -f2 || echo "postgres")
DB_NAME=$(grep "POSTGRES_DB" .env | cut -d '=' -f2 || echo "primeiratroca")

echo "   Usuário: $DB_USER"
echo "   Banco: $DB_NAME"

# 3. Criar campo via psql direto
echo -e "\n3️⃣ Criando campo keywords via SQL direto..."
docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Verificar se o campo já existe
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'keywords'
    ) THEN
        ALTER TABLE products ADD COLUMN keywords TEXT;
        RAISE NOTICE 'Campo keywords criado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo keywords já existe';
    END IF;
END
\$\$;
EOF

if [ $? -eq 0 ]; then
    echo "   ✅ Comando SQL executado"
else
    echo "   ⚠️  Erro ao executar SQL. Tentando método alternativo..."
    
    # Método alternativo: executar SQL simples
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT;" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Campo criado via método alternativo"
    else
        echo "   ❌ Falha ao criar campo"
        exit 1
    fi
fi

# 4. Verificar se foi criado
echo -e "\n4️⃣ Verificando se o campo foi criado..."
docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'keywords';" 2>/dev/null

# 5. Regenerar Prisma Client
echo -e "\n5️⃣ Regenerando Prisma Client..."
docker-compose exec backend npx prisma generate

# 6. Reiniciar backend
echo -e "\n6️⃣ Reiniciando backend..."
docker-compose restart backend

# 7. Aguardar inicialização
echo -e "\n7️⃣ Aguardando backend inicializar (20 segundos)..."
sleep 20

# 8. Testar salvamento
echo -e "\n8️⃣ Testando salvamento de keywords..."
docker-compose exec -T backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Verificar se existe
    const check = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'keywords'
    \`;
    
    if (check && check.length > 0) {
      console.log('✅ Campo keywords confirmado!');
      
      // Testar em um produto
      const product = await prisma.product.findFirst({
        select: { id: true, name: true }
      });
      
      if (product) {
        console.log('   Testando em produto ID:', product.id);
        const updated = await prisma.product.update({
          where: { id: product.id },
          data: { keywords: 'teste-final-123' },
          select: { keywords: true }
        });
        console.log('   ✅ Keywords salvo:', updated.keywords);
        
        // Limpar
        await prisma.product.update({
          where: { id: product.id },
          data: { keywords: null }
        });
        console.log('   ✅ Teste concluído');
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
echo "📝 Se ainda não funcionar, execute manualmente:"
echo "   docker-compose exec postgres psql -U $DB_USER -d $DB_NAME"
echo "   E então execute: ALTER TABLE products ADD COLUMN keywords TEXT;"
echo ""

