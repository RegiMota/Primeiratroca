#!/bin/bash

echo "🧪 Testando Asaas em Ambos os Ambientes (Sandbox e Production)"
echo "================================================================"
echo ""

cd /root/Primeiratroca || exit 1

# Extrair chave do .env
ASAAS_KEY=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')

if [ -z "$ASAAS_KEY" ]; then
    echo "❌ ASAAS_API_KEY não encontrado no .env"
    exit 1
fi

echo "📋 Chave encontrada (primeiros 20 chars): ${ASAAS_KEY:0:20}..."
echo ""

echo "1️⃣ Testando em SANDBOX..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SANDBOX_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;

axios.get('https://sandbox.asaas.com/api/v3/customers', {
    headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 10000
})
.then(response => {
    console.log('✅ SANDBOX: SUCESSO!');
    console.log('Status:', response.status);
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ SANDBOX: ERRO');
        console.log('Status:', error.response.status);
        console.log('Mensagem:', error.response.data?.message || error.response.data?.errors?.[0]?.description || 'Erro desconhecido');
    } else {
        console.log('❌ SANDBOX: Erro de conexão');
    }
    process.exit(1);
});
" 2>&1)

echo "$SANDBOX_RESULT"
echo ""

SANDBOX_OK=false
if echo "$SANDBOX_RESULT" | grep -q "SUCESSO"; then
    SANDBOX_OK=true
    echo "✅ SANDBOX FUNCIONA!"
else
    echo "❌ SANDBOX NÃO FUNCIONA"
fi
echo ""

echo "2️⃣ Testando em PRODUCTION..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PROD_RESULT=$(docker-compose exec -T backend node -e "
const axios = require('axios');
const apiKey = process.env.ASAAS_API_KEY;

axios.get('https://www.asaas.com/api/v3/customers', {
    headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
    },
    params: { limit: 1 },
    timeout: 10000
})
.then(response => {
    console.log('✅ PRODUCTION: SUCESSO!');
    console.log('Status:', response.status);
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ PRODUCTION: ERRO');
        console.log('Status:', error.response.status);
        console.log('Mensagem:', error.response.data?.message || error.response.data?.errors?.[0]?.description || 'Erro desconhecido');
    } else {
        console.log('❌ PRODUCTION: Erro de conexão');
    }
    process.exit(1);
});
" 2>&1)

echo "$PROD_RESULT"
echo ""

PROD_OK=false
if echo "$PROD_RESULT" | grep -q "SUCESSO"; then
    PROD_OK=true
    echo "✅ PRODUCTION FUNCIONA!"
else
    echo "❌ PRODUCTION NÃO FUNCIONA"
fi
echo ""

echo "===================================="
echo "📊 RESULTADO:"
echo ""

if [ "$SANDBOX_OK" = true ] && [ "$PROD_OK" = false ]; then
    echo "✅ A chave funciona em SANDBOX"
    echo "❌ A chave NÃO funciona em PRODUCTION"
    echo ""
    echo "💡 SOLUÇÃO:"
    echo "   A chave que você tem é de SANDBOX (ambiente de testes)"
    echo "   Você precisa:"
    echo "   1. Mudar o ambiente para sandbox no .env:"
    echo "      ASAAS_ENVIRONMENT=sandbox"
    echo ""
    echo "   2. OU obter uma chave de PRODUCTION no painel do Asaas"
    echo ""
    echo "   Para corrigir agora (usar sandbox):"
    echo "   sed -i \"s/^ASAAS_ENVIRONMENT=.*/ASAAS_ENVIRONMENT=sandbox/\" .env"
    echo "   docker-compose restart backend"
    
elif [ "$SANDBOX_OK" = false ] && [ "$PROD_OK" = true ]; then
    echo "❌ A chave NÃO funciona em SANDBOX"
    echo "✅ A chave funciona em PRODUCTION"
    echo ""
    echo "💡 SOLUÇÃO:"
    echo "   A chave que você tem é de PRODUCTION"
    echo "   O ambiente já está configurado corretamente!"
    echo "   O problema pode ser outro. Verifique os logs do backend."
    
elif [ "$SANDBOX_OK" = true ] && [ "$PROD_OK" = true ]; then
    echo "✅ A chave funciona em AMBOS os ambientes!"
    echo "   Isso é incomum, mas significa que está tudo OK."
    
else
    echo "❌ A chave NÃO funciona em NENHUM ambiente"
    echo ""
    echo "💡 POSSÍVEIS CAUSAS:"
    echo "   1. A chave está incorreta ou incompleta"
    echo "   2. A chave foi revogada ou expirou"
    echo "   3. A chave foi copiada com caracteres faltando"
    echo ""
    echo "🔧 SOLUÇÃO:"
    echo "   1. Acesse o painel do Asaas:"
    echo "      - Sandbox: https://sandbox.asaas.com"
    echo "      - Production: https://www.asaas.com"
    echo ""
    echo "   2. Vá em: Configurações > Integrações > API"
    echo ""
    echo "   3. Copie a chave COMPLETA (começa com \$aact_)"
    echo ""
    echo "   4. Atualize no .env:"
    echo "      nano .env"
    echo "      # Edite a linha:"
    echo "      ASAAS_API_KEY='\$aact_SUA_CHAVE_COMPLETA_AQUI'"
    echo ""
    echo "   5. Reinicie o backend:"
    echo "      docker-compose restart backend"
fi

echo ""
echo "📋 Configuração atual no .env:"
grep "^ASAAS_" .env

