# Script para enviar código para o GitHub
# Repositório: https://github.com/RegiMota/Primeiratroca.git

Write-Host "🚀 Enviando código para o GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Não é um repositório Git!" -ForegroundColor Red
    exit 1
}

# Verificar remote atual
Write-Host "📋 Verificando remote atual..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>$null

if ($currentRemote) {
    Write-Host "   Remote atual: $currentRemote" -ForegroundColor Gray
    if ($currentRemote -ne "https://github.com/RegiMota/Primeiratroca.git") {
        Write-Host "   Removendo remote antigo..." -ForegroundColor Yellow
        git remote remove origin
        Write-Host "   ✅ Remote antigo removido" -ForegroundColor Green
    }
}

# Adicionar novo remote
Write-Host ""
Write-Host "🔗 Configurando remote..." -ForegroundColor Yellow
git remote add origin https://github.com/RegiMota/Primeiratroca.git 2>$null
if ($LASTEXITCODE -ne 0) {
    # Pode já existir, tentar set-url
    git remote set-url origin https://github.com/RegiMota/Primeiratroca.git
}

Write-Host "   ✅ Remote configurado" -ForegroundColor Green

# Verificar branch
Write-Host ""
Write-Host "🌿 Verificando branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Branch atual: $currentBranch" -ForegroundColor Gray

# Verificar commits
Write-Host ""
Write-Host "📝 Verificando commits..." -ForegroundColor Yellow
$commitCount = (git log --oneline | Measure-Object -Line).Lines
Write-Host "   Total de commits: $commitCount" -ForegroundColor Gray

# Fazer push
Write-Host ""
Write-Host "📤 Enviando código para o GitHub..." -ForegroundColor Yellow
Write-Host "   Isso pode solicitar suas credenciais do GitHub" -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Código enviado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Acesse seu repositório:" -ForegroundColor Cyan
    Write-Host "   https://github.com/RegiMota/Primeiratroca" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erro ao enviar código." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "   1. Verifique suas credenciais do GitHub" -ForegroundColor Yellow
    Write-Host "   2. Se usar 2FA, use um Personal Access Token" -ForegroundColor Yellow
    Write-Host "   3. Execute manualmente: git push -u origin main" -ForegroundColor Yellow
}

