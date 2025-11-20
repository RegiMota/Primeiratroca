# 🔧 Configurar Nginx no Servidor - Corrigir 502 Bad Gateway

## 🎯 Problema
O webhook pela internet retorna `502 Bad Gateway`, indicando que o nginx não está configurado para apontar para o backend.

## ✅ Solução - Execute no Servidor

### 1. Verificar se Nginx está instalado

```bash
nginx -v
# Ou
which nginx
```

Se não estiver instalado:
```bash
# CentOS/RHEL
yum install -y nginx

# Ubuntu/Debian
apt-get update && apt-get install -y nginx
```

### 2. Verificar configurações existentes

```bash
# Ver arquivos de configuração
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/sites-available/ 2>/dev/null
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

# Ver configuração principal
cat /etc/nginx/nginx.conf | head -20
```

### 3. Criar Configuração para API/Webhook

**Para CentOS/RHEL (usa /etc/nginx/conf.d/):**

```bash
cat > /etc/nginx/conf.d/primeira-troca-api.conf <<'EOF'
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name primeiratrocaecia.com.br www.primeiratrocaecia.com.br;

    client_max_body_size 10M;
    
    # API e Webhook
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

**Para Ubuntu/Debian (usa sites-available/sites-enabled):**

```bash
cat > /etc/nginx/sites-available/primeira-troca <<'EOF'
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name primeiratrocaecia.com.br www.primeiratrocaecia.com.br;

    client_max_body_size 10M;
    
    # API e Webhook
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/primeira-troca /etc/nginx/sites-enabled/
```

### 4. Verificar e Testar Configuração

```bash
# Testar sintaxe do nginx
nginx -t

# Se estiver OK, recarregar nginx
systemctl reload nginx
# Ou
service nginx reload
```

### 5. Verificar Status do Nginx

```bash
# Ver status
systemctl status nginx

# Se não estiver rodando, iniciar
systemctl start nginx
systemctl enable nginx
```

### 6. Testar Novamente

```bash
# Testar webhook pela internet
curl https://primeiratrocaecia.com.br/api/payments/webhook/health

# Testar API
curl https://primeiratrocaecia.com.br/api/health

# Testar frontend
curl https://primeiratrocaecia.com.br
```

## 🔍 Troubleshooting

### Se ainda der 502:

```bash
# 1. Verificar se backend está rodando
docker-compose ps backend

# 2. Verificar se porta 5000 está acessível
netstat -tulpn | grep 5000
# Ou
ss -tulpn | grep 5000

# 3. Ver logs do nginx
tail -f /var/log/nginx/error.log

# 4. Verificar se nginx consegue acessar o backend
curl http://localhost:5000/api/health
```

### Se nginx não conseguir acessar localhost:5000:

O problema pode ser que o Docker está usando uma rede isolada. Nesse caso, use o IP do container:

```bash
# Descobrir IP do container backend
docker inspect primeira-troca-backend | grep IPAddress

# Atualizar configuração do nginx para usar o IP do container
# Em vez de localhost:5000, use o IP encontrado
```

## ✅ Configuração Completa (Recomendada)

Se quiser uma configuração mais completa com SSL/HTTPS:

```bash
# Instalar Certbot (Let's Encrypt)
yum install -y certbot python3-certbot-nginx
# Ou
apt-get install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d primeiratrocaecia.com.br -d www.primeiratrocaecia.com.br

# Isso vai configurar HTTPS automaticamente
```

## 📝 Notas

- O nginx precisa estar rodando e configurado para que o domínio funcione
- A configuração acima aponta `/api/` para o backend na porta 5000
- O frontend fica na raiz (`/`) apontando para porta 3000
- WebSocket está configurado para funcionar via nginx

