# 🔍 Diagnóstico de Problemas de Conexão API

## Problema: Frontend não está se comunicando com o Backend

### Checklist de Verificação

#### 1. Verificar se o servidor está rodando
```bash
# No terminal, execute:
cd server
npm run dev:server
# OU
tsx watch server/index.ts
```

**Verifique se aparece:**
```
🚀 Server running on http://localhost:5000
```

#### 2. Verificar se o frontend está rodando
```bash
# No terminal raiz, execute:
npm run dev
```

**Verifique se aparece:**
```
Local: http://localhost:3000/
```

#### 3. Verificar URL da API no frontend
- Abra o navegador e vá em `http://localhost:3000`
- Abra o Console do Desenvolvedor (F12)
- Veja se há erros de conexão

#### 4. Testar conexão manualmente
```bash
# Execute no terminal:
node scripts/test-api-connection.js
```

#### 5. Verificar variáveis de ambiente

**Criar arquivo `.env` na raiz do projeto:**
```env
# Backend
PORT=5000
DATABASE_URL="sua_database_url"
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# Frontend (criar arquivo .env na raiz também)
VITE_API_URL=http://localhost:5000/api
```

#### 6. Verificar CORS no backend
O arquivo `server/index.ts` deve ter:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
}));
```

#### 7. Verificar porta do backend
- O backend deve estar rodando na porta **5000**
- O frontend deve estar rodando na porta **3000**

### Soluções Comuns

#### Erro: "Network Error" ou "ECONNREFUSED"
- **Causa**: Servidor não está rodando
- **Solução**: Execute `npm run dev:server` no diretório raiz

#### Erro: "CORS policy"
- **Causa**: CORS não configurado corretamente
- **Solução**: Verifique se `CORS_ORIGIN` inclui `http://localhost:3000`

#### Erro: "404 Not Found"
- **Causa**: URL da API incorreta
- **Solução**: Verifique se `VITE_API_URL` está definido como `http://localhost:5000/api`

#### Erro: "401 Unauthorized"
- **Causa**: Token de autenticação inválido ou expirado
- **Solução**: Faça logout e login novamente

### Comandos Úteis

```bash
# Iniciar servidor backend
npm run dev:server

# Iniciar frontend
npm run dev

# Iniciar tudo de uma vez
npm run dev:all

# Verificar logs do servidor
# (veja o terminal onde o servidor está rodando)
```

### Testar Manualmente

1. **Teste Health Check:**
   - Abra: `http://localhost:5000/api/health`
   - Deve retornar: `{"status":"ok","message":"Primeira Troca API is running"}`

2. **Teste Produtos:**
   - Abra: `http://localhost:5000/api/products?limit=5`
   - Deve retornar uma lista de produtos

3. **Teste Login (erro esperado sem credenciais):**
   - Use Postman ou curl:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

### Se ainda não funcionar

1. Verifique os logs do servidor no terminal
2. Verifique o console do navegador (F12)
3. Verifique se há erros de firewall ou antivírus bloqueando a conexão
4. Tente reiniciar ambos os servidores
