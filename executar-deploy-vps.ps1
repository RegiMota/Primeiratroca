# Script para executar deploy na VPS via SSH
# Este script conecta na VPS e executa o script de deploy

$VPS_IP = "69.6.221.201"
$VPS_PORT = "22022"
$VPS_USER = "root"
$VPS_PASSWORD = "9277480@mqGFelipe"

Write-Host "🚀 Conectando na VPS e executando deploy..." -ForegroundColor Cyan
Write-Host ""

# Instruções para o usuário
Write-Host "📝 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure os DNS primeiro no Registro.br:" -ForegroundColor Cyan
Write-Host "   - primeiratrocaecia.com.br → 69.6.221.201" -ForegroundColor Gray
Write-Host "   - www.primeiratrocaecia.com.br → 69.6.221.201" -ForegroundColor Gray
Write-Host "   - admin.primeiratrocaecia.com.br → 69.6.221.201" -ForegroundColor Gray
Write-Host "   - api.primeiratrocaecia.com.br → 69.6.221.201" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Aguarde a propagação do DNS (pode levar algumas horas)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Conecte na VPS manualmente e execute:" -ForegroundColor Cyan
Write-Host "   ssh -p $VPS_PORT $VPS_USER@$VPS_IP" -ForegroundColor Green
Write-Host ""
Write-Host "4. Na VPS, execute:" -ForegroundColor Cyan
Write-Host "   cd /var/www" -ForegroundColor Green
Write-Host "   git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca" -ForegroundColor Green
Write-Host "   cd primeira-troca/ecommerce-roupa-infantil" -ForegroundColor Green
Write-Host "   chmod +x deploy-vps.sh" -ForegroundColor Green
Write-Host "   bash deploy-vps.sh" -ForegroundColor Green
Write-Host ""
Write-Host "OU copie o arquivo deploy-vps.sh para a VPS e execute:" -ForegroundColor Yellow
Write-Host ""

# Tentar copiar arquivo para VPS
$scriptPath = Join-Path $PSScriptRoot "deploy-vps.sh"
if (Test-Path $scriptPath) {
    Write-Host "📤 Copiando script para VPS..." -ForegroundColor Yellow
    Write-Host "   Execute manualmente: scp -P $VPS_PORT $scriptPath $VPS_USER@$VPS_IP`:/root/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Depois na VPS: bash /root/deploy-vps.sh" -ForegroundColor Gray
} else {
    Write-Host "❌ Arquivo deploy-vps.sh não encontrado!" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Dica: Você pode executar o deploy diretamente na VPS via SSH" -ForegroundColor Cyan
Write-Host "   O script deploy-vps.sh faz tudo automaticamente!" -ForegroundColor Gray

