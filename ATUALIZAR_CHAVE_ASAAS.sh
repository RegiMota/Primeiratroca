#!/bin/bash

echo "🔧 Atualizando Chave do Asaas"
echo "=============================="
echo ""

cd /root/Primeiratroca || exit 1

# Nova chave fornecida
NOVA_CHAVE="$1"

if [ -z "$NOVA_CHAVE" ]; then
    echo "❌ Erro: Chave não fornecida!"
    echo ""
    echo "💡 Uso:"
    echo "   ./ATUALIZAR_CHAVE_ASAAS.sh '\$aact_SUA_CHAVE_COMPLETA_AQUI'"
    echo ""
    echo "   OU edite manualmente:"
    echo "   nano .env"
    echo "   # Edite a linha: ASAAS_API_KEY='\$aact_SUA_CHAVE'"
    exit 1
fi

echo "1️⃣ Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "2️⃣ Verificando formato da nova chave..."
if [[ ! "$NOVA_CHAVE" =~ ^\$aact_ ]]; then
    echo "⚠️  ATENÇÃO: A chave não começa com \$aact_"
    echo "   Verifique se copiou a chave completa"
    read -p "   Continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

KEY_LENGTH=${#NOVA_CHAVE}
echo "   Tamanho da chave: $KEY_LENGTH caracteres"

if [ $KEY_LENGTH -lt 50 ]; then
    echo "⚠️  ATENÇÃO: Chave parece muito curta!"
    read -p "   Continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi
echo ""

echo "3️⃣ Atualizando .env..."
# Atualizar ou adicionar ASAAS_API_KEY
if grep -q "^ASAAS_API_KEY" .env; then
    # Escapar caracteres especiais para sed
    ESCAPED_KEY=$(echo "$NOVA_CHAVE" | sed 's/[[\.*^$()+?{|]/\\&/g')
    sed -i "s|^ASAAS_API_KEY=.*|ASAAS_API_KEY='$ESCAPED_KEY'|" .env
    echo "✅ ASAAS_API_KEY atualizado"
else
    echo "" >> .env
    echo "# Asaas API Key" >> .env
    echo "ASAAS_API_KEY='$NOVA_CHAVE'" >> .env
    echo "✅ ASAAS_API_KEY adicionado"
fi
echo ""

echo "4️⃣ Verificando se foi salvo corretamente..."
VERIFICAR_CHAVE=$(grep "^ASAAS_API_KEY" .env | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')

if [ "$VERIFICAR_CHAVE" = "$NOVA_CHAVE" ]; then
    echo "✅ Chave salva corretamente"
else
    echo "⚠️  A chave salva pode estar diferente"
    echo "   Verifique manualmente: nano .env"
fi
echo ""

echo "5️⃣ Reiniciando backend..."
docker-compose restart backend
echo ""

echo "6️⃣ Aguardando backend iniciar (15 segundos)..."
sleep 15
echo ""

echo "7️⃣ Verificando se backend está rodando..."
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend não está rodando!"
    echo "   Verifique os logs: docker-compose logs backend"
    exit 1
fi
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
console.log('Chave (primeiros 15 chars):', apiKey ? apiKey.substring(0, 15) + '...' : 'NÃO ENCONTRADO');
console.log('Tamanho da chave:', apiKey ? apiKey.length : 0);
console.log('');

if (!apiKey) {
    console.log('❌ ERRO: API Key não encontrada no backend!');
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
    console.log('✅ SUCESSO! Conexão com Asaas funcionando!');
    console.log('Status:', response.status);
    console.log('');
    console.log('🎉 A chave está correta e funcionando!');
    process.exit(0);
})
.catch(error => {
    if (error.response) {
        console.log('❌ ERRO na resposta do Asaas:');
        console.log('Status:', error.response.status);
        const errorMsg = error.response.data?.message || 
                        error.response.data?.errors?.[0]?.description || 
                        JSON.stringify(error.response.data);
        console.log('Mensagem:', errorMsg);
        process.exit(1);
    } else {
        console.log('❌ ERRO: Não foi possível conectar ao Asaas');
        process.exit(1);
    }
});
" 2>&1)

echo "$TEST_RESULT"
echo ""

if echo "$TEST_RESULT" | grep -q "SUCESSO"; then
    echo "===================================="
    echo "✅ CHAVE ATUALIZADA E FUNCIONANDO!"
    echo ""
    echo "🎉 Tudo configurado corretamente!"
    echo "   Você pode testar pagamentos PIX agora."
else
    echo "===================================="
    echo "❌ AINDA HÁ PROBLEMAS"
    echo ""
    echo "Verifique:"
    echo "   1. A chave foi copiada completamente?"
    echo "   2. O ambiente está correto (sandbox/production)?"
    echo "   3. A chave está habilitada no painel do Asaas?"
fi

