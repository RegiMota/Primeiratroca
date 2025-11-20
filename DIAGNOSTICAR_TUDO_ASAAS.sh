#!/bin/bash

echo "🔍 Diagnóstico Completo - Asaas e Backend"
echo "=========================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando status dos containers..."
docker-compose ps
echo ""

echo "2️⃣ Verificando se backend está rodando..."
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend está rodando"
    BACKEND_UP=true
else
    echo "❌ Backend NÃO está rodando!"
    echo "   Tentando iniciar..."
    docker-compose up -d backend
    echo "   Aguardando 20 segundos..."
    sleep 20
    if docker-compose ps backend | grep -q "Up"; then
        echo "✅ Backend iniciado"
        BACKEND_UP=true
    else
        echo "❌ Backend não conseguiu iniciar!"
        echo "   Verifique os logs: docker-compose logs backend"
        BACKEND_UP=false
    fi
fi
echo ""

if [ "$BACKEND_UP" = false ]; then
    echo "❌ Não é possível continuar sem o backend rodando"
    exit 1
fi

echo "3️⃣ Verificando chave no .env..."
ENV_KEY=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')
if [ -z "$ENV_KEY" ]; then
    echo "❌ Chave não encontrada no .env!"
    exit 1
fi
echo "✅ Chave encontrada no .env"
echo "   Tamanho: ${#ENV_KEY} caracteres"
echo "   Primeiros 20: ${ENV_KEY:0:20}..."
echo ""

echo "4️⃣ Verificando se backend está lendo a chave..."
BACKEND_KEY=$(docker-compose exec -T backend node -e "
const key = process.env.ASAAS_API_KEY || '';
console.log(key);
" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ -z "$BACKEND_KEY" ]; then
    echo "❌ Backend NÃO está lendo a chave!"
    echo ""
    echo "💡 Solução: Reconstruir backend"
    echo "   docker-compose up -d --build backend"
    exit 1
fi

echo "✅ Backend está lendo a chave"
echo "   Tamanho: ${#BACKEND_KEY} caracteres"
echo "   Primeiros 20: ${BACKEND_KEY:0:20}..."
echo ""

echo "5️⃣ Comparando chaves..."
if [ "$ENV_KEY" = "$BACKEND_KEY" ]; then
    echo "✅ Chaves são idênticas"
else
    echo "❌ Chaves são DIFERENTES!"
    echo "   Backend precisa ser reiniciado ou reconstruído"
    echo ""
    echo "💡 Solução:"
    echo "   docker-compose restart backend"
    echo "   OU:"
    echo "   docker-compose up -d --build backend"
    exit 1
fi
echo ""

echo "6️⃣ Verificando ambiente..."
ENV_ENV=$(grep "^ASAAS_ENVIRONMENT" .env | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
BACKEND_ENV=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_ENVIRONMENT || 'sandbox')" 2>/dev/null | tr -d '\r' | tr -d '\n')

echo "   .env:    ${ENV_ENV:-sandbox}"
echo "   Backend: $BACKEND_ENV"
echo ""

echo "7️⃣ Verificando logs recentes do backend (últimas 20 linhas)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=20 backend 2>/dev/null | grep -i -E "(asaas|error|erro|401|unauthorized|chave)" || echo "   Nenhum log relevante encontrado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "8️⃣ Testando conexão com Asaas..."
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
console.log('Chave (primeiros 20):', apiKey ? apiKey.substring(0, 20) + '...' : 'NÃO ENCONTRADO');
console.log('Tamanho:', apiKey ? apiKey.length : 0);
console.log('');

if (!apiKey) {
    console.log('❌ ERRO: Chave não encontrada!');
    process.exit(1);
}

// Verificar formato
if (!apiKey.startsWith('\$aact_')) {
    console.log('❌ ERRO: Chave não começa com \$aact_');
    console.log('   Primeiros 10:', apiKey.substring(0, 10));
    process.exit(1);
}

console.log('✅ Formato da chave está correto');
console.log('');

// Testar conexão
axios.get(baseUrl + '/customers', {
    headers: {
        'access_token': apiKey.trim(),
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 15000
})
.then(response => {
    console.log('✅ SUCESSO! Conexão com Asaas funcionando!');
    console.log('Status:', response.status);
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ ERRO na resposta do Asaas:');
        console.log('Status:', error.response.status);
        const errorData = error.response.data || {};
        const errorMsg = errorData.message || 
                        errorData.errors?.[0]?.description || 
                        JSON.stringify(errorData);
        console.log('Mensagem:', errorMsg);
        
        if (error.response.status === 401) {
            console.log('');
            console.log('💡 Erro 401 = Chave inválida ou ambiente incorreto');
            console.log('');
            console.log('🔧 Verifique:');
            console.log('   1. A chave está correta no painel do Asaas?');
            console.log('   2. A chave corresponde ao ambiente (sandbox/production)?');
            console.log('   3. A chave foi copiada completamente?');
            console.log('   4. A chave não foi revogada no painel?');
        }
    } else if (error.request) {
        console.log('❌ ERRO: Não foi possível conectar ao Asaas');
        console.log('   Verifique sua conexão com a internet');
    } else {
        console.log('❌ ERRO:', error.message);
    }
    process.exit(1);
});
" 2>&1)

echo "$TEST_RESULT"
echo ""

echo "9️⃣ Verificando se backend está respondendo na porta 5000..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Backend está respondendo (HTTP $HTTP_CODE)"
else
    echo "❌ Backend NÃO está respondendo (HTTP $HTTP_CODE)"
    echo "   Verifique: docker-compose logs backend"
fi
echo ""

if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "===================================="
    echo "✅ TUDO FUNCIONANDO!"
    echo ""
    echo "A chave está correta e o backend consegue se conectar ao Asaas."
    echo "O problema pode estar em outro lugar. Verifique os logs durante um pagamento:"
    echo "   docker-compose logs -f backend | grep -i asaas"
else
    echo "===================================="
    echo "❌ PROBLEMA ENCONTRADO"
    echo ""
    echo "A chave não está funcionando. Siga as instruções acima."
fi

