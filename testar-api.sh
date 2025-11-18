#!/bin/bash
# Script para testar a API e verificar logs

cd "$(dirname "$0")"

echo "🧪 Testando API..."
echo ""

# Testar API localmente
echo "1️⃣ Testando API localmente (HTTP):"
curl -v http://localhost:5000/api/health 2>&1 | head -20
echo ""
echo ""

# Testar API via Nginx (HTTP)
echo "2️⃣ Testando API via Nginx (HTTP):"
curl -v -H "Host: api.primeiratrocaecia.com.br" http://localhost/api/health 2>&1 | head -20
echo ""
echo ""

# Testar API via Nginx (HTTPS)
echo "3️⃣ Testando API via Nginx (HTTPS):"
curl -v -k https://localhost/api/health -H "Host: api.primeiratrocaecia.com.br" 2>&1 | head -20
echo ""
echo ""

# Verificar logs do Nginx
echo "4️⃣ Últimas linhas do log de erro do Nginx:"
tail -20 /var/log/nginx/error.log
echo ""
echo ""

# Verificar logs de acesso
echo "5️⃣ Últimas linhas do log de acesso do Nginx:"
tail -10 /var/log/nginx/access.log
echo ""
echo ""

# Verificar se o backend está rodando
echo "6️⃣ Status dos containers:"
docker-compose -f docker-compose.prod.yml ps backend
echo ""
echo ""

# Verificar logs do backend
echo "7️⃣ Últimas linhas dos logs do backend:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend | grep -E "(error|Error|ERROR|404|500)" || echo "Nenhum erro encontrado nos últimos logs"
echo ""

