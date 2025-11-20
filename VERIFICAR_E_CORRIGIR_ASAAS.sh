#!/bin/bash

echo "🔍 Verificando e Corrigindo Configuração do Asaas"
echo "=================================================="
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi
echo "✅ Arquivo .env encontrado"
echo ""

echo "2️⃣ Verificando ASAAS_API_KEY no .env..."
ASAAS_KEY=$(grep "^ASAAS_API_KEY" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$ASAAS_KEY" ]; then
    echo "❌ ASAAS_API_KEY não encontrado no .env"
    echo ""
    echo "📝 Por favor, adicione sua chave do Asaas no .env:"
    echo "   ASAAS_API_KEY='\$aact_SEU_TOKEN_AQUI'"
    echo ""
    exit 1
fi

echo "✅ ASAAS_API_KEY encontrado"
echo ""

echo "3️⃣ Verificando formato da chave..."
# Remover espaços e quebras de linha
ASAAS_KEY=$(echo "$ASAAS_KEY" | tr -d ' ' | tr -d '\n' | tr -d '\r')

# Verificar se começa com $aact_ (produção) ou $aact_Y (sandbox)
if [[ "$ASAAS_KEY" =~ ^\$aact_ ]]; then
    echo "✅ Formato da chave parece correto (começa com \$aact_)"
    KEY_LENGTH=${#ASAAS_KEY}
    echo "   Tamanho da chave: $KEY_LENGTH caracteres"
    
    if [ $KEY_LENGTH -lt 50 ]; then
        echo "⚠️  Chave parece muito curta (deve ter pelo menos 50 caracteres)"
    fi
else
    echo "⚠️  Formato da chave pode estar incorreto"
    echo "   Esperado: começar com \$aact_"
    echo "   Encontrado: ${ASAAS_KEY:0:10}..."
fi
echo ""

echo "4️⃣ Verificando ASAAS_ENVIRONMENT..."
ASAAS_ENV=$(grep "^ASAAS_ENVIRONMENT" .env | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")

if [ -z "$ASAAS_ENV" ]; then
    echo "⚠️  ASAAS_ENVIRONMENT não encontrado, usando 'production' como padrão"
    ASAAS_ENV="production"
else
    echo "✅ ASAAS_ENVIRONMENT: $ASAAS_ENV"
fi
echo ""

echo "5️⃣ Verificando se a chave está sendo lida pelo backend..."
echo "   Aguardando 5 segundos para backend processar..."
sleep 5

# Verificar logs do backend
echo ""
echo "📋 Últimas linhas dos logs do backend relacionadas ao Asaas:"
docker-compose logs backend 2>/dev/null | grep -i asaas | tail -5 || echo "   Nenhum log encontrado"
echo ""

echo "6️⃣ Testando se o backend consegue acessar a chave..."
# Executar comando dentro do container para verificar
BACKEND_KEY=$(docker-compose exec -T backend node -e "console.log(process.env.ASAAS_API_KEY || 'NÃO ENCONTRADO')" 2>/dev/null | tr -d '\r' | tr -d '\n')

if [ -z "$BACKEND_KEY" ] || [ "$BACKEND_KEY" = "NÃO ENCONTRADO" ]; then
    echo "❌ Backend NÃO está conseguindo ler a ASAAS_API_KEY!"
    echo ""
    echo "🔧 Possíveis causas:"
    echo "   1. A chave não está no .env"
    echo "   2. O .env não está sendo carregado pelo docker-compose"
    echo "   3. A chave tem caracteres especiais que precisam ser escapados"
    echo ""
    echo "💡 Solução:"
    echo "   1. Verifique se o docker-compose.yml tem 'env_file: .env' no serviço backend"
    echo "   2. Certifique-se de que a chave está entre aspas simples no .env:"
    echo "      ASAAS_API_KEY='\$aact_SEU_TOKEN'"
    echo "   3. Reinicie o backend: docker-compose restart backend"
else
    # Comparar apenas os primeiros caracteres para não expor a chave completa
    KEY_PREFIX="${BACKEND_KEY:0:10}"
    EXPECTED_PREFIX="${ASAAS_KEY:0:10}"
    
    if [ "$KEY_PREFIX" = "$EXPECTED_PREFIX" ]; then
        echo "✅ Backend está conseguindo ler a chave corretamente"
        echo "   Primeiros caracteres: ${KEY_PREFIX}..."
    else
        echo "⚠️  Backend está lendo uma chave diferente"
        echo "   Esperado: ${EXPECTED_PREFIX}..."
        echo "   Lido pelo backend: ${KEY_PREFIX}..."
    fi
fi
echo ""

echo "7️⃣ Verificando docker-compose.yml..."
if grep -q "env_file:" docker-compose.yml && grep -q "\.env" docker-compose.yml; then
    echo "✅ docker-compose.yml está configurado para carregar .env"
else
    echo "⚠️  docker-compose.yml pode não estar carregando .env corretamente"
    echo "   Verifique se há 'env_file: .env' no serviço backend"
fi
echo ""

echo "8️⃣ Sugestões de correção..."
echo ""
echo "Se a chave não estiver sendo lida corretamente:"
echo ""
echo "Opção 1: Editar .env manualmente"
echo "   nano .env"
echo "   # Certifique-se de que está assim:"
echo "   ASAAS_API_KEY='\$aact_SEU_TOKEN_COMPLETO_AQUI'"
echo "   ASAAS_ENVIRONMENT=production"
echo ""
echo "Opção 2: Usar sed para corrigir (se a chave estiver duplicada)"
echo "   sed -i \"s/ASAAS_API_KEY=ASAAS_API_KEY=/ASAAS_API_KEY=/\" .env"
echo ""
echo "Opção 3: Reiniciar backend após corrigir"
echo "   docker-compose restart backend"
echo "   sleep 10"
echo "   docker-compose logs backend | grep -i asaas"
echo ""

echo "===================================="
echo "✅ Verificação concluída!"
echo ""
echo "💡 Se ainda houver erro, verifique:"
echo "   1. A chave está correta no painel do Asaas"
echo "   2. O ambiente (sandbox/production) está correto"
echo "   3. O backend foi reiniciado após alterar o .env"

