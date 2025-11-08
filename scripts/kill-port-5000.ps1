# Script para encerrar processos usando a porta 5000
# Uso: powershell -ExecutionPolicy Bypass -File scripts/kill-port-5000.ps1

Write-Host "🔍 Procurando processos usando a porta 5000..." -ForegroundColor Cyan

# Encontrar processos usando a porta 5000
$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "📋 Processos encontrados: $($pids -join ', ')" -ForegroundColor Yellow
    
    foreach ($pid in $pids) {
        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            Write-Host "🛑 Encerrando processo: $($process.ProcessName) (PID: $pid)" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "✅ Processo $pid encerrado com sucesso!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Não foi possível encerrar o processo $pid: $_" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✅ Verificando se a porta 5000 está livre..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    $stillInUse = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($stillInUse) {
        Write-Host "⚠️  A porta 5000 ainda está em uso. Tente novamente ou reinicie o computador." -ForegroundColor Yellow
    } else {
        Write-Host "✅ A porta 5000 está livre agora!" -ForegroundColor Green
        Write-Host "🚀 Você pode iniciar o servidor com: npm run dev:server" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ Nenhum processo está usando a porta 5000!" -ForegroundColor Green
}
