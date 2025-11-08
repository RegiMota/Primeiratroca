# Script para adicionar variáveis de ambiente do Módulo 3
# Versão 2.0 - Sistema de Frete e Entregas (Correios)

$envFile = ".env"

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado. Criando novo arquivo..." -ForegroundColor Yellow
    
    # Criar arquivo .env básico
    $basicContent = @"
# ============================================
# CONFIGURAÇÃO BÁSICA
# ============================================
# Banco de dados
DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"

# JWT Secret (gerar uma chave segura)
# Execute: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=

# Porta do servidor
PORT=5000

# Ambiente
NODE_ENV=development

"@
    Set-Content -Path $envFile -Value $basicContent
    Write-Host "Arquivo .env criado com configurações básicas." -ForegroundColor Green
}

# Ler conteúdo atual
$content = Get-Content $envFile -Raw

# Variáveis do Módulo 3: Correios (Frete e Rastreamento)
$correiosVars = @"

# ============================================
# CORREIOS - FRETE E RASTREAMENTO (Módulo 3)
# ============================================
# Habilitar API dos Correios (true/false)
# Se false, usa cálculos simulados
USE_CORREIOS_API=false

# URL da API dos Correios
# Padrão: https://api.correios.com.br
CORREIOS_API_URL=https://api.correios.com.br

# Credenciais da API dos Correios
# Obtenha em: https://www.correios.com.br/
# Entre em contato com os Correios para obter acesso à API
CORREIOS_API_USER=
CORREIOS_API_PASSWORD=

# Código de contrato (opcional, se aplicável)
CORREIOS_API_CODE=

# CEP de origem (CEP da loja/ponto de expedição)
# Padrão: 01310-100 (Av. Paulista, SP)
CORREIOS_ORIGIN_CEP=01310-100

"@

# Verificar se já existe seção dos Correios
if ($content -match "CORREIOS - FRETE E RASTREAMENTO") {
    Write-Host "Variáveis dos Correios já existem no .env" -ForegroundColor Yellow
    Write-Host "Verifique manualmente se todas as variáveis estão configuradas."
} else {
    # Adicionar variáveis ao final do arquivo
    Add-Content -Path $envFile -Value $correiosVars
    Write-Host "Variáveis dos Correios adicionadas ao .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Configure as variáveis necessárias:" -ForegroundColor Cyan
    Write-Host "   - USE_CORREIOS_API=true (para usar API real)" -ForegroundColor White
    Write-Host "   - CORREIOS_API_USER (obrigatório se USE_CORREIOS_API=true)" -ForegroundColor White
    Write-Host "   - CORREIOS_API_PASSWORD (obrigatório se USE_CORREIOS_API=true)" -ForegroundColor White
    Write-Host "   - CORREIOS_ORIGIN_CEP (CEP da sua loja/ponto de expedição)" -ForegroundColor White
    Write-Host ""
    Write-Host "Para desenvolvimento local, você pode deixar:" -ForegroundColor Yellow
    Write-Host "   USE_CORREIOS_API=false (usa cálculos simulados)" -ForegroundColor White
    Write-Host ""
    Write-Host "Consulte: CONFIGURACAO_VARIAVEIS_AMBIENTE.md" -ForegroundColor Cyan
}

