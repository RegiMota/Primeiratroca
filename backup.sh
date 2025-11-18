#!/bin/bash

# Script de Backup do Banco de Dados
# Uso: ./backup.sh

set -e

BACKUP_DIR="/var/backups/primeira-troca"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/primeira-troca/ecommerce-roupa-infantil"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Carregar variáveis de ambiente
cd $PROJECT_DIR
export $(cat .env.prod | grep -v '^#' | xargs)

# Backup do banco de dados
echo "📦 Criando backup do banco de dados..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER:-primeiratroca} ${POSTGRES_DB:-primeiratroca} > $BACKUP_DIR/db_$DATE.sql

# Comprimir backup
echo "🗜️  Comprimindo backup..."
gzip $BACKUP_DIR/db_$DATE.sql

# Manter apenas últimos 7 backups
echo "🧹 Removendo backups antigos..."
ls -t $BACKUP_DIR/db_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null || true

echo "✅ Backup criado: $BACKUP_DIR/db_$DATE.sql.gz"
echo "📊 Backups disponíveis:"
ls -lh $BACKUP_DIR/db_*.sql.gz 2>/dev/null | tail -5

