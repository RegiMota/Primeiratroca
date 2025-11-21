#!/bin/bash

echo "🔨 RECONSTRUINDO BACKEND COMPLETO"
echo "================================="

# 1. Parar backend
echo -e "\n1️⃣ Parando backend..."
docker-compose stop backend

# 2. Remover container do backend
echo -e "\n2️⃣ Removendo container do backend..."
docker-compose rm -f backend

# 3. Reconstruir imagem do backend (sem cache)
echo -e "\n3️⃣ Reconstruindo imagem do backend..."
docker-compose build --no-cache backend

# 4. Iniciar backend
echo -e "\n4️⃣ Iniciando backend..."
docker-compose up -d backend

# 5. Aguardar inicialização
echo -e "\n5️⃣ Aguardando backend inicializar (30 segundos)..."
sleep 30

# 6. Verificar logs
echo -e "\n6️⃣ Verificando logs do backend:"
docker-compose logs backend --tail=50

# 7. Testar endpoint
echo -e "\n7️⃣ Testando endpoint /api/products?featured=true&limit=1:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/products?featured=true&limit=1" 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo "   ✅ Endpoint OK (Status: $RESPONSE)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $RESPONSE)"
        sleep 5
    fi
done

echo -e "\n✅ Reconstrução concluída!"

