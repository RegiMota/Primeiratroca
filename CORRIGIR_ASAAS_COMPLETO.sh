#!/bin/bash

echo "🔧 Corrigindo Configuração do Asaas - Solução Completa"
echo "======================================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "2️⃣ Verificando configuração atual..."
ASAAS_KEY_LINE=$(grep "^ASAAS_API_KEY" .env | head -1)

if [ -z "$ASAAS_KEY_LINE" ]; then
    echo "❌ ASAAS_API_KEY não encontrado no .env"
    echo ""
    echo "📝 Por favor, adicione sua chave do Asaas:"
    echo "   nano .env"
    echo "   # Adicione:"
    echo "   ASAAS_API_KEY='\$aact_SEU_TOKEN_AQUI'"
    exit 1
fi

echo "📋 Linha atual: $ASAAS_KEY_LINE"
echo ""

# Verificar se há duplicação (ASAAS_API_KEY=ASAAS_API_KEY=...)
if echo "$ASAAS_KEY_LINE" | grep -q "ASAAS_API_KEY=ASAAS_API_KEY="; then
    echo "⚠️  Detectado duplicação na chave! Corrigindo..."
    
    # Extrair apenas o valor (tudo após o último =)
    ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_LINE" | sed 's/.*=//' | tr -d '"' | tr -d "'")
    
    # Corrigir a linha
    sed -i "s|^ASAAS_API_KEY=.*|ASAAS_API_KEY='$ASAAS_KEY_VALUE'|" .env
    echo "✅ Duplicação removida"
else
    # Extrair o valor da chave
    ASAAS_KEY_VALUE=$(echo "$ASAAS_KEY_LINE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
    
    # Verificar se precisa adicionar aspas (se começar com $)
    if [[ "$ASAAS_KEY_VALUE" =~ ^\$ ]]; then
        # Verificar se já está entre aspas
        if ! echo "$ASAAS_KEY_LINE" | grep -q "^ASAAS_API_KEY='"; then
            echo "⚠️  Adicionando aspas simples para proteger o \$..."
            sed -i "s|^ASAAS_API_KEY=.*|ASAAS_API_KEY='$ASAAS_KEY_VALUE'|" .env
            echo "✅ Aspas adicionadas"
        fi
    fi
fi
echo ""

echo "3️⃣ Verificando formato final..."
FINAL_KEY_LINE=$(grep "^ASAAS_API_KEY" .env | head -1)
echo "📋 Linha corrigida: $FINAL_KEY_LINE"
echo ""

# Extrair valor final para verificação
FINAL_KEY_VALUE=$(echo "$FINAL_KEY_LINE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ')

if [[ "$FINAL_KEY_VALUE" =~ ^\$aact_ ]]; then
    KEY_LENGTH=${#FINAL_KEY_VALUE}
    echo "✅ Formato da chave parece correto"
    echo "   Prefixo: ${FINAL_KEY_VALUE:0:10}..."
    echo "   Tamanho: $KEY_LENGTH caracteres"
    
    if [ $KEY_LENGTH -lt 50 ]; then
        echo "⚠️  ATENÇÃO: Chave parece muito curta (deve ter pelo menos 50 caracteres)"
        echo "   Verifique se você copiou a chave completa do painel do Asaas"
    fi
else
    echo "⚠️  Formato da chave pode estar incorreto"
    echo "   Esperado: começar com \$aact_"
    echo "   Encontrado: ${FINAL_KEY_VALUE:0:20}..."
    echo ""
    echo "💡 Verifique se você copiou a chave completa do painel do Asaas"
fi
echo ""

echo "4️⃣ Verificando ASAAS_ENVIRONMENT..."
if ! grep -q "^ASAAS_ENVIRONMENT" .env; then
    echo "⚠️  ASAAS_ENVIRONMENT não encontrado, adicionando..."
    echo "" >> .env
    echo "# Asaas Environment" >> .env
    echo "ASAAS_ENVIRONMENT=production" >> .env
    echo "✅ ASAAS_ENVIRONMENT adicionado"
else
    ASAAS_ENV=$(grep "^ASAAS_ENVIRONMENT" .env | cut -d'=' -f2- | tr -d ' ')
    echo "✅ ASAAS_ENVIRONMENT: $ASAAS_ENV"
fi
echo ""

echo "5️⃣ Exibindo configuração final do Asaas no .env..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "^ASAAS_" .env | sed 's/\(.*=\).*\(.\{10\}\)$/\1\2.../'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "6️⃣ Reiniciando backend para aplicar mudanças..."
docker-compose restart backend
echo ""

echo "7️⃣ Aguardando backend iniciar (15 segundos)..."
sleep 15
echo ""

echo "8️⃣ Verificando se backend está rodando..."
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend não está rodando! Verifique os logs:"
    echo "   docker-compose logs backend"
    exit 1
fi
echo ""

echo "9️⃣ Verificando se backend consegue ler a chave..."
BACKEND_KEY=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_API_KEY ? 'ENCONTRADO' : 'NÃO ENCONTRADO')" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ "$BACKEND_KEY" = "ENCONTRADO" ]; then
    echo "✅ Backend está conseguindo ler a ASAAS_API_KEY"
else
    echo "❌ Backend NÃO está conseguindo ler a ASAAS_API_KEY"
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   1. Verifique se o .env está no diretório correto"
    echo "   2. Verifique se o docker-compose.yml tem 'env_file: .env'"
    echo "   3. Reconstrua o container: docker-compose up -d --build backend"
fi
echo ""

echo "🔟 Verificando logs do backend relacionados ao Asaas..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs backend 2>/dev/null | grep -i asaas | tail -10 || echo "   Nenhum log encontrado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "===================================="
echo "✅ Correção concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste um pagamento PIX novamente"
echo "   2. Se ainda houver erro, verifique:"
echo "      - A chave está correta no painel do Asaas?"
echo "      - O ambiente (sandbox/production) está correto?"
echo "      - A chave foi copiada completamente?"
echo ""
echo "💡 Para ver logs em tempo real:"
echo "   docker-compose logs -f backend | grep -i asaas"

