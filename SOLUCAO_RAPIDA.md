# 🚀 Solução Rápida - Problema de Conexão Frontend/Backend

## ⚡ Passos Rápidos para Resolver

### 1️⃣ Verificar se o Backend está rodando

Abra um terminal e execute:
```bash
cd server
npm run dev:server
```

**OU** se estiver na raiz do projeto:
```bash
npm run dev:server
```

**Você deve ver:**
```
🚀 Server running on http://localhost:5000
```

### 2️⃣ Verificar se o Frontend está rodando

Abra **OUTRO** terminal e execute:
```bash
npm run dev
```

**Você deve ver:**
```
Local: http://localhost:3000/
```

### 3️⃣ Testar a conexão manualmente

Abra seu navegador e acesse:
- `http://localhost:5000/api/health`
- Deve retornar: `{"status":"ok","message":"Primeira Troca API is running"}`

Se não funcionar, o backend não está rodando!

### 4️⃣ Verificar o Console do Navegador

1. Abra `http://localhost:3000`
2. Pressione **F12** para abrir o Console
3. Veja se há erros vermelhos
4. Procure por mensagens como:
   - `❌ Erro de conexão com o servidor`
   - `ECONNREFUSED`
   - `Network Error`

### 5️⃣ Verificar variáveis de ambiente (opcional)

Crie um arquivo `.env` na **raiz do projeto**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 6️⃣ Verificar se as portas estão corretas

- **Backend**: Porta **5000** (padrão)
- **Frontend**: Porta **3000** (padrão)

Se alguma porta estiver diferente, ajuste o `.env`

### 7️⃣ Limpar cache e recarregar

No navegador:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- Ou limpe o cache manualmente

### 8️⃣ Reiniciar tudo

1. Pare ambos os servidores (Ctrl+C)
2. Inicie o backend primeiro:
   ```bash
   npm run dev:server
   ```
3. Depois, em outro terminal, inicie o frontend:
   ```bash
   npm run dev
   ```

## 🔍 Verificações Adicionais

### Verificar se há firewall bloqueando

- Windows Defender
- Antivírus
- Firewall do Windows

### Verificar se há outro processo usando a porta 5000

```bash
# Windows PowerShell
netstat -ano | findstr :5000
```

Se houver outro processo, encerre-o ou mude a porta no `.env`:
```env
PORT=5001
VITE_API_URL=http://localhost:5001/api
```

## ✅ Checklist Final

- [ ] Backend rodando e mostrando `🚀 Server running on http://localhost:5000`
- [ ] Frontend rodando e mostrando `Local: http://localhost:3000/`
- [ ] `http://localhost:5000/api/health` retorna JSON
- [ ] Console do navegador não mostra erros de conexão
- [ ] Cache do navegador limpo

## 🆘 Se ainda não funcionar

1. Verifique os logs do servidor backend no terminal
2. Verifique o console do navegador (F12)
3. Tente acessar `http://localhost:5000/api/products?limit=5` diretamente no navegador
4. Verifique se não há erros de sintaxe no código

## 📞 Informações para Debug

Se ainda tiver problemas, forneça:
1. Mensagem de erro completa do console do navegador
2. Mensagem de erro do terminal do servidor
3. Resultado de `http://localhost:5000/api/health`
