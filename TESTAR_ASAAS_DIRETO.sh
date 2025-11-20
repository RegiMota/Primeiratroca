#!/bin/bash

echo "🧪 Testando Configuração do Asaas Diretamente"
echo "============================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando .env..."
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi
echo "✅ Arquivo .env encontrado"
echo ""

echo "2️⃣ Extraindo ASAAS_API_KEY do .env..."
# Pegar a linha completa e extrair o valor
ASAAS_KEY_LINE=$(grep "^ASAAS_API_KEY" .env | head -1)

if [ -z "$ASAAS_KEY_LINE" ]; then
    echo "❌ ASAAS_API_KEY não encontrado no .env"
    exit 1
fi

# Extrair valor (tudo após o primeiro =)
ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_LINE" | sed 's/^[^=]*=//' | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')

echo "📋 Linha completa: $ASAAS_KEY_LINE"
echo "📋 Valor extraído (primeiros 15 chars): ${ASAAS_KEY_VALUE:0:15}..."
echo "📋 Tamanho: ${#ASAAS_KEY_VALUE} caracteres"
echo ""

echo "3️⃣ Verificando formato..."
if [[ "$ASAAS_KEY_VALUE" =~ ^\$aact_ ]]; then
    echo "✅ Formato parece correto (começa com \$aact_)"
else
    echo "❌ Formato INCORRETO!"
    echo "   Esperado: começar com \$aact_"
    echo "   Encontrado: ${ASAAS_KEY_VALUE:0:20}..."
    echo ""
    echo "💡 A chave do Asaas deve começar com: \$aact_"
    echo "   Verifique se você copiou a chave completa do painel do Asaas"
    exit 1
fi
echo ""

echo "4️⃣ Verificando se backend está rodando..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Backend não está rodando!"
    echo "   Iniciando backend..."
    docker-compose up -d backend
    echo "   Aguardando 15 segundos..."
    sleep 15
fi
echo "✅ Backend está rodando"
echo ""

echo "5️⃣ Verificando se backend consegue ler a chave..."
echo "   Executando comando dentro do container..."
BACKEND_KEY_CHECK=$(docker-compose exec -T backend node -e "
const key = process.env.ASAAS_API_KEY;
if (!key) {
    console.log('NÃO_ENCONTRADO');
    process.exit(1);
}
console.log('ENCONTRADO');
console.log('Tamanho:', key.length);
console.log('Primeiros 15 chars:', key.substring(0, 15));
" 2>&1)

echo "$BACKEND_KEY_CHECK"
echo ""

if echo "$BACKEND_KEY_CHECK" | grep -q "NÃO_ENCONTRADO"; then
    echo "❌ Backend NÃO está conseguindo ler a ASAAS_API_KEY!"
    echo ""
    echo "🔧 Possíveis causas:"
    echo "   1. O .env não está sendo carregado pelo docker-compose"
    echo "   2. A chave está vazia ou incorreta no .env"
    echo "   3. O backend precisa ser reconstruído"
    echo ""
    echo "💡 Soluções:"
    echo "   1. Verifique docker-compose.yml tem 'env_file: .env'"
    echo "   2. Verifique se a chave está correta no .env"
    echo "   3. Reconstrua: docker-compose up -d --build backend"
    exit 1
fi

echo "6️⃣ Comparando chave do .env com chave do backend..."
BACKEND_KEY_FULL=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_API_KEY || '')" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ -z "$BACKEND_KEY_FULL" ]; then
    echo "❌ Não foi possível ler a chave do backend"
    exit 1
fi

# Comparar primeiros caracteres
ENV_PREFIX="${ASAAS_KEY_VALUE:0:20}"
BACKEND_PREFIX="${BACKEND_KEY_FULL:0:20}"

if [ "$ENV_PREFIX" = "$BACKEND_PREFIX" ]; then
    echo "✅ Chave do .env corresponde à chave do backend"
else
    echo "❌ Chave do .env NÃO corresponde à chave do backend!"
    echo "   .env:     ${ENV_PREFIX}..."
    echo "   Backend:  ${BACKEND_PREFIX}..."
    echo ""
    echo "💡 O backend pode estar usando uma chave antiga em cache"
    echo "   Solução: docker-compose restart backend"
    exit 1
fi
echo ""

echo "7️⃣ Verificando ASAAS_ENVIRONMENT..."
ASAAS_ENV=$(grep "^ASAAS_ENVIRONMENT" .env | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
BACKEND_ENV=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_ENVIRONMENT || 'sandbox')" 2>/dev/null | tr -d '\r' | tr -d '\n')

echo "   .env:    ${ASAAS_ENV:-sandbox}"
echo "   Backend: ${BACKEND_ENV}"
echo ""

if [ "$ASAAS_ENV" != "$BACKEND_ENV" ] && [ -n "$ASAAS_ENV" ]; then
    echo "⚠️  Ambiente diferente! Reiniciando backend..."
    docker-compose restart backend
    sleep 10
fi
echo ""

echo "8️⃣ Testando conexão com API do Asaas..."
echo "   Fazendo requisição de teste..."
TEST_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;
const env = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const baseUrl = env === 'production' 
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

console.log('Testando conexão com Asaas...');
console.log('Ambiente:', env);
console.log('Base URL:', baseUrl);
console.log('API Key (primeiros 15 chars):', apiKey ? apiKey.substring(0, 15) + '...' : 'NÃO ENCONTRADO');

if (!apiKey) {
    console.log('ERRO: API Key não encontrada');
    process.exit(1);
}

// Fazer requisição de teste (listar clientes - endpoint simples)
axios.get(baseUrl + '/customers', {
    headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
    },
    params: {
        limit: 1
    },
    timeout: 10000
})
.then(response => {
    console.log('✅ SUCESSO! Conexão com Asaas funcionando');
    console.log('Status:', response.status);
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ ERRO na resposta do Asaas:');
        console.log('Status:', error.response.status);
        console.log('Mensagem:', error.response.data?.message || error.response.data?.errors?.[0]?.description || 'Erro desconhecido');
        if (error.response.status === 401) {
            console.log('');
            console.log('💡 Erro 401 = Chave de API inválida ou expirada');
            console.log('   Verifique:');
            console.log('   1. A chave está correta no painel do Asaas?');
            console.log('   2. A chave está no ambiente correto (sandbox/production)?');
            console.log('   3. A chave foi copiada completamente?');
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

if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "===================================="
    echo "✅ TUDO FUNCIONANDO!"
    echo ""
    echo "A configuração do Asaas está correta."
    echo "Tente fazer um pagamento PIX novamente."
else
    echo "===================================="
    echo "❌ PROBLEMA ENCONTRADO"
    echo ""
    echo "A configuração do Asaas precisa ser corrigida."
    echo "Siga as instruções acima para corrigir."
fi

