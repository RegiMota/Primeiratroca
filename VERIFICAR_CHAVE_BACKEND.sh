#!/bin/bash

echo "🔍 Verificando se Backend está Lendo a Chave Corretamente"
echo "=========================================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando chave no .env..."
ENV_KEY=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')
ENV_KEY_LENGTH=${#ENV_KEY}
echo "   Tamanho: $ENV_KEY_LENGTH caracteres"
echo "   Primeiros 15: ${ENV_KEY:0:15}..."
echo ""

echo "2️⃣ Verificando se backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend não está rodando!"
    echo "   Iniciando backend..."
    docker-compose up -d backend
    echo "   Aguardando 20 segundos..."
    sleep 20
fi
echo "✅ Backend está rodando"
echo ""

echo "3️⃣ Lendo chave do backend..."
BACKEND_KEY=$(docker-compose exec -T backend node -e "
const key = process.env.ASAAS_API_KEY || '';
console.log(key);
" 2>/dev/null | tr -d '\r' | tr -d '\n' | tr -d ' ')

if [ -z "$BACKEND_KEY" ]; then
    echo "❌ Backend NÃO está conseguindo ler a chave!"
    echo ""
    echo "🔧 Possíveis causas:"
    echo "   1. O .env não está sendo carregado pelo docker-compose"
    echo "   2. A chave está vazia no .env"
    echo "   3. O backend precisa ser reconstruído"
    echo ""
    echo "💡 Soluções:"
    echo "   1. Verifique se docker-compose.yml tem 'env_file: .env'"
    echo "   2. Verifique se a chave está no .env: grep ASAAS_API_KEY .env"
    echo "   3. Reconstrua o backend: docker-compose up -d --build backend"
    exit 1
fi

BACKEND_KEY_LENGTH=${#BACKEND_KEY}
echo "   Tamanho: $BACKEND_KEY_LENGTH caracteres"
echo "   Primeiros 15: ${BACKEND_KEY:0:15}..."
echo ""

echo "4️⃣ Comparando chaves..."
if [ "$ENV_KEY" = "$BACKEND_KEY" ]; then
    echo "✅ Chaves são idênticas!"
else
    echo "❌ Chaves são DIFERENTES!"
    echo "   .env:     ${ENV_KEY:0:20}... ($ENV_KEY_LENGTH chars)"
    echo "   Backend:  ${BACKEND_KEY:0:20}... ($BACKEND_KEY_LENGTH chars)"
    echo ""
    echo "💡 O backend está usando uma chave antiga!"
    echo "   Solução: docker-compose restart backend"
    echo "   OU: docker-compose up -d --build backend"
    exit 1
fi
echo ""

echo "5️⃣ Verificando logs do backend para erros de Asaas..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs backend 2>/dev/null | grep -i -E "(asaas|api.*key|401|unauthorized)" | tail -10 || echo "   Nenhum log relevante encontrado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "6️⃣ Testando conexão direta..."
TEST_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;
const env = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const baseUrl = env === 'production' 
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

console.log('🧪 Testando conexão...');
console.log('Ambiente:', env);
console.log('Base URL:', baseUrl);
console.log('Chave (primeiros 15):', apiKey ? apiKey.substring(0, 15) + '...' : 'NÃO ENCONTRADO');
console.log('Tamanho:', apiKey ? apiKey.length : 0);
console.log('');

if (!apiKey) {
    console.log('❌ ERRO: Chave não encontrada!');
    process.exit(1);
}

// Verificar se a chave começa corretamente
if (!apiKey.startsWith('\$aact_')) {
    console.log('❌ ERRO: Chave não começa com \$aact_');
    console.log('   Primeiros 10 chars:', apiKey.substring(0, 10));
    process.exit(1);
}

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
                        JSON.stringify(error.response.data);
        console.log('Mensagem:', errorMsg);
        
        if (error.response.status === 401) {
            console.log('');
            console.log('💡 Erro 401 = Chave inválida');
            console.log('   Verifique:');
            console.log('   1. A chave está correta no painel do Asaas?');
            console.log('   2. A chave corresponde ao ambiente (sandbox/production)?');
            console.log('   3. A chave foi copiada completamente?');
        }
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
    echo "✅ TUDO FUNCIONANDO!"
    echo ""
    echo "A chave está correta e o backend consegue se conectar ao Asaas."
else
    echo "===================================="
    echo "❌ AINDA HÁ PROBLEMAS"
    echo ""
    echo "Siga as instruções acima para corrigir."
fi

