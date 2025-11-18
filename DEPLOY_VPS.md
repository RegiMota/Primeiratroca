# 🚀 Guia de Deploy - VPS com Domínio

Este guia explica como fazer o deploy do projeto Primeira Troca em uma VPS com domínio próprio.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Domínio configurado apontando para o IP da VPS
- Acesso SSH à VPS
- Usuário com permissões sudo

## 🔧 Passo 1: Configurar VPS

### 1.1 Conectar via SSH

```bash
ssh usuario@seu-ip-vps
```

### 1.2 Atualizar sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Docker e Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version

# Reiniciar sessão SSH para aplicar mudanças
exit
# Conecte novamente
```

### 1.4 Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.5 Instalar Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 📦 Passo 2: Preparar Projeto na VPS

### 2.1 Clonar repositório

```bash
cd /var/www
sudo git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca
cd primeira-troca/ecommerce-roupa-infantil
sudo chown -R $USER:$USER .
```

### 2.2 Criar arquivo .env de produção

```bash
nano .env.prod
```

Cole o seguinte conteúdo (ajuste conforme necessário):

```env
# Database
POSTGRES_USER=primeiratroca
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_DB=primeiratroca

# JWT Secret (GERE UMA CHAVE FORTE!)
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=SUA_CHAVE_SECRETA_MUITO_FORTE_AQUI

# API URL (ajuste com seu domínio)
VITE_API_URL=https://api.seudominio.com.br

# Node Environment
NODE_ENV=production

# Cloudinary (opcional - para upload de imagens)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SendGrid (opcional - para envio de emails)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@seudominio.com.br
SENDGRID_FROM_NAME=Primeira Troca

# Asaas (opcional - para pagamentos)
ASAAS_API_KEY=
ASAAS_ENVIRONMENT=production

# Porta do servidor
PORT=5000
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

## 🔒 Passo 3: Configurar SSL/HTTPS

### 3.1 Configurar Nginx para Let's Encrypt

Primeiro, configure os arquivos nginx básicos (sem SSL):

```bash
# Editar configuração do frontend
sudo nano /etc/nginx/sites-available/primeira-troca-frontend
```

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Editar configuração do admin
sudo nano /etc/nginx/sites-available/primeira-troca-admin
```

```nginx
server {
    listen 80;
    server_name admin.seudominio.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Editar configuração da API
sudo nano /etc/nginx/sites-available/primeira-troca-api
```

```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name api.seudominio.com.br;

    client_max_body_size 10M;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3.2 Habilitar sites

```bash
sudo ln -s /etc/nginx/sites-available/primeira-troca-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/primeira-troca-admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/primeira-troca-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.3 Obter certificados SSL

```bash
# Frontend
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br

# Admin
sudo certbot --nginx -d admin.seudominio.com.br

# API
sudo certbot --nginx -d api.seudominio.com.br
```

Certbot irá configurar automaticamente o SSL e renovação automática.

## 🐳 Passo 4: Deploy com Docker

### 4.1 Build e iniciar containers

```bash
cd /var/www/primeira-troca/ecommerce-roupa-infantil

# Carregar variáveis de ambiente
export $(cat .env.prod | xargs)

# Build e iniciar
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 4.2 Executar migrações e seed

```bash
# Executar migrações
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Criar usuário admin (se necessário)
docker-compose -f docker-compose.prod.yml exec backend node scripts/check-admin.js
```

### 4.3 Verificar logs

```bash
# Ver logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔄 Passo 5: Atualizar Nginx para usar containers

Após os containers estarem rodando, atualize as configurações do Nginx:

```bash
# Frontend
sudo nano /etc/nginx/sites-available/primeira-troca-frontend
```

Altere `proxy_pass http://localhost:3000;` para usar o container:

```nginx
location / {
    proxy_pass http://localhost:8080;  # Porta do container frontend
    # ... resto da configuração
}
```

Faça o mesmo para admin (porta 8081) e API (porta 5000).

## 📝 Passo 6: Scripts de Gerenciamento

### 6.1 Criar script de deploy

```bash
nano deploy.sh
```

```bash
#!/bin/bash
cd /var/www/primeira-troca/ecommerce-roupa-infantil
git pull origin main
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
echo "✅ Deploy concluído!"
```

```bash
chmod +x deploy.sh
```

### 6.2 Criar script de backup

```bash
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/primeira-troca"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U primeiratroca primeiratroca > $BACKUP_DIR/db_$DATE.sql

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/db_*.sql | tail -n +8 | xargs rm -f

echo "✅ Backup criado: $BACKUP_DIR/db_$DATE.sql"
```

```bash
chmod +x backup.sh
```

## 🔍 Passo 7: Verificação

### 7.1 Verificar containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 7.2 Testar URLs

- Frontend: https://seudominio.com.br
- Admin: https://admin.seudominio.com.br
- API: https://api.seudominio.com.br/api/health

### 7.3 Verificar SSL

```bash
# Verificar certificados
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run
```

## 🔧 Comandos Úteis

```bash
# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Atualizar código
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Backup manual
./backup.sh

# Acessar banco de dados
docker-compose -f docker-compose.prod.yml exec postgres psql -U primeiratroca -d primeiratroca
```

## 🛡️ Segurança

1. **Firewall**: Configure UFW
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Senhas Fortes**: Use senhas fortes para PostgreSQL e JWT_SECRET

3. **Atualizações**: Mantenha o sistema atualizado
```bash
sudo apt update && sudo apt upgrade -y
```

## 📊 Monitoramento

Considere usar:
- **PM2** para monitorar processos Node.js
- **Docker stats** para monitorar recursos
- **Logs** do Nginx e Docker

## 🆘 Troubleshooting

### Containers não iniciam
```bash
docker-compose -f docker-compose.prod.yml logs
```

### Erro de conexão com banco
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U primeiratroca
```

### Nginx não funciona
```bash
sudo nginx -t
sudo systemctl status nginx
```

---

**Última atualização**: Janeiro 2025

