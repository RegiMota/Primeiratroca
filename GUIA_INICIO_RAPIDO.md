# 🚀 Guia de Início Rápido - Primeira Troca

## ⚡ Iniciar o Sistema

### Opção 1: Iniciar Tudo de Uma Vez (Recomendado)
```bash
npm run dev:all
```
Este comando inicia:
- ✅ Servidor backend (porta 5000)
- ✅ Frontend principal (porta 3000)
- ✅ Painel admin (porta 3001)

### Opção 2: Iniciar Separadamente

#### 1. Servidor Backend
```bash
npm run dev:server
```
- **URL**: http://localhost:5000
- **Status**: Aguarde 5-10 segundos para inicializar completamente

#### 2. Frontend Principal
```bash
npm run dev
```
- **URL**: http://localhost:3000

#### 3. Painel Admin
```bash
npm run dev:admin
```
- **URL**: http://localhost:3001

---

## 🔧 Verificar se o Sistema Está Rodando

### Verificar Portas
```powershell
# Verificar porta 5000 (backend)
netstat -ano | findstr :5000

# Verificar porta 3000 (frontend)
netstat -ano | findstr :3000

# Verificar porta 3001 (admin)
netstat -ano | findstr :3001
```

### Verificar Processos Node
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

---

## ❌ Erros Comuns

### ERR_CONNECTION_REFUSED na porta 5000
**Causa**: Servidor backend não está rodando

**Solução**:
1. Inicie o servidor: `npm run dev:server`
2. Aguarde 5-10 segundos
3. Recarregue a página do frontend

### Erro de Conexão com Banco de Dados
**Causa**: MySQL não está rodando ou configuração incorreta

**Solução**:
1. Verifique se o XAMPP está rodando
2. Verifique o MySQL no XAMPP
3. Verifique as variáveis no `.env`:
   ```
   DATABASE_URL="mysql://root:@localhost:3306/primeiratroca"
   ```

### Erro ao Carregar Logo/Produtos
**Causa**: Servidor backend não está respondendo

**Solução**:
1. Verifique se o servidor está rodando na porta 5000
2. Verifique os logs do servidor no terminal
3. Reinicie o servidor se necessário

---

## 📝 Checklist de Inicialização

Antes de acessar o site, verifique:

- [ ] XAMPP está rodando
- [ ] MySQL está ativo no XAMPP
- [ ] Servidor backend está rodando (porta 5000)
- [ ] Frontend está rodando (porta 3000)
- [ ] Admin panel está rodando (porta 3001) - opcional

---

## 🎯 URLs do Sistema

- **Site Principal**: http://localhost:3000
- **API Backend**: http://localhost:5000
- **Painel Admin**: http://localhost:3001
- **Documentação API**: http://localhost:5000/api (se disponível)

---

## 🔄 Reiniciar o Sistema

Se precisar reiniciar tudo:

1. Pare todos os processos Node (Ctrl+C em cada terminal)
2. Certifique-se de que o MySQL está rodando
3. Execute: `npm run dev:all`

---

**Última atualização**: Janeiro 2025

