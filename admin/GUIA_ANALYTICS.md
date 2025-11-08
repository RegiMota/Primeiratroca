# 📊 Guia de Uso - Analytics Avançado
## Versão 2.0 - Módulo 7: Analytics Avançado

**Data**: Janeiro 2025  
**Status**: ✅ Funcional

---

## 🎯 Como Acessar

### 1. Acesse o Painel Admin
```
URL: http://localhost:3001/analytics
```
(ou sua URL de produção)

### 2. Faça Login
- Use suas credenciais de administrador
- Você precisa ter permissão de admin

---

## 📑 Abas Disponíveis

A página de Analytics possui **3 abas principais**:

### 1️⃣ **Visão Geral** (Overview)
- Métricas gerais da loja
- Receita total, pedidos, ticket médio
- Produtos mais vendidos
- Categorias mais populares
- Horários de pico

### 2️⃣ **Funil de Conversão** (Funnel)
- Visualização do funil de vendas
- Taxas de conversão por etapa
- Análise de abandono de carrinho
- Distribuição por status de pedido

### 3️⃣ **Comportamento** (Behavior) ⭐
**Esta é a aba que você está procurando!**

---

## 🔍 Análise de Comportamento - Onde Encontrar

### Localização Visual:

```
┌─────────────────────────────────────────────────────────┐
│  Analytics                                              │
│  Análise de dados e métricas da loja                   │
│                                    [Exportar CSV] [JSON]│
├─────────────────────────────────────────────────────────┤
│  [Visão Geral] [Funil de Conversão] [Comportamento] ←─── Clique aqui! │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Métricas Principais                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ ⏱ Tempo │ │ 🛒 Tam.  │ │ 👥 Taxa  │ │ 📈 Clien.│  │
│  │  Médio  │ │  Médio   │ │ Retorno  │ │ Recorren.│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  📈 Padrão de Compras por Horário do Dia               │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Gráfico de linha (0h - 23h)                    │  │
│  │  Mostra: Pedidos e Receita por hora              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📅 Padrão de Compras por Dia da Semana               │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Gráfico de barras (Dom - Sáb)                   │  │
│  │  Mostra: Pedidos e Receita por dia               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ 🏆 Top Produtos  │  │ 📊 Top Categorias │          │
│  │  Visualizados    │  │  Populares       │          │
│  │  (Lista Top 10)  │  │  (Gráfico Pizza) │          │
│  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Funcionalidades na Aba "Comportamento"

### 1. **Métricas Principais** (Cards no Topo)

#### ⏱️ Tempo Médio
- **O que mostra**: Tempo médio entre criação e conclusão do pedido
- **Unidade**: Horas
- **Útil para**: Identificar gargalos no processo de entrega

#### 🛒 Tamanho Médio
- **O que mostra**: Quantidade média de itens por carrinho
- **Unidade**: Número decimal
- **Útil para**: Entender padrões de compra

#### 👥 Taxa de Retorno
- **O que mostra**: Percentual de clientes que compram mais de uma vez
- **Unidade**: Percentual (%)
- **Útil para**: Medir fidelidade dos clientes

#### 📈 Clientes Recorrentes
- **O que mostra**: Número total de clientes com mais de 1 compra
- **Unidade**: Número inteiro
- **Útil para**: Identificar clientes fiéis

---

### 2. **Padrão por Horário do Dia**

#### 📈 Gráfico de Linha
- **Eixo X**: Horas do dia (0h às 23h)
- **Eixo Y Esquerdo**: Número de pedidos
- **Eixo Y Direito**: Receita (R$)
- **Linhas**:
  - 🔵 Azul: Pedidos por hora
  - 🟢 Verde: Receita por hora

#### 📊 O que você pode ver:
- Horários de pico de vendas
- Horários com maior receita
- Padrões de comportamento ao longo do dia

---

### 3. **Padrão por Dia da Semana**

#### 📊 Gráfico de Barras
- **Eixo X**: Dias da semana (Domingo, Segunda, ..., Sábado)
- **Eixo Y Esquerdo**: Número de pedidos
- **Eixo Y Direito**: Receita (R$)
- **Barras**:
  - 🔵 Azul: Pedidos por dia
  - 🟢 Verde: Receita por dia

#### 📊 O que você pode ver:
- Dias da semana com mais vendas
- Dias com maior receita
- Padrões semanais de compra

---

### 4. **Top Produtos Visualizados**

#### 📋 Lista dos Top 10
- **Colunas**:
  - Badge com posição (1, 2, 3, ...)
  - Nome do produto
  - Badge com número de visualizações

#### 📊 O que você pode ver:
- Produtos mais populares
- Produtos que geram mais interesse
- Tendências de visualização

---

### 5. **Top Categorias**

#### 🥧 Gráfico de Pizza
- **Visualização**: Gráfico de pizza (pie chart)
- **Dados**: Receita por categoria
- **Cores**: Diferentes cores para cada categoria
- **Labels**: Nome da categoria e percentual

#### 📊 O que você pode ver:
- Categorias que geram mais receita
- Distribuição percentual de vendas
- Categorias mais populares

---

## 🔧 Filtros

### Período de Análise
- **Data Inicial**: Selecione a data inicial
- **Data Final**: Selecione a data final
- **Botão "Atualizar"**: Recarrega os dados com o período selecionado

**Padrão**: Últimos 30 dias

---

## 📥 Exportação de Dados

### Botões no Topo da Página
- **Exportar CSV**: Exporta dados em formato CSV (Excel)
- **Exportar JSON**: Exporta dados em formato JSON

### O que é exportado:
- Todos os pedidos do período
- Detalhes de produtos
- Informações de clientes
- Categorias
- Cupons utilizados

---

## 💡 Dicas de Uso

### 1. **Identificar Horários de Pico**
- Use o gráfico de horário para ver quando há mais vendas
- Otimize campanhas para esses horários

### 2. **Analisar Padrões Semanais**
- Use o gráfico de dias da semana para identificar dias mais vendidos
- Planeje promoções para dias com menor movimento

### 3. **Top Produtos**
- Use a lista de top produtos para identificar produtos populares
- Destaque esses produtos na homepage

### 4. **Categorias Populares**
- Use o gráfico de pizza para ver quais categorias vendem mais
- Foque em expandir essas categorias

### 5. **Taxa de Retorno**
- Monitore a taxa de retorno para medir fidelidade
- Melhore a experiência do cliente se a taxa estiver baixa

---

## 🐛 Troubleshooting

### Problema: Dados não aparecem
**Solução**: 
- Verifique se há pedidos no período selecionado
- Verifique se o servidor está rodando
- Verifique o console do navegador para erros

### Problema: Gráficos não carregam
**Solução**:
- Verifique se há dados suficientes
- Tente recarregar a página
- Verifique a conexão com o backend

### Problema: Exportação não funciona
**Solução**:
- Verifique se há dados no período
- Verifique o console do navegador
- Tente exportar um período menor

---

## 📞 Suporte

Se tiver problemas ou dúvidas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do servidor
3. Consulte a documentação técnica

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0

