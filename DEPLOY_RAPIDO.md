# ⚡ Deploy Rápido - VPS

## 🚀 Passos Rápidos

### 1. Na sua VPS, instale Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone o repositório:

```bash
cd /var/www
sudo git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca
cd primeira-troca/ecommerce-roupa-infantil
sudo chown -R $USER:$USER .
```

### 3. Configure variáveis de ambiente:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

**IMPORTANTE**: Ajuste:
- `POSTGRES_PASSWORD` - Senha forte para o banco
- `JWT_SECRET` - Gere uma chave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `VITE_API_URL` - URL da sua API (ex: `https://api.seudominio.com.br`)

### 4. Configure domínios no DNS:

Aponte para o IP da sua VPS:
- `seudominio.com.br` → IP da VPS
- `www.seudominio.com.br` → IP da VPS
- `admin.seudominio.com.br` → IP da VPS
- `api.seudominio.com.br` → IP da VPS

### 5. Instale Nginx e Certbot:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 6. Configure Nginx (temporário para SSL):

Crie os arquivos em `/etc/nginx/sites-available/`:

**Frontend** (`primeira-troca-frontend`):
```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
```

**Admin** (`primeira-troca-admin`):
```nginx
server {
    listen 80;
    server_name admin.seudominio.com.br;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
    }
}
```

**API** (`primeira-troca-api`):
```nginx
upstream backend {
    server localhost:5000;
}
server {
    listen 80;
    server_name api.seudominio.com.br;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

Habilite:
```bash
sudo ln -s /etc/nginx/sites-available/primeira-troca-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/primeira-troca-admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/primeira-troca-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Obtenha certificados SSL:

```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
sudo certbot --nginx -d admin.seudominio.com.br
sudo certbot --nginx -d api.seudominio.com.br
```

### 8. Faça o deploy:

```bash
chmod +x deploy.sh
./deploy.sh
```

### 9. Verifique:

- Frontend: https://seudominio.com.br
- Admin: https://admin.seudominio.com.br
- API: https://api.seudominio.com.br/api/health

## 🔧 Comandos Úteis

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Backup
chmod +x backup.sh
./backup.sh

# Atualizar código
git pull origin main
./deploy.sh
```

## 📚 Documentação Completa

Veja `DEPLOY_VPS.md` para guia detalhado.

