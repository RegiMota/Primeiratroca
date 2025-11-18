# 🚀 Deploy na VPS Hostgator - Guia Rápido

## 📋 Informações da VPS

- **IP**: 69.6.221.201
- **Porta SSH**: 22022
- **Usuário**: root
- **Domínio**: primeiratrocaecia.com.br

## ⚠️ IMPORTANTE: Configure DNS Primeiro!

Antes de fazer o deploy, configure os DNS no Registro.br:

1. Acesse o painel do Registro.br
2. Vá em "Gerenciar DNS" do domínio `primeiratrocaecia.com.br`
3. Adicione os seguintes registros A:

```
primeiratrocaecia.com.br     → 69.6.221.201
www.primeiratrocaecia.com.br → 69.6.221.201
admin.primeiratrocaecia.com.br → 69.6.221.201
api.primeiratrocaecia.com.br → 69.6.221.201
```

4. **Aguarde a propagação do DNS** (pode levar de 15 minutos a 24 horas)

## 🚀 Passo a Passo do Deploy

### 1. Conectar na VPS

Abra um terminal (PowerShell, CMD ou Git Bash) e execute:

```bash
ssh -p 22022 root@69.6.221.201
```

Quando solicitado, digite a senha: `9277480@mqGFelipe`

### 2. Clonar o Repositório

Na VPS, execute:

```bash
cd /var/www
git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca
cd primeira-troca/ecommerce-roupa-infantil
```

### 3. Executar Script de Deploy

```bash
chmod +x deploy-vps.sh
bash deploy-vps.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Instalar Nginx e Certbot
- ✅ Configurar Nginx
- ✅ Criar arquivo .env.prod com senhas seguras
- ✅ Fazer build e iniciar containers
- ✅ Executar migrações do banco
- ✅ Criar usuário admin
- ✅ Tentar obter certificados SSL (se DNS estiver configurado)

**Tempo estimado**: 10-15 minutos

### 4. Verificar Status

Após o deploy, verifique se tudo está rodando:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Você deve ver 4 containers rodando:
- `primeira-troca-db-prod` (PostgreSQL)
- `primeira-troca-backend-prod` (API)
- `primeira-troca-frontend-prod` (Loja)
- `primeira-troca-admin-prod` (Admin)

### 5. Ver Logs (se necessário)

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔐 Credenciais Padrão

Após o deploy, você terá:

**Admin Panel:**
- Email: `admin@primeiratroca.com.br`
- Senha: `admin`

⚠️ **IMPORTANTE**: O script gerará senhas seguras para PostgreSQL e JWT. **Anote essas senhas** quando o script exibi-las!

## 🌐 URLs Após Deploy

- **Frontend (Loja)**: https://primeiratrocaecia.com.br
- **Admin Panel**: https://admin.primeiratrocaecia.com.br
- **API**: https://api.primeiratrocaecia.com.br/api/health

## 🔒 Obter Certificados SSL (se não foram obtidos automaticamente)

Se os certificados SSL não foram obtidos durante o deploy (DNS não estava configurado), execute:

```bash
certbot --nginx -d primeiratrocaecia.com.br -d www.primeiratrocaecia.com.br
certbot --nginx -d admin.primeiratrocaecia.com.br
certbot --nginx -d api.primeiratrocaecia.com.br
```

## 🔄 Atualizar Código (Futuro)

Quando precisar atualizar o código:

```bash
cd /var/www/primeira-troca/ecommerce-roupa-infantil
git pull origin main
./deploy.sh
```

## 💾 Backup do Banco de Dados

```bash
cd /var/www/primeira-troca/ecommerce-roupa-infantil
chmod +x backup.sh
./backup.sh
```

Os backups serão salvos em `/var/backups/primeira-troca/`

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
nginx -t
systemctl status nginx
```

### Verificar se DNS está configurado

```bash
nslookup primeiratrocaecia.com.br
```

Deve retornar: `69.6.221.201`

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verifique se os containers estão rodando: `docker-compose -f docker-compose.prod.yml ps`
3. Verifique se o DNS está propagado: `nslookup primeiratrocaecia.com.br`

---

**Última atualização**: Janeiro 2025

