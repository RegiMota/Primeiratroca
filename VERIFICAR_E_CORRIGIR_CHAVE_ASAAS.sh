#!/bin/bash

echo "🔍 Verificando e Corrigindo Chave do Asaas"
echo "=========================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando chave atual no .env..."
ASAAS_KEY_LINE=$(grep "^ASAAS_API_KEY" .env | head -1)

if [ -z "$ASAAS_KEY_LINE" ]; then
    echo "❌ ASAAS_API_KEY não encontrado no .env"
    exit 1
fi

echo "📋 Linha atual:"
echo "$ASAAS_KEY_LINE"
echo ""

# Extrair valor
ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_LINE" | sed "s/^[^=]*=//" | sed "s/^['\"]//" | sed "s/['\"]$//" | tr -d ' ')

echo "📋 Valor extraído:"
echo "   Primeiros 20 chars: ${ASAAS_KEY_VALUE:0:20}..."
echo "   Últimos 10 chars: ...${ASAAS_KEY_VALUE: -10}"
echo "   Tamanho total: ${#ASAAS_KEY_VALUE} caracteres"
echo ""

echo "2️⃣ Verificando formato..."
if [[ ! "$ASAAS_KEY_VALUE" =~ ^\$aact_ ]]; then
    echo "❌ Formato INCORRETO!"
    echo "   A chave deve começar com: \$aact_"
    echo "   Encontrado: ${ASAAS_KEY_VALUE:0:10}..."
    echo ""
    echo "💡 A chave do Asaas sempre começa com: \$aact_"
    exit 1
fi

echo "✅ Formato parece correto (começa com \$aact_)"
echo ""

echo "3️⃣ Verificando tamanho..."
# Chaves do Asaas geralmente têm entre 50-100 caracteres
if [ ${#ASAAS_KEY_VALUE} -lt 50 ]; then
    echo "⚠️  ATENÇÃO: Chave parece muito curta!"
    echo "   Tamanho: ${#ASAAS_KEY_VALUE} caracteres"
    echo "   Chaves do Asaas geralmente têm 50-100 caracteres"
    echo ""
    echo "💡 Possível problema: A chave pode estar incompleta"
    echo "   Verifique se você copiou a chave COMPLETA do painel do Asaas"
    echo ""
fi

echo "4️⃣ Exibindo chave completa (para verificação manual)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ASAAS_KEY_VALUE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "5️⃣ Instruções para obter a chave correta:"
echo ""
echo "📋 Para SANDBOX (ambiente de testes):"
echo "   1. Acesse: https://sandbox.asaas.com"
echo "   2. Faça login na sua conta"
echo "   3. Vá em: Configurações > Integrações > API"
echo "   4. Copie a chave COMPLETA (começa com \$aact_)"
echo "   5. A chave deve ter pelo menos 50 caracteres"
echo ""
echo "📋 Para PRODUCTION:"
echo "   1. Acesse: https://www.asaas.com"
echo "   2. Faça login na sua conta"
echo "   3. Vá em: Configurações > Integrações > API"
echo "   4. Copie a chave COMPLETA (começa com \$aact_)"
echo ""
echo "6️⃣ Como atualizar a chave:"
echo ""
echo "   Opção 1: Editar manualmente"
echo "   nano .env"
echo "   # Edite a linha ASAAS_API_KEY com a chave completa"
echo "   # Certifique-se de usar aspas simples:"
echo "   ASAAS_API_KEY='\$aact_SUA_CHAVE_COMPLETA_AQUI'"
echo ""
echo "   Opção 2: Usar este comando (substitua SUA_CHAVE_AQUI):"
echo "   sed -i \"s|^ASAAS_API_KEY=.*|ASAAS_API_KEY='\$aact_SUA_CHAVE_AQUI'|\" .env"
echo ""
echo "7️⃣ Depois de atualizar:"
echo "   docker-compose restart backend"
echo "   sleep 10"
echo "   ./TESTAR_ASAAS_DIRETO.sh"
echo ""

echo "===================================="
echo "📝 RESUMO:"
echo ""
echo "   Chave atual: ${ASAAS_KEY_VALUE:0:20}... (${#ASAAS_KEY_VALUE} chars)"
echo "   Ambiente: $(grep "^ASAAS_ENVIRONMENT" .env | cut -d'=' -f2- | tr -d ' ' || echo 'sandbox')"
echo ""
echo "💡 Se a chave estiver correta mas ainda der erro:"
echo "   1. Verifique se você está logado no painel correto (sandbox vs production)"
echo "   2. Verifique se a chave não foi revogada"
echo "   3. Gere uma nova chave no painel do Asaas"
echo "   4. Certifique-se de copiar TODA a chave (sem cortar no meio)"

