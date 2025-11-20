#!/bin/bash

echo "🔧 Corrigindo Chave do Asaas - Solução Final"
echo "============================================="
echo ""

cd /root/Primeiratroca || exit 1

# Nova chave completa
NOVA_CHAVE='$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjAwODdhZmU5LTc1YTktNDA1ZS04YjJiLTA5YWEyOWEyYWEwYTo6JGFhY2hfMDQ3NTU5MjktNGEyNS00MTc0LTkzMzYtODc3NDFjNGQ1NmYz'

echo "1️⃣ Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "2️⃣ Verificando chave atual no .env..."
CHAVE_ATUAL=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')
CHAVE_ATUAL_LENGTH=${#CHAVE_ATUAL}

echo "   Chave atual: ${CHAVE_ATUAL:0:20}... ($CHAVE_ATUAL_LENGTH chars)"
echo "   Nova chave:  ${NOVA_CHAVE:0:20}... (${#NOVA_CHAVE} chars)"
echo ""

if [ "$CHAVE_ATUAL" = "$NOVA_CHAVE" ]; then
    echo "✅ Chave já está atualizada no .env"
else
    echo "⚠️  Chave precisa ser atualizada"
    echo ""
    echo "3️⃣ Atualizando chave no .env..."
    
    # Atualizar ou adicionar
    if grep -q "^ASAAS_API_KEY" .env; then
        # Escapar caracteres especiais para sed
        ESCAPED_KEY=$(echo "$NOVA_CHAVE" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "s|^ASAAS_API_KEY=.*|ASAAS_API_KEY='$ESCAPED_KEY'|" .env
        echo "✅ Chave atualizada"
    else
        echo "" >> .env
        echo "# Asaas API Key" >> .env
        echo "ASAAS_API_KEY='$NOVA_CHAVE'" >> .env
        echo "✅ Chave adicionada"
    fi
    
    # Verificar se foi salvo
    CHAVE_VERIFICAR=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')
    if [ "$CHAVE_VERIFICAR" = "$NOVA_CHAVE" ]; then
        echo "✅ Chave salva corretamente"
    else
        echo "❌ Erro ao salvar chave!"
        echo "   Edite manualmente: nano .env"
        exit 1
    fi
fi
echo ""

echo "4️⃣ Verificando ambiente..."
if ! grep -q "^ASAAS_ENVIRONMENT=sandbox" .env; then
    echo "⚠️  Ambiente não está como sandbox, corrigindo..."
    if grep -q "^ASAAS_ENVIRONMENT" .env; then
        sed -i "s/^ASAAS_ENVIRONMENT=.*/ASAAS_ENVIRONMENT=sandbox/" .env
    else
        echo "" >> .env
        echo "ASAAS_ENVIRONMENT=sandbox" >> .env
    fi
    echo "✅ Ambiente configurado como sandbox"
else
    echo "✅ Ambiente já está como sandbox"
fi
echo ""

echo "5️⃣ Exibindo configuração final..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "^ASAAS_" .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "6️⃣ PARANDO backend completamente..."
docker-compose stop backend
sleep 5
echo "✅ Backend parado"
echo ""

echo "7️⃣ Iniciando backend novamente..."
docker-compose up -d backend
echo "✅ Backend iniciado"
echo ""

echo "8️⃣ Aguardando backend iniciar completamente (30 segundos)..."
sleep 30
echo ""

echo "9️⃣ Verificando se backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend não está rodando!"
    echo "   Verifique os logs: docker-compose logs backend"
    exit 1
fi
echo "✅ Backend está rodando"
echo ""

echo "🔟 Verificando qual chave o backend está usando..."
BACKEND_KEY=$(docker-compose exec -T backend node -e "
const key = process.env.ASAAS_API_KEY || '';
console.log(key);
" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ -z "$BACKEND_KEY" ]; then
    echo "❌ Backend não está lendo a chave!"
    echo "   Reconstruindo backend..."
    docker-compose up -d --build backend
    sleep 30
    BACKEND_KEY=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_API_KEY || '')" 2>/dev/null | tr -d '\r' | tr -d '\n')
fi

BACKEND_KEY_LENGTH=${#BACKEND_KEY}
echo "   Chave no backend: ${BACKEND_KEY:0:20}... ($BACKEND_KEY_LENGTH chars)"
echo ""

if [ "$BACKEND_KEY" = "$NOVA_CHAVE" ]; then
    echo "✅ Backend está usando a chave CORRETA!"
else
    echo "❌ Backend ainda está usando chave INCORRETA!"
    echo ""
    echo "💡 Solução: Reconstruir backend completamente"
    echo "   docker-compose up -d --build --force-recreate backend"
    exit 1
fi
echo ""

echo "1️⃣1️⃣ Testando conexão com Asaas..."
TEST_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;
const baseUrl = 'https://sandbox.asaas.com/api/v3';

console.log('🧪 Testando conexão...');
console.log('Chave (primeiros 20):', apiKey ? apiKey.substring(0, 20) + '...' : 'NÃO ENCONTRADO');
console.log('Tamanho:', apiKey ? apiKey.length : 0);
console.log('');

axios.get(baseUrl + '/customers', {
    headers: {
        'access_token': apiKey.trim(),
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 15000
})
.then(response => {
    console.log('✅ SUCESSO! Conexão funcionando!');
    console.log('Status:', response.status);
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ ERRO:', error.response.status);
        const errorMsg = error.response.data?.message || 
                        error.response.data?.errors?.[0]?.description || 
                        'Erro desconhecido';
        console.log('Mensagem:', errorMsg);
    } else {
        console.log('❌ ERRO: Não foi possível conectar');
    }
    process.exit(1);
});
" 2>&1)

echo "$TEST_RESULT"
echo ""

if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "===================================="
    echo "✅ TUDO CORRIGIDO E FUNCIONANDO!"
    echo ""
    echo "🎉 A chave está correta e o backend consegue se conectar ao Asaas."
    echo "   Você pode testar pagamentos PIX agora!"
else
    echo "===================================="
    echo "❌ AINDA HÁ PROBLEMAS"
    echo ""
    echo "A chave foi atualizada, mas ainda não funciona."
    echo "Verifique:"
    echo "   1. A chave está correta no painel do Asaas Sandbox?"
    echo "   2. A chave não foi revogada?"
    echo "   3. Você está logado no painel correto (sandbox.asaas.com)?"
fi

