#!/bin/bash

echo "🔍 Testando Chave do Asaas - Verificação Completa"
echo "=================================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Lendo chave do .env..."
ASAAS_KEY_LINE=$(grep "^ASAAS_API_KEY" .env | head -1)
ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_LINE" | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')

echo "📋 Chave completa:"
echo "$ASAAS_KEY_VALUE"
echo ""
echo "📊 Estatísticas:"
echo "   Tamanho: ${#ASAAS_KEY_VALUE} caracteres"
echo "   Primeiros 10: ${ASAAS_KEY_VALUE:0:10}"
echo "   Últimos 10: ${ASAAS_KEY_VALUE: -10}"
echo ""

echo "2️⃣ Verificando se há caracteres especiais ou problemas..."
# Verificar se há quebras de linha ou espaços
if echo "$ASAAS_KEY_VALUE" | grep -q "[[:space:]]"; then
    echo "⚠️  ATENÇÃO: A chave contém espaços ou quebras de linha!"
    echo "   Isso pode causar problemas. Removendo espaços..."
    ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_VALUE" | tr -d '[:space:]')
fi

# Verificar se começa corretamente
if [[ ! "$ASAAS_KEY_VALUE" =~ ^\$aact_ ]]; then
    echo "❌ ERRO: A chave não começa com \$aact_"
    exit 1
fi

echo "✅ Formato básico está correto"
echo ""

echo "3️⃣ Testando chave diretamente no backend..."
echo "   Executando teste de conexão..."
echo ""

TEST_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');

// Ler chave do .env diretamente (simular como o backend lê)
const apiKey = process.env.ASAAS_API_KEY;

console.log('🔍 Informações da chave:');
console.log('   Tamanho:', apiKey ? apiKey.length : 0);
console.log('   Primeiros 15 chars:', apiKey ? apiKey.substring(0, 15) : 'NÃO ENCONTRADO');
console.log('   Últimos 10 chars:', apiKey ? '...' + apiKey.substring(apiKey.length - 10) : 'NÃO ENCONTRADO');
console.log('   Contém espaços:', apiKey ? (apiKey.includes(' ') ? 'SIM ⚠️' : 'NÃO ✅') : 'N/A');
console.log('');

if (!apiKey) {
    console.log('❌ ERRO: API Key não encontrada no backend!');
    process.exit(1);
}

// Testar em SANDBOX
console.log('🧪 Testando em SANDBOX...');
axios.get('https://sandbox.asaas.com/api/v3/customers', {
    headers: {
        'access_token': apiKey.trim(), // Remover espaços se houver
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 15000
})
.then(response => {
    console.log('✅ SANDBOX: SUCESSO!');
    console.log('   Status:', response.status);
    console.log('');
    console.log('🎉 A chave está funcionando corretamente!');
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ SANDBOX: ERRO');
        console.log('   Status:', error.response.status);
        const errorMsg = error.response.data?.message || 
                        error.response.data?.errors?.[0]?.description || 
                        JSON.stringify(error.response.data);
        console.log('   Mensagem:', errorMsg);
        console.log('');
        
        if (error.response.status === 401) {
            console.log('💡 Erro 401 = Chave inválida');
            console.log('');
            console.log('🔧 Possíveis soluções:');
            console.log('   1. Verifique se a chave está correta no painel do Asaas Sandbox');
            console.log('   2. Certifique-se de que copiou a chave COMPLETA');
            console.log('   3. Gere uma nova chave no painel do Asaas');
            console.log('   4. Verifique se está logado no painel correto (sandbox.asaas.com)');
            console.log('');
            console.log('📋 Para gerar nova chave:');
            console.log('   1. Acesse: https://sandbox.asaas.com');
            console.log('   2. Vá em: Configurações > Integrações > API');
            console.log('   3. Revogue a chave antiga (se necessário)');
            console.log('   4. Gere uma nova chave');
            console.log('   5. Copie a chave COMPLETA');
            console.log('   6. Atualize no .env:');
            console.log('      nano .env');
            console.log('      # Edite: ASAAS_API_KEY=\"'\$aact_NOVA_CHAVE_AQUI'\"');
            console.log('   7. Reinicie: docker-compose restart backend');
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

echo "===================================="
if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "✅ CHAVE FUNCIONANDO!"
    echo ""
    echo "A configuração está correta. Você pode testar pagamentos agora."
else
    echo "❌ CHAVE NÃO FUNCIONA"
    echo ""
    echo "A chave precisa ser atualizada. Siga as instruções acima."
fi

