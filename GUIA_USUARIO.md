# 📖 Guia do Usuário - Primeira Troca

Guia completo para uso da loja online Primeira Troca.

## 📋 Índice

- [Como Navegar](#como-navegar)
- [Como Comprar](#como-comprar)
- [Painel Administrativo](#painel-administrativo)
- [FAQ](#faq)

---

## 🧭 Como Navegar

### Página Inicial

A página inicial (`/`) exibe:
- **Hero Section** com imagem promocional
- **Produtos em Destaque** (featured)
- **Seções de Categorias** com ícones
- **Newsletter** para cadastro de email

### Catálogo de Produtos

Acesse `/shop` para ver todos os produtos:

1. **Filtros (lateral esquerda):**
   - Selecione uma categoria específica ou "Todas"
   - Ajuste a faixa de preço com o slider
   - Clique em "Aplicar Filtro"

2. **Busca Avançada (v1.2):**
   - Use a barra de busca no topo (visível em todas as páginas desktop)
   - Digite o nome ou descrição do produto
   - Sugestões aparecem automaticamente ao digitar (mínimo 2 caracteres)
   - Use as setas ↑↓ para navegar pelas sugestões
   - Pressione Enter para selecionar ou Escape para fechar
   - Clique no X para limpar a busca
   - Os resultados são filtrados em tempo real

3. **Ordenação (v1.2):**
   - Use os dropdowns "Ordenar por" e "Ordem"
   - Opções: Mais Recente, Preço, Nome, Em Destaque
   - Ordem: Decrescente ou Crescente
   - A lista é atualizada automaticamente

3. **Produtos:**
   - Clique em um produto para ver detalhes
   - Hover mostra botão rápido de adicionar ao carrinho

### Detalhes do Produto

Na página `/product/:id` você pode:
- Ver imagens do produto
- Ler descrição completa
- Selecionar tamanho (S, M, L, etc.)
- Selecionar cor disponível
- Ver preço e preço original (se houver desconto)
- Verificar estoque disponível
- Adicionar ao carrinho com quantidade desejada

---

## 🛒 Como Comprar

### Passo 1: Criar Conta

1. Clique em **"Entrar"** no canto superior direito
2. Clique em **"Criar Conta"**
3. Preencha:
   - **Nome Completo** (mínimo 3 caracteres)
   - **Email** (formato válido)
   - **Senha** (mínimo 6 caracteres)
   - **Confirmar Senha** (deve coincidir)
4. Clique em **"Criar Conta"**
5. Você receberá um email de confirmação (logado no console em desenvolvimento)

### Recuperação de Senha (v1.2)

Se você esqueceu sua senha:

1. Clique em **"Esqueceu sua senha?"** na página de login
2. Digite seu email
3. Você receberá um email com link para redefinir senha
4. Clique no link recebido por email
5. Digite sua nova senha
6. Confirme a nova senha
7. Clique em **"Redefinir Senha"**

**Nota:** O link de redefinição expira em 1 hora.

### Passo 2: Adicionar ao Carrinho

1. Navegue pelos produtos
2. Escolha o produto desejado
3. Selecione **tamanho** e **cor**
4. Clique em **"Adicionar ao Carrinho"**
5. Ou clique no ícone do carrinho no card do produto

### Passo 3: Verificar Carrinho

1. Clique no ícone do **carrinho** (topo direito)
2. Revise os itens adicionados
3. Ajuste quantidades se necessário
4. Remova itens se desejar
5. Clique em **"Finalizar Compra"**

### Passo 4: Checkout

Preencha os dados de entrega:

**Informações de Entrega:**
- Nome Completo
- Email
- Telefone
- Endereço completo
- Cidade
- Estado (UF)
- CEP

**Informações de Pagamento:**
- Número do Cartão
- Data de Expiração (MM/AA)
- CVC (3 ou 4 dígitos)

**Cupom de Desconto (v1.2):**
- Digite o código do cupom no campo "Cupom de Desconto"
- Clique em "Aplicar Cupom"
- O desconto será calculado automaticamente se válido
- O valor final será atualizado com o desconto aplicado

**Validação:**
- Todos os campos obrigatórios devem ser preenchidos
- O formulário valida automaticamente os dados
- Erros aparecem em vermelho abaixo dos campos
- Cupom será validado automaticamente ao aplicar

### Passo 5: Confirmar Pedido

1. Revise o resumo do pedido
2. Verifique o total
3. Clique em **"Confirmar Pedido"**
4. Aguarde a confirmação
5. Você será redirecionado para "Meus Pedidos"

---

## 👨‍💼 Painel Administrativo

### Acessar o Painel

1. Faça login com conta de **administrador**
2. Clique em **"Admin"** no menu superior
3. Você será redirecionado para `/admin`

### Dashboard

**Cards de Estatísticas:**
- Total de Usuários
- Total de Produtos
- Total de Pedidos
- Receita Total

**Gráficos:**
- **Receita:** Gráfico de linha dos últimos 7 dias
- **Produtos Mais Vendidos:** Gráfico de barras
- **Status de Pedidos:** Gráfico de pizza

**Pedidos Recentes:**
- Lista dos últimos 10 pedidos
- Informações do cliente e valor

**Produtos Mais Vendidos:**
- Top 5 produtos por volume de vendas

### Gerenciar Produtos

1. Acesse a aba **"Produtos"**
2. **Criar Produto:**
   - Clique em "Adicionar Produto"
   - Preencha todos os campos obrigatórios:
     - Nome, Descrição, Preço, Categoria
     - URL da Imagem, Estoque
     - Tamanhos (JSON): `["S", "M", "L"]`
     - Cores (JSON): `["Rosa", "Azul"]`
   - Marque "Produto em destaque" se desejar
   - Clique em "Adicionar Produto"

3. **Editar Produto:**
   - Clique no ícone de **lápis** na linha do produto
   - Altere os campos desejados
   - Clique em "Atualizar Produto"

4. **Deletar Produto:**
   - Clique no ícone de **lixeira**
   - Confirme a ação
   - ⚠️ Ação irreversível

### Gerenciar Pedidos

1. Acesse a aba **"Pedidos"**
2. **Filtrar Pedidos:**
   - Use o dropdown para filtrar por status
   - Opções: Todos, Pendente, Processando, Enviado, Entregue, Cancelado

3. **Ver Detalhes:**
   - Clique em "Ver Detalhes" no pedido
   - Visualize:
     - Informações do cliente
     - Itens do pedido
     - Endereço de entrega
     - Status atual
     - Método de pagamento

4. **Atualizar Status:**
   - Use o dropdown de status na linha do pedido
   - Selecione o novo status
   - O pedido é atualizado automaticamente

**Fluxo de Status:**
```
Pendente → Processando → Enviado → Entregue
                ↓
            Cancelado
```

**Notificações (v1.2):**
- Quando o status de um pedido é atualizado, o cliente recebe uma notificação
- Notificações aparecem no ícone de sino (🔔) no topo
- Clique na notificação para ver detalhes do pedido
- Marque como lida ou delete notificações

### Gerenciar Cupons (v1.2)

1. Acesse a aba **"Cupons"**
2. **Criar Cupom:**
   - Clique em "Adicionar Cupom"
   - Preencha:
     - **Código** (único, será convertido para maiúsculas)
     - **Descrição** (opcional)
     - **Tipo de Desconto:** Porcentagem ou Valor Fixo
     - **Valor do Desconto**
     - **Desconto Máximo** (apenas para porcentagem)
     - **Compra Mínima** (opcional)
     - **Limite de Usos** (opcional)
     - **Data de Início** e **Data de Término**
     - **Status:** Ativo ou Inativo
   - Clique em "Criar Cupom"

3. **Editar Cupom:**
   - Clique no ícone de **lápis** na linha do cupom
   - Altere os campos desejados
   - Clique em "Atualizar Cupom"

4. **Deletar Cupom:**
   - Clique no ícone de **lixeira**
   - Confirme a ação

**Tipos de Desconto:**
- **Porcentagem:** Desconto percentual (ex: 10% de desconto)
- **Valor Fixo:** Desconto em valor (ex: R$ 10,00 de desconto)

**Validações:**
- Cupom deve estar ativo
- Deve estar dentro do período de validade
- Não deve ter atingido o limite de usos
- Total do pedido deve ser maior ou igual à compra mínima

### Gerenciar Categorias

1. Acesse a aba **"Categorias"**
2. **Criar Categoria:**
   - Clique em "Adicionar Categoria"
   - Preencha:
     - **Nome:** Ex: "Vestidos"
     - **Slug:** Será gerado automaticamente ou defina manualmente
     - **Descrição:** (opcional)
   - Clique em "Adicionar Categoria"

3. **Editar Categoria:**
   - Clique no ícone de **lápis**
   - Altere nome, slug ou descrição
   - Clique em "Atualizar Categoria"

4. **Deletar Categoria:**
   - Clique no ícone de **lixeira**
   - ⚠️ Produtos associados podem ser afetados
   - Confirme a ação

### Gerenciar Usuários

1. Acesse a aba **"Usuários"**
2. **Visualizar Usuários:**
   - Veja todos os usuários cadastrados
   - Informações exibidas:
     - Nome, Email, Tipo (Admin/Cliente)
     - Quantidade de pedidos
     - Data de cadastro

3. **Editar Usuário:**
   - Clique no ícone de **lápis**
   - Altere nome ou email
   - Marque/desmarque "Usuário Administrador"
   - ⚠️ Você não pode remover seu próprio status de admin
   - Clique em "Atualizar Usuário"

4. **Deletar Usuário:**
   - Clique no ícone de **lixeira**
   - ⚠️ Você não pode deletar seu próprio usuário
   - ⚠️ Pedidos associados serão mantidos
   - Confirme a ação

### Relatórios de Vendas

1. Acesse a aba **"Relatórios"**
2. **Configurar Filtros:**
   - **Data Inicial:** Seleciona o início do período
   - **Data Final:** Seleciona o fim do período
   - **Status:** Filtra por status de pedido (opcional)
   - O período padrão é os últimos 30 dias

3. **Visualizar Relatório:**
   - **Cards de Resumo:**
     - Total de Pedidos
     - Receita Total
     - Total de Itens Vendidos
     - Ticket Médio
   - **Distribuição por Status:** Quantidade de pedidos por status
   - **Lista de Pedidos:** Últimos 20 pedidos do período

4. **Exportar CSV:**
   - Clique em **"Exportar CSV"**
   - O arquivo será baixado automaticamente
   - Nome do arquivo: `relatorio-vendas-YYYY-MM-DD.csv`
   - O arquivo pode ser aberto no Excel ou Google Sheets

**Colunas do CSV:**
- ID Pedido, Data, Cliente, Email
- Produto, Quantidade, Tamanho, Cor
- Preço Unitário, Subtotal
- Total Pedido, Status, Método de Pagamento

---

## ❓ FAQ

### Como resetar minha senha? (v1.2)

1. Na página de login, clique em **"Esqueceu sua senha?"**
2. Digite seu email cadastrado
3. Você receberá um email com link para redefinir senha (verifique o console em desenvolvimento)
4. Clique no link recebido por email
5. Digite sua nova senha e confirme
6. Clique em **"Redefinir Senha"**

**Nota:** O link de redefinição expira em 1 hora.

### Posso cancelar um pedido?

Usuários comuns não podem cancelar pedidos diretamente. Entre em contato com o suporte ou aguarde atualização do administrador.

### Como saber o status do meu pedido?

1. Acesse "Meus Pedidos" no menu
2. Visualize o status atual de cada pedido
3. Os status são:
   - **Pendente:** Pedido recebido, aguardando processamento
   - **Processando:** Pedido sendo preparado
   - **Enviado:** Pedido foi despachado
   - **Entregue:** Pedido foi entregue
   - **Cancelado:** Pedido foi cancelado

### Como adicionar produtos sem imagem?

Use uma URL de imagem válida (ex: Unsplash, Imgur, etc.). Em produção, considere implementar upload de arquivos.

### Os produtos têm garantia?

Entre em contato com o suporte para informações sobre garantia e política de trocas.

### Posso comprar sem criar conta?

Não, é necessário criar uma conta para finalizar pedidos. Isso permite rastrear seus pedidos e histórico.

### Como funcionam os descontos?

**Descontos em Produtos:**
- Produtos com preço original mostram o desconto automaticamente
- O desconto é calculado automaticamente (diferença entre preço original e preço atual)

**Cupons de Desconto (v1.2):**
- Você pode usar cupons de desconto durante o checkout
- Digite o código do cupom no campo "Cupom de Desconto"
- Clique em "Aplicar Cupom" para validar
- O desconto será aplicado automaticamente se o cupom for válido
- Cupons podem ser percentuais (ex: 10% de desconto) ou fixos (ex: R$ 10,00 de desconto)
- Alguns cupons têm valor mínimo de compra ou limite de desconto máximo

### O que acontece se o produto estiver sem estoque?

- Você verá a mensagem "Apenas X em estoque" se houver poucas unidades
- Não será possível adicionar ao carrinho se o estoque for zero
- O checkout valida o estoque antes de criar o pedido

---

## 🆘 Suporte

Para dúvidas ou problemas:
- **Email:** contato@primeiratroca.com.br
- **Telefone:** (11) 1234-5678
- **Endereço:** Rua das Flores, 123 - São Paulo, SP

---

---

## 📝 Notas da Versão 1.2

### Novas Funcionalidades

**Para Clientes:**
- ✅ Busca avançada com autocomplete e sugestões em tempo real
- ✅ Filtros múltiplos combinados (categoria, preço, tamanho, cor, estoque)
- ✅ Ordenação avançada (preço, nome, data, destaque)
- ✅ Múltiplas imagens por produto com galeria interativa
- ✅ Cupons de desconto durante o checkout
- ✅ Notificações em tempo real (polling a cada 30s)
- ✅ Recuperação de senha por email

**Para Administradores:**
- ✅ Gerenciamento completo de múltiplas imagens por produto
- ✅ Sistema completo de cupons e descontos
- ✅ Dashboard de analytics avançado com métricas detalhadas
- ✅ Notificações de novos pedidos, estoque baixo e cupons usados
- ✅ Análise de tendências e comparação de períodos

**Melhorias de Performance:**
- ✅ Queries otimizadas com filtros condicionais
- ✅ Busca case-insensitive otimizada
- ✅ Combinação correta de filtros usando AND
- ✅ Validação de parâmetros no frontend

---

**Última atualização:** Janeiro 2025  
**Versão atual:** 1.2.0 (Completa e Testada)

