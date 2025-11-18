# Script para criar repositório no GitHub usando API
# Requer um Personal Access Token do GitHub

Write-Host "🚀 Criador de Repositório GitHub via API" -ForegroundColor Cyan
Write-Host ""

# Solicitar informações
$repoName = Read-Host "Nome do repositório [padrão: primeira-troca-v3]"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "primeira-troca-v3"
}

$description = Read-Host "Descrição [padrão: E-commerce de roupas infantis com Docker e PostgreSQL]"
if ([string]::IsNullOrWhiteSpace($description)) {
    $description = "E-commerce de roupas infantis com Docker e PostgreSQL"
}

Write-Host ""
Write-Host "Visibilidade:" -ForegroundColor Yellow
Write-Host "  1. Public (público)"
Write-Host "  2. Private (privado)"
$visibilityChoice = Read-Host "Escolha [padrão: 2]"
$isPrivate = if ($visibilityChoice -eq "1") { $false } else { $true }

Write-Host ""
Write-Host "📝 Para criar um Personal Access Token:" -ForegroundColor Yellow
Write-Host "   1. Acesse: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host "   2. Clique em 'Generate new token' > 'Generate new token (classic)'" -ForegroundColor Cyan
Write-Host "   3. Dê um nome (ex: 'Criar Repo Primeira Troca')" -ForegroundColor Cyan
Write-Host "   4. Marque a opção 'repo' (acesso completo a repositórios)" -ForegroundColor Cyan
Write-Host "   5. Clique em 'Generate token'" -ForegroundColor Cyan
Write-Host "   6. COPIE o token (você não verá novamente!)" -ForegroundColor Red
Write-Host ""

$token = Read-Host "Cole seu Personal Access Token aqui" -AsSecureString
$tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
    Write-Host "❌ Token não fornecido. Abortando." -ForegroundColor Red
    exit 1
}

# Obter username do GitHub
Write-Host ""
Write-Host "🔍 Obtendo informações do GitHub..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "token $tokenPlain"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    $username = $userResponse.login
    Write-Host "✅ Autenticado como: $username" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao autenticar. Verifique seu token." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verificar se repositório já existe
Write-Host ""
Write-Host "🔍 Verificando se o repositório já existe..." -ForegroundColor Cyan
try {
    $checkRepo = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$repoName" -Headers $headers -Method Get -ErrorAction SilentlyContinue
    Write-Host "⚠️  Repositório '$repoName' já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit 1
    }
} catch {
    # Repositório não existe, pode criar
}

# Criar repositório
Write-Host ""
Write-Host "📦 Criando repositório '$repoName'..." -ForegroundColor Cyan

$body = @{
    name = $repoName
    description = $description
    private = $isPrivate
    auto_init = $false
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Repositório criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 URL: $($createResponse.html_url)" -ForegroundColor Cyan
    Write-Host "📋 Clone URL: $($createResponse.clone_url)" -ForegroundColor Cyan
    Write-Host ""
    
    # Configurar remote e fazer push
    Write-Host "🔗 Configurando remote..." -ForegroundColor Cyan
    
    # Remover remote antigo se existir
    $oldRemote = git remote get-url origin 2>$null
    if ($oldRemote) {
        git remote remove origin 2>$null
    }
    
    # Adicionar novo remote
    git remote add origin $createResponse.clone_url
    
    Write-Host "📤 Enviando código para o GitHub..." -ForegroundColor Cyan
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✨ Sucesso! Repositório criado e código enviado!" -ForegroundColor Green
        Write-Host "🌐 Acesse: $($createResponse.html_url)" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Repositório criado, mas houve erro ao fazer push." -ForegroundColor Yellow
        Write-Host "💡 Execute manualmente: git push -u origin main" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro ao criar repositório:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Host ""
        Write-Host "💡 O repositório pode já existir ou o nome é inválido." -ForegroundColor Yellow
    }
}

