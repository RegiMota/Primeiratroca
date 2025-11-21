#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO DE ERRO 502 (Bad Gateway)"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado!"
    echo "Execute este script no diretório raiz do projeto."
    exit 1
fi

echo "1️⃣ Verificando status dos containers Docker..."
echo "--------------------------------------------"
docker-compose ps
echo ""

echo "2️⃣ Verificando se o backend está rodando..."
echo "--------------------------------------------"
BACKEND_STATUS=$(docker-compose ps backend | grep -c "Up")
if [ "$BACKEND_STATUS" -eq 0 ]; then
    echo "❌ Backend NÃO está rodando!"
    echo ""
    echo "3️⃣ Tentando iniciar o backend..."
    docker-compose up -d backend
    sleep 5
    echo ""
    echo "4️⃣ Verificando novamente..."
    docker-compose ps backend
else
    echo "✅ Backend está rodando"
fi
echo ""

echo "5️⃣ Verificando logs recentes do backend (últimas 20 linhas)..."
echo "--------------------------------------------"
docker-compose logs --tail=20 backend
echo ""

echo "6️⃣ Testando conexão direta com o backend (localhost:5000)..."
echo "--------------------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -q "200"; then
    echo "✅ Backend respondeu com sucesso!"
    curl -s http://localhost:5000/api/health | head -5
else
    echo "❌ Backend não está respondendo em localhost:5000"
    echo "   Tentando verificar se a porta está em uso..."
    netstat -tuln | grep 5000 || echo "   Porta 5000 não está em uso"
fi
echo ""

echo "7️⃣ Verificando status do Nginx..."
echo "--------------------------------------------"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
    echo ""
    echo "8️⃣ Verificando configuração do Nginx para /api/..."
    echo "--------------------------------------------"
    if grep -q "location /api/" /etc/nginx/sites-available/primeira-troca-frontend.conf 2>/dev/null; then
        echo "✅ Configuração /api/ encontrada no Nginx"
        grep -A 5 "location /api/" /etc/nginx/sites-available/primeira-troca-frontend.conf | head -10
    else
        echo "⚠️  Configuração /api/ não encontrada ou arquivo não existe"
    fi
else
    echo "❌ Nginx NÃO está rodando!"
    echo "   Tentando iniciar..."
    sudo systemctl start nginx
    sleep 2
    systemctl status nginx --no-pager | head -10
fi
echo ""

echo "9️⃣ Testando requisição via Nginx (https://primeiratrocaecia.com.br/api/health)..."
echo "--------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://primeiratrocaecia.com.br/api/health)
echo "Código HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Nginx está funcionando corretamente!"
elif [ "$HTTP_CODE" = "502" ]; then
    echo "❌ Erro 502: Nginx não consegue se comunicar com o backend"
    echo "   Verifique se o backend está rodando e acessível em localhost:5000"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Não foi possível conectar ao servidor"
else
    echo "⚠️  Resposta inesperada: $HTTP_CODE"
fi
echo ""

echo "🔟 Verificando variáveis de ambiente do backend..."
echo "--------------------------------------------"
docker-compose exec -T backend printenv | grep -E "(PORT|NODE_ENV|DATABASE_URL)" | head -5
echo ""

echo "=========================================="
echo "📋 RESUMO"
echo "=========================================="
echo ""
echo "Se o backend não estiver rodando, execute:"
echo "  docker-compose up -d backend"
echo ""
echo "Se o backend estiver com erro, verifique os logs:"
echo "  docker-compose logs -f backend"
echo ""
echo "Se o Nginx não estiver configurado corretamente, execute:"
echo "  sudo nano /etc/nginx/sites-available/primeira-troca-frontend.conf"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""

