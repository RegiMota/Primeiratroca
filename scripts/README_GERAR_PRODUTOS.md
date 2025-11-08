# 🚀 Script de Geração de Produtos Aleatórios

## 📋 Descrição

Este script gera automaticamente **100 produtos aleatórios** com informações variadas:
- Nomes aleatórios
- Descrições variadas
- Preços entre R$ 19,90 e R$ 199,90
- Tamanhos e cores aleatórios
- Categorias existentes
- Imagens aleatórias
- Estoque entre 10 e 100 unidades

## 📦 Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
2. **Servidor backend rodando** (porta 5000)
3. **Categorias criadas** no banco de dados
4. **Token de autenticação** do admin

## 🔑 Como Obter o Token de Admin

### Opção 1: Via Console do Navegador

1. Abra o painel admin: `http://localhost:3001`
2. Faça login como administrador
3. Abra o Console do Navegador (F12)
4. Execute no console:
```javascript
localStorage.getItem('admin_token')
```
5. Copie o token exibido

### Opção 2: Via localStorage

1. No painel admin, abra DevTools (F12)
2. Vá em Application > Local Storage
3. Procure por `admin_token`
4. Copie o valor

## 🚀 Como Executar

### Opção 1: Via Variável de Ambiente (Recomendado)

#### Windows (PowerShell):
```powershell
$env:ADMIN_TOKEN="seu_token_aqui"
node scripts/generate-products.js
```

#### Windows (CMD):
```cmd
set ADMIN_TOKEN=seu_token_aqui
node scripts/generate-products.js
```

#### Linux/Mac:
```bash
ADMIN_TOKEN="seu_token_aqui" node scripts/generate-products.js
```

### Opção 2: Via Arquivo .env

1. Adicione no arquivo `.env` na raiz do projeto:
```env
ADMIN_TOKEN=seu_token_aqui
```

2. Execute:
```bash
node scripts/generate-products.js
```

### Opção 3: Editar o Script (Não Recomendado)

Edite o arquivo `scripts/generate-products.js` e substitua:
```javascript
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
```
Por:
```javascript
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'seu_token_aqui';
```

## 📊 O que o Script Faz

1. **Conecta ao backend** usando a API do admin
2. **Busca categorias** existentes
3. **Gera 100 produtos** aleatórios com:
   - Nomes únicos (ex: "Vestido Infantil Rosa", "Camiseta Baby Azul")
   - Descrições variadas
   - Preços aleatórios entre R$ 19,90 e R$ 199,90
   - Preço original (com desconto) em 50% dos produtos
   - 2 a 5 tamanhos aleatórios
   - 2 a 4 cores aleatórias
   - Estoque entre 10 e 100 unidades
   - 20% chance de ser produto em destaque
   - Imagens aleatórias do Unsplash
4. **Cadastra cada produto** via API
5. **Exibe progresso** em tempo real
6. **Mostra resumo** final com sucessos e erros

## ⚙️ Configurações

### Alterar Quantidade de Produtos

Edite a linha no script:
```javascript
for (let i = 0; i < 100; i++) {
```
Para:
```javascript
for (let i = 0; i < 50; i++) { // 50 produtos
```

### Alterar Delay Entre Requisições

Edite a linha:
```javascript
await new Promise(resolve => setTimeout(resolve, 200));
```
Para:
```javascript
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms
```

### Alterar URL da API

Edite a linha:
```javascript
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
```

## 📝 Exemplo de Produtos Gerados

```
✅ [1/100] Produto criado: Vestido Infantil Rosa - R$ 89,90
✅ [2/100] Produto criado: Blusa Baby Azul - R$ 45,50
✅ [3/100] Produto criado: Calça Kids Branco - R$ 129,90
...
```

## 🎯 Estrutura dos Dados Gerados

### Nomes
- Combinam: [Tipo de Produto] + [Adjetivo] + [Cor]
- Exemplos: "Vestido Infantil Rosa", "Camiseta Baby Azul"

### Descrições
- Frases aleatórias + detalhes técnicos
- Incluem informações sobre tecido, cuidados, etc.

### Preços
- Preço: R$ 19,90 a R$ 199,90
- Preço original: 50% dos produtos têm desconto (10% a 40%)

### Tamanhos
- Selecionados aleatoriamente: P, M, G, GG, PP, RN
- Cada produto tem 2 a 5 tamanhos

### Cores
- Selecionadas aleatoriamente de uma lista de 20 cores
- Cada produto tem 2 a 4 cores

### Estoque
- Entre 10 e 100 unidades por produto

## ⚠️ Avisos Importantes

1. **Certifique-se de ter categorias criadas** antes de executar
2. **O script usa delay de 200ms** entre requisições para não sobrecarregar
3. **Produtos são criados na ordem** e podem falhar se servidor não estiver pronto
4. **Erros são logados** mas não interrompem o processo
5. **Verifique o resumo final** para ver quantos produtos foram criados

## 🐛 Troubleshooting

### Erro: "ADMIN_TOKEN não configurado"
- Verifique se o token está sendo passado corretamente
- Certifique-se de estar logado no painel admin

### Erro: "Nenhuma categoria encontrada"
- Crie categorias primeiro no painel admin
- Acesse: `/categories` no painel admin

### Erro: "401 Unauthorized"
- Token expirado ou inválido
- Faça login novamente e obtenha novo token

### Erro: "Network Error"
- Servidor backend não está rodando
- Verifique se o servidor está na porta 5000

### Produtos não aparecem
- Verifique se foram criados no banco de dados
- Limpe o cache do navegador
- Recarregue a página de produtos

## 📊 Estatísticas Esperadas

- **Produtos criados**: ~100 (pode variar se houver erros)
- **Tempo estimado**: ~20-30 segundos (com delay de 200ms)
- **Produtos em destaque**: ~20 (20% de chance)
- **Produtos com desconto**: ~50 (50% de chance)

## 🎉 Resultado Final

Após a execução, você terá:
- ✅ 100 produtos aleatórios cadastrados
- ✅ Dados variados e realistas
- ✅ Pronto para testes e desenvolvimento
- ✅ Produtos visíveis na página de produtos do admin

---

**Versão**: 2.0  
**Última atualização**: Janeiro 2025

