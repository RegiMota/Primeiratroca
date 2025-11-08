# 📝 Notas de Desenvolvimento - Versão 1.2
## Primeira Troca - Decisões e Observações

**Data**: Janeiro 2025  
**Versão**: 1.2.0  
**Status**: 🚧 Em Desenvolvimento

---

## 🔄 Decisões Importantes

### Dia 2 - Setup de Infraestrutura: POSTERGADO

**Data da Decisão**: Janeiro 2025  
**Status**: ⏸️ Postergado para depois

**Motivo**:  
Iniciar desenvolvimento dos módulos imediatamente, sem aguardar configuração de serviços externos.

**Impacto**:  
- Uso de soluções temporárias para imagens (base64, como já funciona para a logo)
- Módulos de emails e notificações serão desenvolvidos sem integração inicial
- Quando configurar os serviços externos, será fácil migrar

**Estratégia Temporária**:
- ✅ **Imagens**: Usar base64 (como já está implementado para a logo)
- ⏳ **Emails**: Desenvolver estrutura, mas não enviar até configurar SendGrid/Nodemailer
- ⏳ **Notificações**: Desenvolver estrutura, mas usar polling temporário até configurar WebSocket
- ⏳ **Cloud Storage**: Migrar de base64 para cloud storage quando configurar

**Quando Configurar**:
- Configurar serviços externos quando necessário para produção
- Ou quando atingir limites do sistema atual (tamanho do banco, etc.)

---

## 🚧 Desenvolvimento Atual

### Módulo 1: Upload de Múltiplas Imagens

**Status**: 🚧 Em Progresso  
**Iniciado**: Janeiro 2025

**Estratégia**:
- Usar base64 temporariamente (igual ao sistema de logo)
- Estrutura preparada para migrar para cloud storage depois
- Quando configurar Cloudinary/S3, será apenas trocar o serviço de upload

**Próximos Passos**:
1. Executar migrations (parar servidor primeiro)
2. Criar rotas backend
3. Criar interface frontend
4. Testar funcionalidade completa

---

## ⚠️ Notas Técnicas

### Prisma Client em Uso

**Problema**:  
`npm run db:generate` falha com `EPERM: operation not permitted` quando o servidor está rodando.

**Solução**:  
Parar o servidor backend antes de executar:
- `npm run db:generate`
- `npm run db:push`

**Causa**:  
O Prisma Client está sendo usado pelo servidor Express, então o Node.js não permite renomear/substituir os arquivos.

---

## 📋 Checklist de Configuração Futura

### Quando Configurar Serviços Externos

**Indicadores**:
- [ ] Banco de dados ficando muito grande (muitas imagens em base64)
- [ ] Necessidade de enviar emails (confirmações, recuperação de senha)
- [ ] Necessidade de notificações em tempo real
- [ ] Preparação para produção

**Serviços a Configurar**:
1. **Cloudinary** ou **AWS S3** (para imagens)
2. **SendGrid** ou **Nodemailer** (para emails)
3. **Socket.io** (para notificações em tempo real)

**Prioridade**: Baixa por enquanto (sistema funciona com soluções temporárias)

---

## 🔄 Estratégia de Migração Futura

### De Base64 para Cloud Storage

**Quando configurar Cloudinary/S3**:
1. Manter compatibilidade com imagens existentes em base64
2. Novas imagens vão para cloud storage
3. Opcional: Migrar imagens antigas (background job)

**Código preparado para migração**:
- Serviço de upload abstrato
- Fácil trocar de base64 para cloud storage
- Sem quebrar imagens existentes

---

## 📝 Notas Adicionais

### Desenvolvimento Incremental

- ✅ Cada módulo desenvolvido e testado isoladamente
- ✅ Sistema atual continua funcionando
- ✅ Backward compatibility garantida
- ✅ Feature flags para ativar/desativar módulos

### Testes

- Testar cada módulo antes de integrar
- Não depender de serviços externos nos testes iniciais
- Configurar serviços apenas quando necessário

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: 🚧 Em Desenvolvimento

---

*Este documento será atualizado conforme decisões forem tomadas durante o desenvolvimento.*

