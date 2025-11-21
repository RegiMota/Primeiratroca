#!/bin/bash

echo "🔄 REINICIANDO BACKEND E VERIFICANDO STATUS"
echo "============================================"

# 1. Parar o backend
echo -e "\n1️⃣ Parando backend..."
docker-compose stop backend

# 2. Aguardar um pouco
sleep 3

# 3. Iniciar o backend
echo -e "\n2️⃣ Iniciando backend..."
docker-compose up -d backend

# 4. Aguardar o backend inicializar
echo -e "\n3️⃣ Aguardando backend inicializar (15 segundos)..."
sleep 15

# 5. Verificar status
echo -e "\n4️⃣ Verificando status do container:"
docker-compose ps backend

# 6. Verificar logs recentes
echo -e "\n5️⃣ Últimos 30 logs do backend:"
docker-compose logs backend --tail=30

# 7. Testar health check
echo -e "\n6️⃣ Testando health check:"
for i in {1..5}; do
    echo "   Tentativa $i/5..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ Backend está respondendo (Status: $STATUS)"
        break
    else
        echo "   ⏳ Aguardando... (Status: $STATUS)"
        sleep 3
    fi
done

# 8. Se ainda não estiver respondendo, mostrar mais logs
if [ "$STATUS" != "200" ]; then
    echo -e "\n⚠️  Backend ainda não está respondendo. Verificando logs de erro:"
    docker-compose logs backend --tail=50 | grep -i "error\|exception\|fatal\|crash" | tail -20
    echo -e "\n📋 Todos os logs recentes:"
    docker-compose logs backend --tail=50
fi

echo -e "\n✅ Processo concluído!"

