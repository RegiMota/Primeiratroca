#!/bin/bash

echo "🔍 TESTANDO ROTA /api/auth/me"
echo "============================="

# 1. Testar diretamente no backend (localhost)
echo -e "\n1️⃣ Testando diretamente no backend (localhost:5000):"
curl -v -H "Authorization: Bearer test" "http://localhost:5000/api/auth/me" 2>&1 | head -30

# 2. Verificar se a rota está registrada
echo -e "\n2️⃣ Verificando logs do backend para erros relacionados a /auth/me:"
docker-compose logs backend --tail=100 | grep -i "auth/me\|404\|not found" | tail -10

# 3. Testar health check
echo -e "\n3️⃣ Testando health check:"
curl -s "http://localhost:5000/api/health" | head -c 200
echo ""

# 4. Verificar configuração do Nginx (se aplicável)
echo -e "\n4️⃣ Verificando se há configuração do Nginx para /api/auth:"
if [ -f "/etc/nginx/sites-available/primeira-troca-api.conf" ]; then
    grep -A 5 "location /api" /etc/nginx/sites-available/primeira-troca-api.conf | head -20
else
    echo "   Arquivo de configuração do Nginx não encontrado"
fi

# 5. Testar outras rotas de auth
echo -e "\n5️⃣ Testando outras rotas de auth:"
echo "   - POST /api/auth/login (deve retornar 400 sem credenciais):"
curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST "http://localhost:5000/api/auth/login"

echo -e "\n✅ Teste concluído!"

