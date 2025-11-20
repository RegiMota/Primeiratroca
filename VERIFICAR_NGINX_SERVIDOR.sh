#!/bin/bash

echo "🔍 Verificando Configuração do Nginx"
echo "====================================="
echo ""

# Verificar arquivos existentes
echo "📋 Arquivos de configuração encontrados:"
ls -la /etc/nginx/conf.d/primeira-troca*.conf
echo ""

# Verificar conteúdo dos arquivos
echo "📄 Conteúdo de primeira-troca-api.conf:"
echo "----------------------------------------"
cat /etc/nginx/conf.d/primeira-troca-api.conf
echo ""
echo ""

echo "📄 Conteúdo de primeira-troca-frontend.conf:"
echo "----------------------------------------"
cat /etc/nginx/conf.d/primeira-troca-frontend.conf
echo ""
echo ""

# Verificar se nginx está rodando
echo "🔍 Status do Nginx:"
systemctl status nginx --no-pager | head -10
echo ""

# Verificar sintaxe
echo "🔍 Testando sintaxe do Nginx:"
nginx -t
echo ""

# Verificar se backend está acessível
echo "🔍 Testando se backend está acessível:"
curl -s http://localhost:5000/api/health | head -1
echo ""

# Verificar se frontend está acessível
echo "🔍 Testando se frontend está acessível:"
curl -s http://localhost:3000 | head -1
echo ""

echo "====================================="
echo "✅ Verificação concluída!"

