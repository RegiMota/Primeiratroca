#!/bin/bash

echo "🔧 Corrigindo Problema de reCAPTCHA no Login"
echo "============================================"
echo ""

cd /root/Primeiratroca || exit 1

echo "1️⃣ Verificando configuração atual do reCAPTCHA..."
if [ -f .env ]; then
    echo "📄 Arquivo .env encontrado"
    echo ""
    echo "Configurações atuais:"
    grep -E "RECAPTCHA|NODE_ENV" .env || echo "   (não encontrado)"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo ""
echo "2️⃣ Verificando se reCAPTCHA está causando o problema..."
echo ""

# Verificar se RECAPTCHA_ENABLED está como 'true'
if grep -q "RECAPTCHA_ENABLED=true" .env; then
    echo "⚠️  reCAPTCHA está HABILITADO"
    echo ""
    echo "💡 Solução: Desabilitar reCAPTCHA ou configurar corretamente"
    echo ""
    read -p "Deseja desabilitar o reCAPTCHA? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Desabilitar reCAPTCHA
        if grep -q "RECAPTCHA_ENABLED" .env; then
            sed -i 's/RECAPTCHA_ENABLED=true/RECAPTCHA_ENABLED=false/' .env
        else
            echo "RECAPTCHA_ENABLED=false" >> .env
        fi
        echo "✅ reCAPTCHA desabilitado"
    fi
else
    echo "✅ reCAPTCHA não está habilitado (ou não configurado)"
fi

echo ""
echo "3️⃣ Verificando NODE_ENV..."
if grep -q "NODE_ENV=production" .env; then
    echo "⚠️  NODE_ENV está como 'production'"
    echo "   Isso pode causar problemas se reCAPTCHA não estiver configurado"
    echo ""
    echo "💡 Recomendação: Se não usar reCAPTCHA, mantenha NODE_ENV=production"
    echo "   mas garanta que RECAPTCHA_ENABLED=false"
else
    echo "✅ NODE_ENV não está como 'production'"
fi

echo ""
echo "4️⃣ Aplicando correções..."
echo ""

# Garantir que RECAPTCHA_ENABLED está definido como false se não houver chave
if ! grep -q "RECAPTCHA_SECRET_KEY" .env || grep -q "RECAPTCHA_SECRET_KEY=$" .env || grep -q "^RECAPTCHA_SECRET_KEY=\s*$" .env; then
    echo "📝 RECAPTCHA_SECRET_KEY não configurado, desabilitando reCAPTCHA..."
    if grep -q "RECAPTCHA_ENABLED" .env; then
        sed -i 's/RECAPTCHA_ENABLED=.*/RECAPTCHA_ENABLED=false/' .env
    else
        echo "RECAPTCHA_ENABLED=false" >> .env
    fi
    echo "✅ reCAPTCHA desabilitado automaticamente"
fi

echo ""
echo "5️⃣ Reiniciando backend para aplicar mudanças..."
docker-compose restart backend

echo ""
echo "6️⃣ Aguardando backend iniciar..."
sleep 5

echo ""
echo "7️⃣ Testando login..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@primeiratroca.com.br","password":"admin"}' \
  2>&1 | head -5

echo ""
echo ""
echo "===================================="
echo "✅ Correção aplicada!"
echo ""
echo "📋 Configuração final:"
grep -E "RECAPTCHA|NODE_ENV" .env || echo "   (não encontrado)"
echo ""
echo "🧪 Teste o login novamente no navegador"

