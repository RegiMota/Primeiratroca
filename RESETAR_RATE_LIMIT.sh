#!/bin/bash

echo "🔄 RESETANDO RATE LIMIT E REINICIANDO BACKEND"
echo "============================================="

# 1. Verificar se o backend está rodando
echo -e "\n1️⃣ Verificando status do backend..."
if ! docker-compose ps backend | grep -q "Up"; then
    echo "   Backend não está rodando. Iniciando..."
    docker-compose up -d backend
    sleep 5
fi

# 2. Reiniciar backend para aplicar mudanças no rate limit
echo -e "\n2️⃣ Reiniciando backend para aplicar mudanças no rate limit..."
docker-compose restart backend

# 3. Aguardar backend inicializar
echo -e "\n3️⃣ Aguardando backend inicializar (10 segundos)..."
sleep 10

# 4. Verificar logs do backend
echo -e "\n4️⃣ Verificando logs do backend (últimas 20 linhas):"
docker-compose logs backend --tail=20

# 5. Testar health check
echo -e "\n5️⃣ Testando health check do backend:"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Backend está respondendo (Status: $HEALTH_STATUS)"
else
    echo "   ⚠️  Backend retornou Status: $HEALTH_STATUS"
fi

echo -e "\n✅ Processo concluído!"
echo ""
echo "📝 O rate limit de autenticação foi aumentado:"
echo "   - Produção: 20 tentativas por 15 minutos (antes: 5)"
echo "   - Desenvolvimento: 100 tentativas por 15 minutos"
echo ""
echo "💡 Se ainda receber 429, aguarde 15 minutos ou limpe o cache do navegador."

