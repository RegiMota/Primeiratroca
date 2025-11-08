# 🔧 Solução: Porta 5000 já está em uso

## ❌ Erro
```
Error: listen EADDRINUSE: address already in use :::5000
```

## ✅ Soluções

### Opção 1: Encerrar o processo manualmente (Recomendado)

**Windows PowerShell:**
```powershell
# 1. Encontrar o processo usando a porta 5000
netstat -ano | findstr :5000

# 2. Ver o PID (última coluna) e encerrar o processo
taskkill /F /PID <PID>
```

**Ou use o script automatizado:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/kill-port-5000.ps1
```

### Opção 2: Usar o Gerenciador de Tarefas

1. Abra o **Gerenciador de Tarefas** (Ctrl + Shift + Esc)
2. Vá na aba **Detalhes**
3. Procure por processos do Node.js (node.exe)
4. Encerre os processos que possam estar usando a porta 5000

### Opção 3: Mudar a porta do servidor

Se não conseguir encerrar o processo, mude a porta:

1. **Crie ou edite o arquivo `.env` na raiz do projeto:**
```env
PORT=5001
```

2. **Atualize o frontend (`.env` na raiz):**
```env
VITE_API_URL=http://localhost:5001/api
```

3. **Reinicie o servidor:**
```bash
npm run dev:server
```

### Opção 4: Reiniciar o computador

Se nenhuma das opções acima funcionar, reinicie o computador para liberar todas as portas.

## 🔍 Verificar se a porta está livre

Após encerrar o processo, verifique:
```powershell
netstat -ano | findstr :5000
```

Se não retornar nada, a porta está livre!

## 🚀 Iniciar o servidor novamente

Depois de liberar a porta, execute:
```bash
npm run dev:server
```

Você deve ver:
```
🚀 Server running on http://localhost:5000
```

## 💡 Dica

Se isso acontecer frequentemente, pode ser que você tenha deixado o servidor rodando em outro terminal. Sempre verifique se há processos Node.js rodando antes de iniciar um novo servidor.
