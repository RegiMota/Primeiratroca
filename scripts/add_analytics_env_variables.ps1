# Script para adicionar variáveis de ambiente do Google Analytics
# Versão 2.0 - Módulo 7: Analytics Avançado

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

# Variáveis do Módulo 7: Analytics Avançado (Google Analytics)
$analyticsVars = @"

# ============================================
# ANALYTICS AVANÇADO - Google Analytics (Módulo 7)
# ============================================
# Google Analytics 4 Measurement ID
# Obter em: https://analytics.google.com/
# Formato: G-XXXXXXXXXX
# 
# Para obter o Measurement ID:
# 1. Acesse: https://analytics.google.com/
# 2. Em "Administração" → "Fluxos de dados"
# 3. Clique em "Fluxo de dados web" (ou crie um novo)
# 4. Copie o Measurement ID (formato: G-XXXXXXXXXX)
#
# Deixar vazio para desenvolvimento (rastreamento desabilitado)
VITE_GA_MEASUREMENT_ID=

"@

# Verificar se já existe seção do Google Analytics
if ($content -match "ANALYTICS AVANÇADO - Google Analytics") {
    Write-Host "Variáveis do Google Analytics já existem no .env"
    Write-Host "Verifique manualmente se VITE_GA_MEASUREMENT_ID está configurado."
} else {
    # Adicionar variáveis ao final do arquivo
    Add-Content -Path $envFile -Value $analyticsVars
    Write-Host "Variáveis do Google Analytics adicionadas ao .env"
    Write-Host ""
    Write-Host "IMPORTANTE: Configure o Measurement ID:"
    Write-Host "   1. Acesse: https://analytics.google.com/"
    Write-Host "   2. Em 'Administração' → 'Fluxos de dados'"
    Write-Host "   3. Clique em 'Fluxo de dados web' (ou crie um novo)"
    Write-Host "   4. Copie o Measurement ID (formato: G-XXXXXXXXXX)"
    Write-Host "   5. Configure no .env: VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX"
    Write-Host ""
    Write-Host "Para desenvolvimento local, você pode deixar vazio:"
    Write-Host "   VITE_GA_MEASUREMENT_ID="
    Write-Host ""
    Write-Host "Consulte: CONFIGURACAO_VARIAVEIS_AMBIENTE.md"
}

