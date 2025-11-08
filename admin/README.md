# 🔐 Admin Panel - Primeira Troca
## Versão 2.0 - Painel Administrativo Separado

**Status**: 🚧 Em Desenvolvimento  
**Porta**: 3001 (desenvolvimento)  
**URL**: `http://localhost:3001` (desenvolvimento)

---

## 📋 Overview

Este é o painel administrativo separado do site principal, criado na **Versão 2.0** para maior segurança e isolamento.

### Características

- ✅ **Aplicação React separada** do site principal
- ✅ **Build independente** usando Vite
- ✅ **Autenticação própria** com validação de admin
- ✅ **URL separada** (porta 3001 em desenvolvimento)
- ✅ **Rotas protegidas** com validação de admin

---

## 🚀 Desenvolvimento

### Instalação de Dependências

```bash
# Instalar dependências do admin
cd admin
npm install
```

### Executar em Desenvolvimento

```bash
# Na pasta admin/
npm run dev
```

O admin estará disponível em: `http://localhost:3001`

### Build para Produção

```bash
# Na pasta admin/
npm run build
```

Os arquivos serão gerados em `admin/dist/`

---

## 📁 Estrutura

```
admin/
├── src/
│   ├── components/       # Componentes React do admin
│   │   ├── ui/          # Componentes Shadcn UI
│   │   ├── AdminLayout.tsx
│   │   └── ...
│   ├── pages/           # Páginas do admin
│   │   ├── LoginPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminProductsPage.tsx
│   │   └── ...
│   ├── contexts/         # Contextos React
│   │   └── AuthContext.tsx
│   ├── lib/             # Utilitários
│   │   ├── api.ts
│   │   └── validation.ts
│   ├── App.tsx          # App principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔐 Autenticação

O admin requer:
- ✅ Usuário autenticado
- ✅ Usuário com `isAdmin: true`
- ✅ Token válido no localStorage (`admin_token`)

Se o usuário não for admin, será redirecionado para `/login`.

---

## 🔗 API

O admin se conecta à mesma API do site principal (`http://localhost:5000/api`), mas:
- ✅ Usa token separado (`admin_token`)
- ✅ Todas as rotas `/api/admin/*` requerem validação de admin
- ✅ Middleware adicional de segurança (em desenvolvimento)

---

## 🛠️ Configuração

### Variáveis de Ambiente

Criar arquivo `.env` na pasta `admin/`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📝 Notas

- O admin compartilha componentes UI com o site principal via alias `@shared` (opcional)
- Todos os componentes admin estão em `admin/src/`
- Build separado permite deploy independente
- URL separada dificulta bots e scanners

---

---

## 📚 Documentação Adicional

- [Documentação de Acesso](./DOCUMENTACAO_ACESSO.md) - Guia completo de acesso e segurança
- [Cronograma V2.0](../CRONOGRAMA_V2.0.md) - Timeline de desenvolvimento
- [Progresso V2.0](../PROGRESSO_V2.0.md) - Status atual do projeto

---

**Última Atualização**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Concluído (Fase 1 - 100%)

