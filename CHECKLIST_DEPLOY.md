# ✅ Checklist de Deploy - VPS Hostgator

## 📋 Antes de Executar

- [ ] DNS configurado no Registro.br (pode levar algumas horas para propagar)
- [ ] Acesso SSH à VPS funcionando
- [ ] Repositório GitHub público ou acesso configurado

## 🚀 Comandos para Executar

```bash
cd /var/www
git clone https://github.com/RegiMota/Primeiratroca.git primeira-troca
cd primeira-troca/ecommerce-roupa-infantil
chmod +x deploy-vps.sh
bash deploy-vps.sh
```

## ⏱️ O Que Esperar Durante a Execução

### Passo 1: Atualização do Sistema (2-5 min)
- Atualiza pacotes do sistema
- Pode pedir confirmação (digite `y` e Enter)

### Passo 2: Instalação do Docker (3-5 min)
- Baixa e instala Docker
- Adiciona usuário ao grupo docker

### Passo 3: Instalação do Docker Compose (1 min)
- Baixa Docker Compose
- Configura permissões

### Passo 4: Instalação do Nginx e Certbot (2-3 min)
- Instala Nginx (servidor web)
- Instala Certbot (para SSL)

### Passo 5-6: Clonar Repositório (1-2 min)
- Clona código do GitHub
- Configura permissões

### Passo 7: Gerar Senhas (instantâneo)
- Gera senha segura para PostgreSQL
- Gera JWT Secret
- **ANOTE ESSAS SENHAS!**

### Passo 8: Criar .env.prod (instantâneo)
- Cria arquivo de configuração

### Passo 9: Configurar Nginx (instantâneo)
- Cria configurações para frontend, admin e API

### Passo 10: Configurar Firewall (instantâneo)
- Abre portas 22, 80, 443

### Passo 11: Deploy da Aplicação (5-10 min)
- Build das imagens Docker (pode demorar)
- Inicia containers
- Executa migrações do banco
- Cria usuário admin

### Passo 12: Certificados SSL (2-5 min)
- Tenta obter certificados Let's Encrypt
- **Só funciona se DNS estiver configurado!**

## ✅ Após o Deploy

### Verificar Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

Deve mostrar 4 containers rodando:
- `primeira-troca-db-prod`
- `primeira-troca-backend-prod`
- `primeira-troca-frontend-prod`
- `primeira-troca-admin-prod`

### Ver Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Testar URLs

- Frontend: https://primeiratrocaecia.com.br
- Admin: https://admin.primeiratrocaecia.com.br
- API: https://api.primeiratrocaecia.com.br/api/health

## 🔐 Credenciais

**Admin Panel:**
- Email: `admin@primeiratroca.com.br`
- Senha: `admin`

**Senhas Geradas:**
- PostgreSQL Password: (será exibida durante o deploy)
- JWT Secret: (será exibida durante o deploy)

⚠️ **SALVE ESSAS SENHAS EM LOCAL SEGURO!**

## 🆘 Problemas Comuns

### Erro: "DNS não configurado"
- Configure os DNS no Registro.br
- Aguarde propagação (15 min - 24h)
- Execute novamente os certificados SSL manualmente

### Erro: "Cannot connect to Docker daemon"
```bash
# Reiniciar sessão SSH ou executar:
newgrp docker
```

### Erro: "Port already in use"
```bash
# Verificar portas em uso:
netstat -tulpn | grep -E ':(80|443|5000|8080|8081)'
```

### Containers não iniciam
```bash
# Ver logs detalhados:
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### Erro de permissão
```bash
# Ajustar permissões:
chown -R $USER:$USER /var/www/primeira-troca
```

## 📞 Próximos Passos

1. ✅ Verificar se todos os containers estão rodando
2. ✅ Testar acesso às URLs
3. ✅ Fazer login no admin
4. ✅ Configurar serviços opcionais (Cloudinary, SendGrid, Asaas)
5. ✅ Fazer backup inicial

---

**Tempo total estimado**: 15-25 minutos

