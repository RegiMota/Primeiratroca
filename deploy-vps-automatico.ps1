# Script Automatizado de Deploy para VPS
# Configuração completa do Primeira Troca na VPS

param(
    [string]$VPS_IP = "69.6.221.201",
    [string]$VPS_PORT = "22022",
    [string]$VPS_USER = "root",
    [string]$VPS_PASSWORD = "9277480@mqGFelipe",
    [string]$DOMAIN = "primeiratrocaecia.com.br"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploy Automatizado - Primeira Troca" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se plink/ssh está disponível
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "❌ SSH não encontrado. Instalando OpenSSH..." -ForegroundColor Red
    # Tentar instalar OpenSSH no Windows
    Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
}

# Função para executar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$IgnoreErrors = $false
    )
    
    $sshCommand = "ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_IP `"$Command`""
    
    Write-Host "📝 Executando: $Command" -ForegroundColor Gray
    
    try {
        $result = & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $VPS_PORT "$VPS_USER@$VPS_IP" $Command 2>&1
        if ($LASTEXITCODE -ne 0 -and -not $IgnoreErrors) {
            Write-Host "⚠️  Aviso: Comando retornou código $LASTEXITCODE" -ForegroundColor Yellow
        }
        return $result
    } catch {
        if (-not $IgnoreErrors) {
            Write-Host "❌ Erro ao executar comando: $_" -ForegroundColor Red
            throw
        }
    }
}

# Função para copiar arquivo via SCP
function Copy-FileToVPS {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    Write-Host "📤 Copiando $LocalPath para VPS..." -ForegroundColor Yellow
    & scp -o StrictHostKeyChecking=no -P $VPS_PORT $LocalPath "$VPS_USER@$VPS_IP`:$RemotePath"
}

Write-Host "📋 Informações da VPS:" -ForegroundColor Cyan
Write-Host "   IP: $VPS_IP" -ForegroundColor Gray
Write-Host "   Porta: $VPS_PORT" -ForegroundColor Gray
Write-Host "   Usuário: $VPS_USER" -ForegroundColor Gray
Write-Host "   Domínio: $DOMAIN" -ForegroundColor Gray
Write-Host ""

# Testar conexão SSH
Write-Host "🔌 Testando conexão SSH..." -ForegroundColor Yellow
try {
    $testResult = Invoke-SSHCommand "echo 'Conexão OK'" -IgnoreErrors
    Write-Host "✅ Conexão SSH estabelecida!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao conectar via SSH. Verifique as credenciais." -ForegroundColor Red
    Write-Host "   Você pode precisar aceitar a chave SSH manualmente primeiro:" -ForegroundColor Yellow
    Write-Host "   ssh -p $VPS_PORT $VPS_USER@$VPS_IP" -ForegroundColor Gray
    exit 1
}

# Passo 1: Atualizar sistema
Write-Host ""
Write-Host "📦 Passo 1: Atualizando sistema..." -ForegroundColor Cyan
Invoke-SSHCommand "apt update && apt upgrade -y"

# Passo 2: Instalar Docker
Write-Host ""
Write-Host "🐳 Passo 2: Instalando Docker..." -ForegroundColor Cyan
Invoke-SSHCommand "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
Invoke-SSHCommand "usermod -aG docker $VPS_USER" -IgnoreErrors

# Passo 3: Instalar Docker Compose
Write-Host ""
Write-Host "📦 Passo 3: Instalando Docker Compose..." -ForegroundColor Cyan
Invoke-SSHCommand "curl -L `"https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)`" -o /usr/local/bin/docker-compose"
Invoke-SSHCommand "chmod +x /usr/local/bin/docker-compose"

# Passo 4: Instalar Nginx e Certbot
Write-Host ""
Write-Host "🌐 Passo 4: Instalando Nginx e Certbot..." -ForegroundColor Cyan
Invoke-SSHCommand "apt install -y nginx certbot python3-certbot-nginx"

# Passo 5: Criar diretório do projeto
Write-Host ""
Write-Host "📁 Passo 5: Preparando diretório do projeto..." -ForegroundColor Cyan
Invoke-SSHCommand "mkdir -p /var/www"
Invoke-SSHCommand "cd /var/www && rm -rf primeira-troca" -IgnoreErrors

# Passo 6: Clonar repositório
Write-Host ""
Write-Host "📥 Passo 6: Clonando repositório..." -ForegroundColor Cyan
Invoke-SSHCommand "cd /var/www && git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca"
Invoke-SSHCommand "cd /var/www/primeira-troca/ecommerce-roupa-infantil && chown -R $VPS_USER:$VPS_USER ."

# Passo 7: Gerar senhas seguras
Write-Host ""
Write-Host "🔐 Passo 7: Gerando senhas seguras..." -ForegroundColor Cyan
$postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "   PostgreSQL Password: $postgresPassword" -ForegroundColor Gray
Write-Host "   JWT Secret gerado" -ForegroundColor Gray

# Passo 8: Criar .env.prod
Write-Host ""
Write-Host "⚙️  Passo 8: Criando arquivo .env.prod..." -ForegroundColor Cyan
$envContent = @"
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=$postgresPassword
POSTGRES_DB=primeiratroca

# JWT Secret
JWT_SECRET=$jwtSecret

# API URL
VITE_API_URL=https://api.$DOMAIN

# Node Environment
NODE_ENV=production

# Porta do servidor
PORT=5000
"@

# Criar arquivo temporário local
$tempEnvFile = [System.IO.Path]::GetTempFileName()
$envContent | Out-File -FilePath $tempEnvFile -Encoding UTF8

# Copiar para VPS
Copy-FileToVPS $tempEnvFile "/var/www/primeira-troca/ecommerce-roupa-infantil/.env.prod"
Remove-Item $tempEnvFile

# Passo 9: Configurar Nginx (temporário para SSL)
Write-Host ""
Write-Host "🌐 Passo 9: Configurando Nginx..." -ForegroundColor Cyan

# Frontend
$nginxFrontend = @"
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@

$tempNginxFrontend = [System.IO.Path]::GetTempFileName()
$nginxFrontend | Out-File -FilePath $tempNginxFrontend -Encoding UTF8
Copy-FileToVPS $tempNginxFrontend "/etc/nginx/sites-available/primeira-troca-frontend"
Remove-Item $tempNginxFrontend

# Admin
$nginxAdmin = @"
server {
    listen 80;
    server_name admin.$DOMAIN;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@

$tempNginxAdmin = [System.IO.Path]::GetTempFileName()
$nginxAdmin | Out-File -FilePath $tempNginxAdmin -Encoding UTF8
Copy-FileToVPS $tempNginxAdmin "/etc/nginx/sites-available/primeira-troca-admin"
Remove-Item $tempNginxAdmin

# API
$nginxApi = @"
upstream backend {
    server localhost:5000;
}
server {
    listen 80;
    server_name api.$DOMAIN;
    client_max_body_size 10M;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `"upgrade`";
        proxy_set_header Host `$host;
    }
}
"@

$tempNginxApi = [System.IO.Path]::GetTempFileName()
$nginxApi | Out-File -FilePath $tempNginxApi -Encoding UTF8
Copy-FileToVPS $tempNginxApi "/etc/nginx/sites-available/primeira-troca-api"
Remove-Item $tempNginxApi

# Habilitar sites
Invoke-SSHCommand "ln -sf /etc/nginx/sites-available/primeira-troca-frontend /etc/nginx/sites-enabled/"
Invoke-SSHCommand "ln -sf /etc/nginx/sites-available/primeira-troca-admin /etc/nginx/sites-enabled/"
Invoke-SSHCommand "ln -sf /etc/nginx/sites-available/primeira-troca-api /etc/nginx/sites-enabled/"
Invoke-SSHCommand "nginx -t"
Invoke-SSHCommand "systemctl reload nginx"

# Passo 10: Configurar Firewall
Write-Host ""
Write-Host "🔥 Passo 10: Configurando firewall..." -ForegroundColor Cyan
Invoke-SSHCommand "ufw allow 22/tcp" -IgnoreErrors
Invoke-SSHCommand "ufw allow 80/tcp" -IgnoreErrors
Invoke-SSHCommand "ufw allow 443/tcp" -IgnoreErrors
Invoke-SSHCommand "ufw --force enable" -IgnoreErrors

# Passo 11: Fazer deploy
Write-Host ""
Write-Host "🚀 Passo 11: Fazendo deploy da aplicação..." -ForegroundColor Cyan
Invoke-SSHCommand "cd /var/www/primeira-troca/ecommerce-roupa-infantil && chmod +x deploy.sh"
Invoke-SSHCommand "cd /var/www/primeira-troca/ecommerce-roupa-infantil && bash deploy.sh"

# Passo 12: Obter certificados SSL
Write-Host ""
Write-Host "🔒 Passo 12: Obtendo certificados SSL..." -ForegroundColor Cyan
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Yellow

Invoke-SSHCommand "certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" -IgnoreErrors
Invoke-SSHCommand "certbot --nginx -d admin.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" -IgnoreErrors
Invoke-SSHCommand "certbot --nginx -d api.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN" -IgnoreErrors

# Passo 13: Criar usuário admin
Write-Host ""
Write-Host "👤 Passo 13: Criando usuário admin..." -ForegroundColor Cyan
Invoke-SSHCommand "cd /var/www/primeira-troca/ecommerce-roupa-infantil && docker-compose -f docker-compose.prod.yml exec -T backend node scripts/check-admin.js" -IgnoreErrors

# Verificar status
Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informações importantes:" -ForegroundColor Cyan
Write-Host "   Frontend: https://$DOMAIN" -ForegroundColor Green
Write-Host "   Admin: https://admin.$DOMAIN" -ForegroundColor Green
Write-Host "   API: https://api.$DOMAIN/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Credenciais:" -ForegroundColor Yellow
Write-Host "   Admin Email: admin@primeiratroca.com.br" -ForegroundColor Gray
Write-Host "   Admin Senha: admin" -ForegroundColor Gray
Write-Host "   PostgreSQL Password: $postgresPassword" -ForegroundColor Gray
Write-Host ""
Write-Host "💾 Salve essas informações em local seguro!" -ForegroundColor Red
Write-Host ""
Write-Host "🔍 Verificar status:" -ForegroundColor Cyan
Write-Host "   ssh -p $VPS_PORT $VPS_USER@$VPS_IP" -ForegroundColor Gray
Write-Host "   cd /var/www/primeira-troca/ecommerce-roupa-infantil" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.prod.yml ps" -ForegroundColor Gray

