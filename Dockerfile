# Dockerfile para o Backend (Servidor Node.js)
FROM node:20-alpine

# Instalar dependências do sistema necessárias (incluindo OpenSSL para Prisma)
RUN apk add --no-cache python3 make g++ openssl libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta do servidor
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["npm", "run", "dev:server"]

