#!/bin/bash

echo "🔧 Configurando Asaas para SANDBOX"
echo "==================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "2️⃣ Configurando ambiente para SANDBOX..."
# Atualizar ou adicionar ASAAS_ENVIRONMENT
if grep -q "^ASAAS_ENVIRONMENT" .env; then
    sed -i "s/^ASAAS_ENVIRONMENT=.*/ASAAS_ENVIRONMENT=sandbox/" .env
    echo "✅ ASAAS_ENVIRONMENT atualizado para sandbox"
else
    echo "" >> .env
    echo "# Asaas Environment" >> .env
    echo "ASAAS_ENVIRONMENT=sandbox" >> .env
    echo "✅ ASAAS_ENVIRONMENT adicionado como sandbox"
fi
echo ""

echo "3️⃣ Verificando configuração atual..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Configuração do Asaas no .env:"
grep "^ASAAS_" .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "4️⃣ Reiniciando backend para aplicar mudanças..."
docker-compose restart backend
echo ""

echo "5️⃣ Aguardando backend iniciar (15 segundos)..."
sleep 15
echo ""

echo "6️⃣ Verificando se backend está rodando..."
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend não está rodando! Verifique os logs:"
    echo "   docker-compose logs backend"
    exit 1
fi
echo ""

echo "7️⃣ Verificando configuração no backend..."
BACKEND_ENV=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_ENVIRONMENT || 'sandbox')" 2>/dev/null | tr -d '\r' | tr -d '\n')
BACKEND_KEY=$(docker-compose exec -T backend node -e "const k = process.env.ASAAS_API_KEY; console.log(k ? k.substring(0, 15) + '...' : 'NÃO ENCONTRADO')" 2>/dev/null | tr -d '\r' | tr -d '\n')

echo "   Ambiente: $BACKEND_ENV"
echo "   Chave (primeiros 15 chars): $BACKEND_KEY"
echo ""

if [ "$BACKEND_ENV" != "sandbox" ]; then
    echo "⚠️  Ambiente no backend não está como sandbox!"
    echo "   Reconstruindo backend..."
    docker-compose up -d --build backend
    sleep 20
else
    echo "✅ Ambiente configurado corretamente no backend"
fi
echo ""

echo "8️⃣ Testando conexão com Asaas SANDBOX..."
TEST_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;

console.log('Testando conexão com Asaas SANDBOX...');
console.log('Base URL: https://sandbox.asaas.com/api/v3');
console.log('API Key (primeiros 15 chars):', apiKey ? apiKey.substring(0, 15) + '...' : 'NÃO ENCONTRADO');

if (!apiKey) {
    console.log('❌ ERRO: API Key não encontrada');
    process.exit(1);
}

axios.get('https://sandbox.asaas.com/api/v3/customers', {
    headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 10000
})
.then(response => {
    console.log('✅ SUCESSO! Conexão com Asaas SANDBOX funcionando');
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
            console.log('💡 Erro 401 = Chave de API inválida');
            console.log('   Verifique se a chave está correta no painel do Asaas SANDBOX');
        }
    } else {
        console.log('❌ ERRO: Não foi possível conectar ao Asaas');
    }
    process.exit(1);
});
" 2>&1)

echo "$TEST_RESULT"
echo ""

if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "===================================="
    echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
    echo ""
    echo "📋 Resumo:"
    echo "   ✅ Ambiente: SANDBOX"
    echo "   ✅ Backend configurado"
    echo "   ✅ Conexão com Asaas funcionando"
    echo ""
    echo "🌐 URLs importantes:"
    echo "   - Painel Sandbox: https://sandbox.asaas.com"
    echo "   - API Sandbox: https://sandbox.asaas.com/api/v3"
    echo ""
    echo "🔗 Configurar Webhook no Asaas:"
    echo "   1. Acesse: https://sandbox.asaas.com"
    echo "   2. Vá em: Configurações > Integrações > Webhooks"
    echo "   3. Adicione a URL:"
    echo "      https://primeiratrocaecia.com.br/api/payments/webhook/asaas"
    echo "   4. Selecione os eventos:"
    echo "      - PAYMENT_RECEIVED"
    echo "      - PAYMENT_OVERDUE"
    echo "      - PAYMENT_DELETED"
    echo ""
    echo "💡 Agora você pode testar pagamentos PIX no site!"
else
    echo "===================================="
    echo "❌ PROBLEMA ENCONTRADO"
    echo ""
    echo "A conexão com Asaas SANDBOX falhou."
    echo "Verifique:"
    echo "   1. A chave está correta no painel do Asaas SANDBOX?"
    echo "   2. A chave foi copiada completamente?"
    echo "   3. A chave não foi revogada?"
    echo ""
    echo "🔗 Painel Sandbox: https://sandbox.asaas.com"
fi

