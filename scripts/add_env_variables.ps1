# Script para adicionar variáveis de ambiente do Módulo 8
# Versão 2.0 - Segurança Avançada

$envFile = ".env"

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado. Criando a partir de .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "Erro: .env.example não encontrado!"
        exit 1
    }
}

# Ler conteúdo atual
$content = Get-Content $envFile -Raw

# Variáveis do Módulo 8: Segurança Avançada
$securityVars = @"

# ============================================
# SEGURANÇA - reCAPTCHA (Módulo 8)
# ============================================
# Habilitar reCAPTCHA (true/false)
RECAPTCHA_ENABLED=false

# Chave secreta do Google reCAPTCHA
# Obtenha em: https://www.google.com/recaptcha/admin
RECAPTCHA_SECRET_KEY=

# Chave pública do reCAPTCHA (para frontend - opcional)
RECAPTCHA_SITE_KEY=

# Score mínimo para reCAPTCHA v3 (0.0 a 1.0)
# Recomendado: 0.5
RECAPTCHA_MIN_SCORE=0.5

# ============================================
# SEGURANÇA - ADMIN (Módulo 8)
# ============================================
# IP Whitelist para admin (opcional, separado por vírgula)
# Exemplo: ADMIN_IP_WHITELIST=192.168.1.100,192.168.1.101
ADMIN_IP_WHITELIST=

# ============================================
# JOBS AGENDADOS (Módulo 2)
# ============================================
# Habilitar jobs agendados (estoque, wishlist)
# Em desenvolvimento: ENABLE_JOBS=true
# Em produção: habilitado automaticamente
ENABLE_JOBS=true

"@

# Verificar se já existe seção de segurança
if ($content -match "SEGURANÇA - reCAPTCHA") {
    Write-Host "Variáveis de segurança já existem no .env"
    Write-Host "Verifique manualmente se todas as variáveis estão configuradas."
} else {
    # Adicionar variáveis ao final do arquivo
    Add-Content -Path $envFile -Value $securityVars
    Write-Host "Variáveis de segurança adicionadas ao .env"
    Write-Host ""
    Write-Host "IMPORTANTE: Configure as variáveis necessárias:"
    Write-Host "   - RECAPTCHA_SECRET_KEY (se usar reCAPTCHA)"
    Write-Host "   - RECAPTCHA_SITE_KEY (se usar reCAPTCHA)"
    Write-Host "   - ADMIN_IP_WHITELIST (opcional - para maior segurança)"
    Write-Host ""
    Write-Host "Consulte: CONFIGURACAO_VARIAVEIS_AMBIENTE.md"
}

