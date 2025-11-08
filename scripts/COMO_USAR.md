# 🚀 Como Usar o Script de Geração de Produtos

## 📝 Passo a Passo

### 1. Preparar o Ambiente

✅ Certifique-se de que:
- Servidor backend está rodando (porta 5000)
- Você tem pelo menos uma categoria criada no banco de dados
- Você está logado no painel admin

### 2. Obter o Token de Admin

**Opção 1: Via Console do Navegador**

1. Abra o painel admin: `http://localhost:3001`
2. Faça login como administrador
3. Pressione F12 para abrir DevTools
4. Vá na aba Console
5. Digite e pressione Enter:
```javascript
localStorage.getItem('admin_token')
```
6. Copie o token que aparece (sem aspas)

**Opção 2: Via Application/Storage**

1. No painel admin, pressione F12
2. Vá em Application > Local Storage > `http://localhost:3001`
3. Procure por `admin_token`
4. Copie o valor

### 3. Executar o Script

#### Windows PowerShell:
```powershell
# Defina o token
$env:ADMIN_TOKEN="cole_seu_token_aqui"

# Execute o script
node scripts/generate-products.js
```

#### Windows CMD:
```cmd
set ADMIN_TOKEN=cole_seu_token_aqui
node scripts/generate-products.js
```

#### Linux/Mac:
```bash
ADMIN_TOKEN="cole_seu_token_aqui" node scripts/generate-products.js
```

### 4. Aguardar o Processo

O script irá:
- ✅ Buscar categorias existentes
- ✅ Gerar 100 produtos aleatórios
- ✅ Cadastrar cada produto via API
- ✅ Exibir progresso em tempo real
- ✅ Mostrar resumo final

### 5. Verificar Resultado

Após a execução:
1. Acesse o painel admin: `http://localhost:3001/products`
2. Você verá os 100 produtos criados
3. Cada produto tem dados aleatórios e únicos

---

## ⚡ Exemplo Completo

```powershell
# 1. Obter token (no navegador, console)
localStorage.getItem('admin_token')
# Resultado: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Executar script (no PowerShell)
$env:ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
node scripts/generate-products.js

# 3. Aguardar saída
# 🚀 Iniciando geração de 100 produtos aleatórios...
# 📋 Buscando categorias...
# ✅ Encontradas 5 categorias
# ✅ [1/100] Produto criado: Vestido Infantil Rosa - R$ 89,90
# ✅ [2/100] Produto criado: Blusa Baby Azul - R$ 45,50
# ...
# 📊 RESUMO DA GERAÇÃO
# ✅ Produtos criados com sucesso: 100
# ❌ Produtos com erro: 0
```

---

## 🎯 Dados Gerados

Cada produto terá:
- **Nome**: Aleatório (ex: "Vestido Infantil Rosa")
- **Descrição**: Texto aleatório e detalhes técnicos
- **Preço**: Entre R$ 19,90 e R$ 199,90
- **Preço Original**: 50% dos produtos têm desconto
- **Categoria**: Selecionada aleatoriamente das categorias existentes
- **Tamanhos**: 2 a 5 tamanhos aleatórios (P, M, G, GG, PP, RN)
- **Cores**: 2 a 4 cores aleatórias
- **Estoque**: Entre 10 e 100 unidades
- **Imagem**: URL aleatória do Unsplash
- **Destaque**: 20% dos produtos são marcados como destaque

---

## ⚠️ Troubleshooting

### Erro: "ADMIN_TOKEN não configurado"
**Solução**: Defina o token antes de executar o script

### Erro: "Nenhuma categoria encontrada"
**Solução**: Crie categorias primeiro no painel admin (/categories)

### Erro: "401 Unauthorized"
**Solução**: Token expirado - faça login novamente e obtenha novo token

### Erro: "Network Error"
**Solução**: Verifique se o servidor backend está rodando na porta 5000

### Produtos não aparecem
**Solução**: 
- Recarregue a página de produtos
- Verifique se foram criados no banco de dados
- Limpe o cache do navegador

---

## 📊 Estatísticas Esperadas

- **Tempo de execução**: ~20-30 segundos
- **Produtos criados**: ~100 (pode variar se houver erros)
- **Produtos em destaque**: ~20 (20%)
- **Produtos com desconto**: ~50 (50%)

---

**✨ Pronto! Agora você tem 100 produtos aleatórios para testar!**

