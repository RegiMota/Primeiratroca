# 🛍️ Primeira Troca - E-commerce de Roupas Infantis

Loja online completa de roupas infantis com painel administrativo avançado, sistema de pedidos completo, gestão de produtos, categorias, usuários, relatórios de vendas e configurações do site. Desenvolvida com tecnologias modernas e interface 100% em português.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Containerização**: Docker & Docker Compose
- **UI**: Tailwind CSS + Radix UI + Shadcn/ui
- **Autenticação**: JWT
- **Pagamentos**: Asaas (PIX, Boleto, Cartão)
- **Notificações**: Socket.io (tempo real)

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git

## 🐳 Executando com Docker (Recomendado)

### Modo Desenvolvimento

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd ecommerce-roupa-infantil

# Iniciar todos os serviços
docker-compose -f docker-compose.dev.yml up --build
```

### Modo Produção

```bash
docker-compose up --build
```

### Acessos

- **Frontend (Loja)**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### Credenciais Padrão

**Admin:**
- Email: `admin@primeiratroca.com.br`
- Senha: `admin`

## 📦 Estrutura do Projeto

```
ecommerce-roupa-infantil/
├── admin/              # Painel administrativo (React)
├── server/             # Backend API (Express)
├── src/                # Frontend principal (React)
├── prisma/             # Schema e migrations do banco
├── scripts/            # Scripts utilitários
├── Dockerfile          # Dockerfile do backend
├── Dockerfile.frontend.dev  # Dockerfile do frontend (dev)
├── Dockerfile.admin.dev      # Dockerfile do admin (dev)
├── docker-compose.yml  # Configuração Docker (produção)
└── docker-compose.dev.yml   # Configuração Docker (desenvolvimento)
```

## 🔧 Comandos Docker Úteis

```bash
# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar containers
docker-compose -f docker-compose.dev.yml down

# Reconstruir um serviço específico
docker-compose -f docker-compose.dev.yml up --build backend

# Executar comandos dentro dos containers
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

## 🛠️ Desenvolvimento Local (Sem Docker)

### Instalação

```bash
# Instalar dependências
npm install
cd admin && npm install && cd ..

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Configurar banco de dados
npm run db:generate
npm run db:push
npm run db:seed
```

### Executar

```bash
# Backend
npm run dev:server

# Frontend
npm run dev

# Admin
npm run dev:admin
```

## 📚 Funcionalidades

### Para Clientes
- ✅ Navegação e busca de produtos
- ✅ Carrinho de compras
- ✅ Checkout completo
- ✅ Histórico de pedidos
- ✅ Avaliações de produtos
- ✅ Lista de desejos
- ✅ Sistema de tickets/suporte
- ✅ Rastreamento de entregas

### Para Administradores
- ✅ Dashboard com analytics
- ✅ Gerenciamento de produtos e categorias
- ✅ Gerenciamento de pedidos
- ✅ Controle de estoque avançado
- ✅ Sistema de cupons
- ✅ Relatórios de vendas
- ✅ Gerenciamento de usuários
- ✅ Sistema de tickets/suporte
- ✅ Configurações do site

## 🔐 Segurança

- Autenticação JWT
- Rate limiting
- Validação de dados
- CORS configurado
- Middleware de autenticação
- Proteção de rotas admin

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://primeiratroca:primeiratroca123@postgres:5432/primeiratroca?schema=public"

# JWT
JWT_SECRET="sua_chave_secreta_aqui"

# Server
PORT=5000
NODE_ENV=development

# API URL
VITE_API_URL=http://localhost:5000/api

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SendGrid (opcional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- **Equipe Primeira Troca**

## 🙏 Agradecimentos

- Comunidade React
- Prisma
- Docker
- Todos os contribuidores de código aberto

---

**Última atualização**: Janeiro 2025

