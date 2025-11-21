#!/bin/bash

echo "🔍 VERIFICANDO E AGUARDANDO BACKEND"
echo "===================================="

# 1. Verificar status do container
echo -e "\n1️⃣ Status do container backend:"
docker-compose ps backend

# 2. Aguardar mais tempo para o backend inicializar completamente
echo -e "\n2️⃣ Aguardando backend inicializar completamente (30 segundos)..."
sleep 30

# 3. Verificar logs recentes
echo -e "\n3️⃣ Últimos 50 logs do backend:"
docker-compose logs backend --tail=50

# 4. Verificar se há erros relacionados a categories
echo -e "\n4️⃣ Buscando erros relacionados a 'categories':"
docker-compose logs backend --tail=100 | grep -i "categories\|error\|unknown field" | tail -20

# 5. Testar health check
echo -e "\n5️⃣ Testando health check:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/health" 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Health check OK (Status: $RESPONSE)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $RESPONSE)"
        sleep 5
    fi
done

# 6. Testar endpoint de produtos
echo -e "\n6️⃣ Testando endpoint /api/products?featured=true&limit=1:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?featured=true&limit=1" 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Endpoint OK (Status: $RESPONSE)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $RESPONSE)"
        if [ "$RESPONSE" != "000" ]; then
            echo "   📋 Resposta do servidor:"
            curl -s "http://localhost:5000/api/products?featured=true&limit=1" | head -c 200
            echo ""
        fi
        sleep 5
    fi
done

echo -e "\n✅ Verificação concluída!"

