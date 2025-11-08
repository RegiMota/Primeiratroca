# 📦 Fluxo de Estoque - Explicação Detalhada

## 🔄 Como Funciona o Sistema de Estoque

O sistema possui **dois níveis de estoque**:

### 1. **Estoque do Produto (`Product.stock`)**
- Campo simples no cadastro do produto
- Representa o estoque geral do produto
- Usado para produtos simples (sem variações de tamanho/cor)

### 2. **Estoque de Variações (`ProductVariant`)**
- Sistema avançado de estoque por variação
- Cada variação tem seu próprio estoque
- Permite controlar estoque por tamanho e cor separadamente
- Exibido na aba "Estoque" do painel admin

---

## 🔗 Sincronização Automática

### ✅ **Ao Criar um Produto com Estoque**

Quando você cadastra um produto e informa a quantidade de estoque:

1. O produto é criado com `Product.stock = quantidade informada`
2. **Automaticamente** é criada uma **variação padrão** (`ProductVariant`) com:
   - `size = null` (sem tamanho específico)
   - `color = null` (sem cor específica)
   - `stock = quantidade informada`
   - `minStock = 5` (estoque mínimo padrão)
   - `isActive = true`

**Resultado:** O produto aparece na aba "Estoque" imediatamente! ✅

### ✅ **Ao Atualizar o Estoque de um Produto**

Quando você edita um produto e altera a quantidade de estoque:

1. O `Product.stock` é atualizado
2. **Automaticamente** a variação padrão é sincronizada:
   - Se já existe uma variação padrão → o estoque é atualizado
   - Se não existe e o estoque > 0 → uma nova variação padrão é criada

**Resultado:** O estoque na aba "Estoque" é atualizado automaticamente! ✅

---

## 📋 Fluxo Completo

### **Cenário 1: Produto Simples (Sem Variações)**

```
1. Você cadastra um produto com estoque = 50
   ↓
2. Sistema cria:
   - Product { id: 1, stock: 50 }
   - ProductVariant { productId: 1, size: null, color: null, stock: 50 }
   ↓
3. Na aba "Estoque" aparece:
   - Produto: "Nome do Produto"
   - Tamanho: "-"
   - Cor: "-"
   - Estoque: 50
```

### **Cenário 2: Produto com Variações**

```
1. Você cadastra um produto com estoque = 50
   ↓
2. Sistema cria variação padrão automaticamente
   ↓
3. Você vai na aba "Estoque" e cria variações específicas:
   - Variação 1: Tamanho "P", Cor "Azul", Estoque: 20
   - Variação 2: Tamanho "M", Cor "Vermelho", Estoque: 30
   ↓
4. Na aba "Estoque" aparecem 3 variações:
   - Variação padrão (sem tamanho/cor): 50
   - Variação P/Azul: 20
   - Variação M/Vermelho: 30
```

### **Cenário 3: Atualizar Estoque do Produto**

```
1. Você edita um produto e muda estoque de 50 para 100
   ↓
2. Sistema atualiza:
   - Product.stock = 100
   - ProductVariant padrão.stock = 100
   ↓
3. Na aba "Estoque" o estoque é atualizado automaticamente
```

---

## 🎯 Quando Usar Cada Abordagem

### **Use `Product.stock` (Cadastro de Produto):**
- ✅ Produtos simples sem variações
- ✅ Estoque inicial rápido
- ✅ Produtos que não precisam de controle por tamanho/cor

### **Use `ProductVariant` (Aba Estoque):**
- ✅ Produtos com múltiplas variações (tamanho/cor)
- ✅ Controle detalhado de estoque por variação
- ✅ Estoque reservado por pedido
- ✅ Histórico de movimentações
- ✅ Alertas de estoque baixo por variação

---

## ⚠️ Importante

1. **A variação padrão é criada automaticamente** quando você cadastra um produto com estoque
2. **Você pode criar variações específicas** na aba "Estoque" para produtos com tamanhos/cores
3. **O estoque do produto é sincronizado** com a variação padrão automaticamente
4. **Se você criar variações específicas**, considere remover ou reduzir a variação padrão para evitar confusão

---

## 🔧 Correção Aplicada

**Problema anterior:**
- Produtos cadastrados com estoque não apareciam na aba "Estoque"

**Solução implementada:**
- Criação automática de variação padrão ao criar produto com estoque
- Sincronização automática ao atualizar estoque do produto
- Compatibilidade total entre `Product.stock` e `ProductVariant`

**Resultado:**
- ✅ Todos os produtos com estoque aparecem na aba "Estoque"
- ✅ Sincronização automática entre os dois sistemas
- ✅ Funciona tanto para produtos simples quanto com variações

