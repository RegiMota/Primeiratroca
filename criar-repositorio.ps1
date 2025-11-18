# Script PowerShell para criar repositório no GitHub
# Requer GitHub CLI (gh) instalado

Write-Host "🚀 Criando repositório no GitHub..." -ForegroundColor Cyan

# Verificar se GitHub CLI está instalado
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "❌ GitHub CLI não está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Para instalar o GitHub CLI:" -ForegroundColor Yellow
    Write-Host "   1. Baixe em: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "   2. Ou use: winget install --id GitHub.cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Alternativa: Crie manualmente em https://github.com/new" -ForegroundColor Yellow
    exit 1
}

# Verificar se está autenticado
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Você não está autenticado no GitHub CLI." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔑 Para autenticar, execute:" -ForegroundColor Yellow
    Write-Host "   gh auth login" -ForegroundColor Yellow
    exit 1
}

# Nome do repositório
$repoName = Read-Host "Digite o nome do repositório (ou pressione Enter para 'primeira-troca-v3')"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "primeira-troca-v3"
}

# Descrição
$description = "E-commerce de roupas infantis com Docker e PostgreSQL"

# Visibilidade
Write-Host ""
$visibility = Read-Host "Visibilidade (public/private) [padrão: private]"
if ([string]::IsNullOrWhiteSpace($visibility)) {
    $visibility = "private"
}

# Criar repositório
Write-Host ""
Write-Host "📦 Criando repositório '$repoName'..." -ForegroundColor Cyan
$createResult = gh repo create $repoName --description $description --$visibility --source=. --remote=origin --push 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repositório criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 URL: https://github.com/$((gh api user | ConvertFrom-Json).login)/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✨ Código enviado para o GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao criar repositório:" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tente criar manualmente em https://github.com/new" -ForegroundColor Yellow
}

