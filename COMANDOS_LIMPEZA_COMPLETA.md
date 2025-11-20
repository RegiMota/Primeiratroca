# 🧹 Comandos para Limpar Tudo e Começar do Zero

## ⚠️ ATENÇÃO
**Estes comandos vão apagar TUDO:**
- Todos os containers Docker
- Todas as imagens Docker  
- Todos os volumes Docker (banco de dados será apagado!)
- Todas as redes Docker
- Todo o código do repositório

## 🚀 Executar no Servidor

### Opção 1: Usar o Script Automático

```bash
cd /root
git clone https://github.com/RegiMota/Primeiratroca.git temp-clone
cd temp-clone
chmod +x limpar-tudo-e-recomecar.sh
./limpar-tudo-e-recomecar.sh
```

### Opção 2: Comandos Manuais (Passo a Passo)

```bash
# 1. Ir para o diretório home
cd /root

# 2. Parar e remover todos os containers
docker-compose -f Primeiratroca/docker-compose.yml down -v 2>/dev/null
docker stop $(docker ps -aq) 2>/dev/null
docker rm -f $(docker ps -aq) 2>/dev/null

# 3. Remover todas as imagens
docker rmi -f $(docker images -q) 2>/dev/null

# 4. Remover todos os volumes (CUIDADO: apaga banco de dados!)
docker volume rm $(docker volume ls -q) 2>/dev/null

# 5. Remover todas as redes
docker network prune -f

# 6. Limpeza completa do Docker
docker system prune -a -f --volumes

# 7. Remover diretório do projeto
rm -rf Primeiratroca

# 8. Clonar repositório novamente
git clone https://github.com/RegiMota/Primeiratroca.git
cd Primeiratroca

# 9. Verificar que está tudo limpo
docker ps -a
docker images
docker volume ls
```

## 🔄 Após Limpar - Configurar do Zero

```bash
cd /root/Primeiratroca

# 1. Verificar se tem arquivo .env
ls -la .env

# 2. Se não tiver, criar .env baseado no .env.example (se existir)
# Ou criar manualmente:
cat > .env <<EOF
# Database
DATABASE_URL=postgresql://primeiratroca:primeiratroca123@postgres:5432/primeiratroca?schema=public

# JWT
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao

# Node
NODE_ENV=production
PORT=5000

# Asaas
ASAAS_API_KEY=seu_token_asaas_aqui
ASAAS_ENVIRONMENT=production

# WebSocket (opcional)
SOCKET_IO_ENABLED=true
WEBSOCKET_CORS_ORIGIN=https://primeiratrocaecia.com.br
EOF

# 3. Construir e iniciar containers
docker-compose up -d --build

# 4. Aguardar tudo inicializar (60 segundos)
echo "Aguardando containers inicializarem..."
sleep 60

# 5. Verificar status
docker-compose ps

# 6. Ver logs
docker-compose logs -f
```

## ✅ Verificação Pós-Instalação

```bash
# 1. Verificar containers
docker-compose ps
# Todos devem estar "Up" e saudáveis

# 2. Verificar logs do backend
docker-compose logs backend | tail -50
# Não deve ter erros de autenticação

# 3. Testar backend
curl http://localhost:5000/api/health
# Ou
curl http://localhost:5000/

# 4. Verificar banco
docker-compose exec postgres psql -U primeiratroca -d primeiratroca -c "SELECT version();"

# 5. Verificar frontend
curl http://localhost:3000

# 6. Verificar admin
curl http://localhost:8081
```

## 📝 Notas Importantes

- **Backup**: Se tiver dados importantes, faça backup antes:
  ```bash
  docker-compose exec postgres pg_dump -U primeiratroca primeiratroca > backup.sql
  ```

- **Variáveis de Ambiente**: Configure todas as variáveis necessárias no `.env`

- **Tempo**: A primeira inicialização pode levar 2-3 minutos

- **Logs**: Sempre verifique os logs após iniciar:
  ```bash
  docker-compose logs -f
  ```

## 🎯 Checklist Final

Após executar tudo:

- [ ] Docker está limpo (sem containers/imagens antigas)
- [ ] Repositório foi clonado novamente
- [ ] Arquivo `.env` está configurado
- [ ] Containers estão rodando (`docker-compose ps`)
- [ ] Backend está respondendo
- [ ] Banco de dados está acessível
- [ ] Frontend está acessível
- [ ] Admin está acessível

