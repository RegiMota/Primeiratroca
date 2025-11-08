# 📦 Jobs Agendados - Sistema de Estoque Avançado
## Versão 2.0 - Módulo 2

**Status**: ✅ Concluído  
**Versão**: 2.0.0  
**Data**: Janeiro 2025

---

## 📋 Visão Geral

Os jobs agendados (`node-cron`) são responsáveis por automatizar tarefas críticas de gestão de estoque, garantindo que o sistema esteja sempre atualizado e os administradores sejam notificados sobre situações importantes.

---

## 🔧 Jobs Implementados

### Job 1: Verificação de Estoque Baixo

**Frequência**: Diariamente às 9:00 AM  
**Horário**: `0 9 * * *` (Cron expression)  
**Timezone**: `America/Sao_Paulo`

#### Funcionalidade

- Busca todas as variações de produtos com estoque <= `minStock`
- Agrupa variações por produto para evitar notificações duplicadas
- Notifica todos os administradores sobre produtos com estoque baixo
- Inclui detalhes de cada variação (tamanho, cor, estoque atual, estoque mínimo)

#### Exemplo de Notificação

```
Título: Estoque Baixo: Macacão Infantil
Descrição: Variações com estoque baixo: P/Rosa: 3 (mín: 5), M/Azul: 2 (mín: 5)
```

#### Métodos Utilizados

- `StockService.getLowStockVariants()` - Busca variações com estoque baixo
- `NotificationService.createNotification()` - Cria notificação para admins

---

### Job 2: Liberação de Estoque Reservado Expirado

**Frequência**: A cada 15 minutos  
**Horário**: `*/15 * * * *` (Cron expression)  
**Timezone**: `America/Sao_Paulo`

#### Funcionalidade

- Busca pedidos com status `pending` criados há mais de 15 minutos
- Libera estoque reservado de cada item do pedido
- Cancela automaticamente pedidos expirados
- Notifica o usuário sobre o cancelamento

#### Fluxo de Execução

1. Busca pedidos pendentes há mais de 15 minutos
2. Para cada pedido:
   - Busca variação correspondente a cada item
   - Libera estoque reservado usando `StockService.releaseStock()`
   - Atualiza status do pedido para `cancelled`
   - Notifica o usuário sobre o cancelamento

#### Métodos Utilizados

- `StockService.getVariantByProductSizeColor()` - Busca variação por produto/tamanho/cor
- `StockService.releaseStock()` - Libera estoque reservado
- `NotificationService.createNotification()` - Notifica usuário sobre cancelamento

---

## ⚙️ Configuração

### Habilitar Jobs

Os jobs são habilitados automaticamente em produção ou quando a variável de ambiente `ENABLE_JOBS=true` está definida.

#### Desenvolvimento

```bash
# No arquivo .env
ENABLE_JOBS=true
```

#### Produção

Os jobs são habilitados automaticamente quando `NODE_ENV=production`.

### Desabilitar Jobs

Remova ou defina `ENABLE_JOBS=false` (ou não defina a variável) em desenvolvimento.

---

## 📝 Logs

### Verificação de Estoque Baixo

```
[StockJob] Iniciando verificação de estoque baixo...
[StockJob] Encontradas 5 variações com estoque baixo
[StockJob] Notificações enviadas para 2 admin(s)
```

### Liberação de Estoque Reservado

```
[StockJob] Iniciando liberação de estoque reservado expirado...
[StockJob] Encontrados 3 pedidos pendentes expirados
[StockJob] Liberado estoque reservado: Variant 12, Order 45, Quantity 2
[StockJob] Pedido 45 cancelado automaticamente (timeout)
[StockJob] 3 reservas de estoque liberadas
```

---

## 🔍 Troubleshooting

### Jobs não estão executando

1. **Verificar variável de ambiente**:
   ```bash
   # Em desenvolvimento
   ENABLE_JOBS=true
   ```

2. **Verificar logs do servidor**:
   - Deve aparecer: `✅ Job de verificação de estoque baixo agendado`
   - Deve aparecer: `✅ Job de liberação de estoque reservado agendado`
   - Deve aparecer: `✅ Todos os jobs de estoque inicializados`

3. **Verificar timezone**:
   - Jobs usam `America/Sao_Paulo`
   - Verifique se o servidor está no timezone correto

### Notificações não estão sendo enviadas

1. Verifique se há administradores no banco com `isAdmin: true`
2. Verifique se `NotificationService` está funcionando
3. Verifique logs para erros de notificação

### Estoque não está sendo liberado

1. Verifique se os pedidos estão com status `pending`
2. Verifique se as variações existem e têm `reservedStock > 0`
3. Verifique logs para erros específicos

---

## 📊 Monitoramento

### Métricas Recomendadas

- **Estoque baixo**: Número de variações com estoque baixo
- **Pedidos expirados**: Número de pedidos cancelados automaticamente
- **Estoque liberado**: Quantidade de estoque liberado por período
- **Notificações enviadas**: Número de notificações enviadas para admins

### Dashboard Admin

Os administradores podem visualizar:
- Variações com estoque baixo em tempo real
- Histórico de movimentações de estoque
- Estatísticas de estoque

---

## 🚀 Melhorias Futuras (v2.1+)

- [ ] Job de previsão de reabastecimento (IA)
- [ ] Notificações por email além de notificações in-app
- [ ] Job de sincronização de estoque com sistema externo
- [ ] Dashboard de métricas dos jobs
- [ ] Configuração de horários via painel admin
- [ ] Relatórios automáticos de estoque

---

## 📚 Referências

- [Cron Expression](https://crontab.guru/) - Gerador de expressões cron
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [StockService Documentation](../services/StockService.ts)
- [NotificationService Documentation](../services/NotificationService.ts)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Concluído

