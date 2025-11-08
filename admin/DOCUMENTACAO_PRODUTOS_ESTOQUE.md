# 📦 Documentação Detalhada - Páginas de Produtos e Estoque

## 🛍️ Página de Produtos (`AdminProductsPage`)

### Visão Geral

A página de produtos é o centro de gerenciamento de todos os produtos da loja. Permite criar, editar, visualizar e deletar produtos com todas as informações necessárias.

### Localização
- **Rota**: `/products`
- **Arquivo**: `admin/src/pages/AdminProductsPage.tsx`
- **Acesso**: Apenas administradores autenticados

---

## 📋 Estrutura da Página

### 1. **Cabeçalho**
```typescript
- Título: "Produtos"
- Subtítulo: "Gerenciar produtos da loja"
- Botão "Novo Produto" (abre dialog de criação)
```

### 2. **Tabela de Produtos**

Exibe todos os produtos em formato tabular com as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| **Produto** | Imagem (thumbnail), nome e descrição (primeiros 50 caracteres) |
| **Categoria** | Nome da categoria do produto |
| **Preço** | Preço atual em R$ |
| **Estoque** | Quantidade disponível |
| **Status** | Badge "Destaque" se produto está em destaque |
| **Ações** | Botões de editar e deletar |

---

## 🎯 Funcionalidades Principais

### 1. **Criar Novo Produto**

#### Botão "Novo Produto"
- Abre um dialog modal com formulário completo
- Reset automático do formulário ao abrir

#### Formulário de Criação

**Campos obrigatórios:**
- ✅ **Nome**: Nome do produto
- ✅ **Descrição**: Descrição detalhada do produto
- ✅ **Preço**: Preço de venda (formato: 0.00)
- ✅ **Categoria**: Dropdown com categorias disponíveis
- ✅ **URL da Imagem**: URL da imagem principal do produto
- ✅ **Estoque**: Quantidade inicial em estoque

**Campos opcionais:**
- **Preço Original**: Preço antes do desconto (para mostrar desconto)
- **Tamanhos**: Lista dinâmica de tamanhos disponíveis
- **Cores**: Lista dinâmica de cores disponíveis
- **Produto em destaque**: Checkbox para marcar como destaque

#### Gerenciamento de Tamanhos e Cores

**Tamanhos:**
- Campo de input para adicionar novo tamanho
- Botão "Adicionar" ao lado do input
- Suporte a Enter para adicionar rapidamente
- Lista de badges com cada tamanho adicionado
- Botão X em cada badge para remover
- Validação: não permite tamanhos duplicados

**Cores:**
- Mesmo comportamento dos tamanhos
- Campo de input para adicionar nova cor
- Lista de badges com cores adicionadas
- Botão de remoção em cada cor

#### Fluxo de Criação

1. Usuário preenche o formulário
2. Clica em "Criar"
3. Produto é criado no backend
4. **Dialog permanece aberto** para permitir adicionar imagens
5. `ProductImageManager` aparece automaticamente
6. Usuário pode adicionar múltiplas imagens
7. Ao fechar o dialog, produto é salvo completamente

---

### 2. **Editar Produto**

#### Ação de Edição
- Botão de editar (ícone de lápis) em cada linha da tabela
- Abre o mesmo dialog usado para criação
- Formulário pré-preenchido com dados do produto

#### Dados Carregados
```typescript
{
  name: produto.name,
  description: produto.description,
  price: produto.price.toString(),
  originalPrice: produto.originalPrice?.toString() || '',
  categoryId: produto.category.id.toString(),
  image: produto.image,
  stock: produto.stock.toString(),
  sizes: Array.isArray(produto.sizes) ? produto.sizes : [],
  colors: Array.isArray(produto.colors) ? produto.colors : [],
  featured: produto.featured
}
```

#### Gerenciador de Imagens (apenas em edição)

**Quando aparece:**
- Apenas quando `editingProduct.id > 0` (produto já criado)
- Aparece após os campos do formulário
- Separado por uma borda superior

**Funcionalidades:**
- **Upload de imagens**: Drag & drop ou seleção de arquivo
- **Galeria de imagens**: Visualização em grid
- **Definir imagem principal**: Botão para marcar como principal
- **Reordenar imagens**: Botões para mover para cima/baixo
- **Deletar imagens**: Botão de deletar em cada imagem

**Componente `ProductImageManager`:**
```typescript
<ProductImageManager 
  productId={editingProduct.id} 
/>
```

**Recursos do gerenciador:**
- Otimização automática de imagens
- Redimensionamento para 800x300px
- Compressão para JPEG (85% qualidade)
- Suporte a PNG, JPG, JPEG, SVG, WebP
- Validação de tamanho máximo (2MB)

---

### 3. **Deletar Produto**

#### Processo
1. Clica no botão de deletar (ícone de lixeira vermelha)
2. Confirmação via `confirm()` do navegador
3. Produto é deletado do backend
4. Tabela é atualizada automaticamente
5. Toast de sucesso é exibido

#### Validação
- Confirmação obrigatória antes de deletar
- Erro se produto estiver em uso (pedidos, etc.)

---

## 🔄 Estados e Gerenciamento

### Estados React

```typescript
const [products, setProducts] = useState<Product[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingProduct, setEditingProduct] = useState<Product | null>(null);
const [submitting, setSubmitting] = useState(false);
const [formData, setFormData] = useState({...});
const [newSize, setNewSize] = useState('');
const [newColor, setNewColor] = useState('');
```

### Carregamento de Dados

```typescript
useEffect(() => {
  loadData();
}, []);
```

**`loadData()` faz:**
1. Carrega todos os produtos via `adminAPI.getAllProducts()`
2. Carrega todas as categorias via `adminAPI.getCategories()`
3. Define primeira categoria como padrão se não houver seleção
4. Atualiza estados com os dados carregados

---

## 📊 Interface do Usuário

### Loading State
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center p-12">
      <p className="text-gray-600">Carregando produtos...</p>
    </div>
  );
}
```

### Tabela Responsiva
- Layout em grid
- Hover effect nas linhas
- Imagens com tamanho fixo (10x10)
- Badges para status de destaque

---

## 🔌 Integrações API

### Endpoints Utilizados

```typescript
// GET /admin/products
adminAPI.getAllProducts()

// GET /admin/categories
adminAPI.getCategories()

// POST /admin/products
adminAPI.createProduct(productData)

// PUT /admin/products/:id
adminAPI.updateProduct(id, productData)

// DELETE /admin/products/:id
adminAPI.deleteProduct(id)
```

### Formato de Dados Enviados

```typescript
{
  name: string,
  description: string,
  price: number,
  originalPrice?: number,
  categoryId: number,
  image: string,
  stock: number,
  sizes: string[],
  colors: string[],
  featured: boolean
}
```

---

---

## 📦 Página de Estoque (`AdminStockPage`)

### Visão Geral

A página de estoque gerencia **variações de produtos** (combinações de tamanho e cor) com controle detalhado de estoque, reservas e movimentações.

### Localização
- **Rota**: `/stock`
- **Arquivo**: `admin/src/pages/AdminStockPage.tsx`
- **Acesso**: Apenas administradores autenticados

---

## 📋 Estrutura da Página

### 1. **Cabeçalho**
```typescript
- Título: "Gerenciamento de Estoque"
- Subtítulo: "Gerencie variações e movimentações de estoque"
- Botão "Nova Variação" (abre dialog de criação)
```

### 2. **Cards de Estatísticas**

Exibe 4 cards com métricas importantes:

| Card | Métrica | Descrição |
|------|---------|-----------|
| **Total de Variações** | `stats.totalVariants` | Número total de variações cadastradas |
| **Estoque Total** | `stats.totalStock` | Soma de todo o estoque disponível |
| **Estoque Reservado** | `stats.totalReserved` | Quantidade reservada em pedidos |
| **Estoque Baixo** | `stats.lowStockCount` | Quantidade de variações com estoque baixo |

### 3. **Filtros**

```typescript
- Dropdown: Filtrar por produto específico
- Checkbox: "Mostrar apenas estoque baixo"
```

### 4. **Tabela de Variações**

| Coluna | Descrição |
|--------|-----------|
| **Produto** | Nome do produto base |
| **Tamanho** | Tamanho da variação (ou "-") |
| **Cor** | Cor da variação (ou "-") |
| **Estoque** | Quantidade total em estoque |
| **Reservado** | Quantidade reservada em pedidos |
| **Disponível** | Estoque - Reservado (em vermelho se ≤ 0) |
| **Mínimo** | Estoque mínimo configurado |
| **Status** | Badge "Baixo" (laranja) ou "OK" (cinza) + "Inativo" se aplicável |
| **Ações** | Editar, Ajustar Estoque, Deletar |

### 5. **Tabela de Movimentações Recentes**

Exibe as últimas 20 movimentações de estoque:

| Coluna | Descrição |
|--------|-----------|
| **Data** | Data e hora da movimentação |
| **Produto** | Nome do produto |
| **Tipo** | Badge com tipo (Reserva, Liberação, Venda, Ajuste, Compra, Devolução) |
| **Quantidade** | Quantidade (verde se positivo, vermelho se negativo) |
| **Motivo** | Motivo ou descrição da movimentação |

---

## 🎯 Funcionalidades Principais

### 1. **Criar Nova Variação**

#### Formulário de Criação

**Campos obrigatórios:**
- ✅ **Produto**: Dropdown com todos os produtos
- ✅ **Estoque**: Quantidade inicial
- ✅ **Estoque Mínimo**: Quantidade mínima para alerta (padrão: 5)

**Campos opcionais:**
- **Tamanho**: Tamanho da variação (ex: P, M, G)
- **Cor**: Cor da variação (ex: Azul, Vermelho)
- **Preço**: Preço específico para esta variação (sobrescreve preço do produto)
- **Variação ativa**: Checkbox para ativar/desativar

#### Validações
- Produto deve ser selecionado
- Estoque deve ser ≥ 0
- Estoque mínimo deve ser ≥ 0

---

### 2. **Editar Variação**

#### Processo
1. Clica no botão de editar (ícone de lápis)
2. Dialog abre com formulário pré-preenchido
3. Usuário modifica os campos necessários
4. Clica em "Atualizar"
5. Variação é atualizada no backend
6. Tabela é atualizada

#### Campos Editáveis
- Todos os campos são editáveis
- Inclui ativar/desativar variação

---

### 3. **Ajustar Estoque**

#### Função
Permite ajustes manuais de estoque (entrada ou saída) com registro de movimentação.

#### Processo
1. Clica no botão "Ajustar Estoque" (ícone de trending down)
2. Dialog abre com informações da variação
3. Preenche:
   - **Quantidade**: Positivo para adicionar, negativo para remover
   - **Motivo**: Razão do ajuste (ex: "Entrada de mercadoria", "Perda")
   - **Descrição**: Observações adicionais
4. Clica em "Ajustar Estoque"
5. Estoque é atualizado
6. Movimentação é registrada no histórico
7. Tabela é atualizada

#### Exemplos de Uso
```typescript
// Adicionar 10 unidades
quantity: +10
reason: "Entrada de mercadoria"
description: "Compra do fornecedor XYZ"

// Remover 5 unidades
quantity: -5
reason: "Perda"
description: "Produto danificado no estoque"
```

---

### 4. **Deletar Variação**

#### Processo
1. Clica no botão de deletar (ícone de lixeira)
2. Confirmação via `confirm()`
3. Variação é deletada permanentemente
4. Tabela é atualizada

#### Cuidados
- Variações com estoque reservado podem não ser deletáveis
- Histórico de movimentações é mantido

---

## 🔍 Filtros e Visualizações

### Filtrar por Produto

```typescript
<Select>
  <SelectItem value="all">Todos os produtos</SelectItem>
  {products.map(product => (
    <SelectItem value={product.id}>
      {product.name}
    </SelectItem>
  ))}
</Select>
```

- Filtra variações por produto específico
- Atualiza tabela automaticamente
- Mantém filtro ativo até ser alterado

### Mostrar Apenas Estoque Baixo

```typescript
<input 
  type="checkbox" 
  checked={showLowStock}
  onChange={(e) => setShowLowStock(e.target.checked)}
/>
```

**Comportamento:**
- Quando marcado: mostra apenas variações com estoque disponível ≤ estoque mínimo
- Quando desmarcado: mostra todas as variações
- Atualiza tabela instantaneamente

**Cálculo de Estoque Baixo:**
```typescript
const availableStock = (variant: ProductVariant) => 
  variant.stock - variant.reservedStock;

const isLowStock = (variant: ProductVariant) => 
  availableStock(variant) <= variant.minStock;
```

---

## 📊 Indicadores Visuais

### Status de Estoque

**Badge "Baixo" (Laranja):**
- Exibido quando `estoque disponível ≤ estoque mínimo`
- Ícone de alerta (⚠️)
- Cor: `destructive` (vermelho/laranja)

**Badge "OK" (Cinza):**
- Exibido quando estoque está acima do mínimo
- Cor: `secondary` (cinza)

**Badge "Inativo":**
- Exibido quando `isActive = false`
- Cor: `outline` (borda cinza)

### Estoque Disponível

**Texto em Vermelho:**
```typescript
<span className={availableStock(variant) <= 0 ? 'text-red-500 font-bold' : ''}>
  {availableStock(variant)}
</span>
```

- Quando disponível ≤ 0: texto vermelho e negrito
- Quando disponível > 0: texto normal

---

## 🔄 Estados e Gerenciamento

### Estados React

```typescript
const [variants, setVariants] = useState<ProductVariant[]>([]);
const [products, setProducts] = useState<Product[]>([]);
const [movements, setMovements] = useState<StockMovement[]>([]);
const [lowStockVariants, setLowStockVariants] = useState<ProductVariant[]>([]);
const [loading, setLoading] = useState(true);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
const [stats, setStats] = useState<any>(null);
const [filterProductId, setFilterProductId] = useState<number | null>(null);
const [showLowStock, setShowLowStock] = useState(false);
```

### Carregamento de Dados

```typescript
useEffect(() => {
  loadData();
}, [filterProductId]);
```

**`loadData()` faz:**
1. Carrega variações via `adminAPI.getStockVariants(params)`
2. Carrega produtos via `adminAPI.getProducts()`
3. Carrega movimentações recentes via `adminAPI.getStockMovements({ limit: 50 })`
4. Carrega variações com estoque baixo via `adminAPI.getLowStockVariants()`
5. Carrega estatísticas via `adminAPI.getStockStats()`
6. Atualiza todos os estados

**Recarrega quando:**
- `filterProductId` muda (filtro por produto)

---

## 📝 Tipos de Movimentação

### Tipos Suportados

| Tipo | Descrição | Quando Ocorre |
|------|-----------|---------------|
| **reserve** | Reserva | Quando um pedido é criado |
| **release** | Liberação | Quando um pedido é cancelado ou estoque reservado expira |
| **sale** | Venda | Quando um pedido é confirmado |
| **adjustment** | Ajuste | Ajuste manual via página de estoque |
| **purchase** | Compra | Entrada de mercadoria |
| **return** | Devolução | Devolução de produto |

### Exibição na Tabela

```typescript
<Badge>
  {movement.type === 'reserve' && 'Reserva'}
  {movement.type === 'release' && 'Liberação'}
  {movement.type === 'sale' && 'Venda'}
  {movement.type === 'adjustment' && 'Ajuste'}
  {movement.type === 'purchase' && 'Compra'}
  {movement.type === 'return' && 'Devolução'}
</Badge>
```

---

## 🔌 Integrações API

### Endpoints Utilizados

```typescript
// GET /admin/stock/variants
adminAPI.getStockVariants(params)

// GET /admin/products
adminAPI.getProducts()

// GET /admin/stock/movements
adminAPI.getStockMovements({ limit: 50 })

// GET /admin/stock/low-stock
adminAPI.getLowStockVariants()

// GET /admin/stock/stats
adminAPI.getStockStats()

// POST /admin/stock/variants
adminAPI.createStockVariant(data)

// PUT /admin/stock/variants/:id
adminAPI.updateStockVariant(id, data)

// DELETE /admin/stock/variants/:id
adminAPI.deleteStockVariant(id)

// POST /admin/stock/adjust
adminAPI.adjustStock(variantId, quantity, reason, description)
```

### Formato de Dados

**Criar/Atualizar Variação:**
```typescript
{
  productId: number,
  size?: string,
  color?: string,
  stock: number,
  minStock: number,
  price?: number,
  isActive: boolean
}
```

**Ajustar Estoque:**
```typescript
{
  variantId: number,
  quantity: number,  // Positivo ou negativo
  reason: string,
  description?: string
}
```

---

## 💡 Conceitos Importantes

### Estoque Disponível vs Estoque Total

**Estoque Total (`stock`):**
- Quantidade física total do produto
- Não considera reservas

**Estoque Reservado (`reservedStock`):**
- Quantidade reservada em pedidos pendentes
- Pode ser liberada se pedido for cancelado

**Estoque Disponível:**
```typescript
estoqueDisponível = estoqueTotal - estoqueReservado
```

### Estoque Mínimo

- Quantidade mínima que deve estar disponível
- Quando `estoqueDisponível ≤ estoqueMínimo`, sistema marca como "estoque baixo"
- Alertas podem ser configurados para notificar admin

### Variações de Produto

- Um produto pode ter múltiplas variações
- Cada variação é uma combinação única de tamanho e cor
- Cada variação tem seu próprio estoque
- Exemplo:
  - Produto: "Camiseta Básica"
  - Variação 1: Tamanho P, Cor Azul
  - Variação 2: Tamanho M, Cor Azul
  - Variação 3: Tamanho P, Cor Vermelha

---

## 🎨 Diferenças entre as Páginas

### Página de Produtos
- ✅ Gerencia **produtos** (entidades principais)
- ✅ Foco em: informações do produto, preços, categorias
- ✅ Estoque é um campo simples
- ✅ Gerenciamento de imagens integrado
- ✅ Tamanhos e cores são arrays simples

### Página de Estoque
- ✅ Gerencia **variações** (combinações de produto + tamanho + cor)
- ✅ Foco em: controle de estoque, movimentações, reservas
- ✅ Estoque detalhado (total, reservado, disponível, mínimo)
- ✅ Histórico de movimentações
- ✅ Estatísticas e alertas de estoque baixo

### Trabalho em Conjunto

1. **Criar produto** na página de Produtos
2. **Criar variações** na página de Estoque
3. **Acompanhar movimentações** na página de Estoque
4. **Receber alertas** de estoque baixo

---

## 📌 Resumo Rápido

### Página de Produtos
- **O que faz**: Gerencia produtos (criar, editar, deletar)
- **Quando usar**: Para adicionar novos produtos, atualizar informações, gerenciar imagens
- **Principais ações**: Criar produto, Editar produto, Adicionar imagens, Definir tamanhos/cores

### Página de Estoque
- **O que faz**: Gerencia variações e controle de estoque
- **Quando usar**: Para controlar estoque por variação, fazer ajustes, monitorar níveis
- **Principais ações**: Criar variação, Ajustar estoque, Ver movimentações, Filtrar estoque baixo

---

**Versão**: 2.0  
**Última atualização**: Janeiro 2025

