#!/bin/bash

echo "🔍 TESTANDO ROTA /api/auth/me"
echo "=============================="

# 1. Testar localmente (localhost:5000)
echo -e "\n1️⃣ Testando localmente (localhost:5000/api/auth/me):"
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:5000/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
echo "   $LOCAL_RESPONSE"

# 2. Testar via HTTPS (primeiratrocaecia.com.br)
echo -e "\n2️⃣ Testando via HTTPS (https://primeiratrocaecia.com.br/api/auth/me):"
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "Status: %{http_code}\n" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null)
echo "   $HTTPS_RESPONSE"

# 3. Testar com verbose para ver o que está acontecendo
echo -e "\n3️⃣ Testando com verbose (primeiros 30 caracteres da resposta):"
HTTPS_VERBOSE=$(curl -s -w "\nStatus: %{http_code}\n" "https://primeiratrocaecia.com.br/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null | head -c 200)
echo "$HTTPS_VERBOSE"

# 4. Verificar logs do Nginx para esta requisição
echo -e "\n4️⃣ Verificando logs do Nginx (últimas 10 linhas relacionadas a /api/auth/me):"
tail -n 50 /var/log/nginx/access.log | grep "/api/auth/me" | tail -n 5

# 5. Verificar se o backend está recebendo a requisição
echo -e "\n5️⃣ Verificando logs do backend (últimas 20 linhas):"
docker-compose logs backend --tail=20 | grep -E "auth/me|GET.*auth" | tail -n 5

# 6. Testar diretamente no container do backend
echo -e "\n6️⃣ Testando diretamente no container do backend:"
docker-compose exec backend curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:5000/api/auth/me" -H "Authorization: Bearer test" 2>/dev/null

echo -e "\n✅ Teste concluído!"
