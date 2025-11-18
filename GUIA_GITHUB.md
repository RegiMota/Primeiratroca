# 📤 Guia: Enviar Projeto para Novo Repositório GitHub

## Passo 1: Criar Novo Repositório no GitHub

1. Acesse https://github.com
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `primeira-troca-v3` (ou o nome que preferir)
   - **Description**: "E-commerce de roupas infantis com Docker e PostgreSQL"
   - **Visibility**: Escolha Public ou Private
   - **NÃO marque** "Initialize this repository with a README" (já temos um)
5. Clique em **"Create repository"**

## Passo 2: Remover Remote Antigo e Adicionar Novo

Execute os seguintes comandos no terminal (na pasta do projeto):

```bash
# Remover o remote antigo
git remote remove origin

# Adicionar o novo remote (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/primeira-troca-v3.git

# Verificar se foi adicionado corretamente
git remote -v
```

## Passo 3: Fazer Push para o Novo Repositório

```bash
# Fazer push da branch main
git push -u origin main
```

Se você receber um erro sobre branches divergentes, use:

```bash
git push -u origin main --force
```

⚠️ **Atenção**: Use `--force` apenas se tiver certeza que quer sobrescrever o repositório remoto.

## Passo 4: Verificar no GitHub

1. Acesse seu repositório no GitHub
2. Verifique se todos os arquivos foram enviados
3. Confirme que o README.md está visível

## 🔄 Comandos Úteis

### Ver status do Git
```bash
git status
```

### Ver histórico de commits
```bash
git log --oneline
```

### Adicionar mais mudanças
```bash
git add .
git commit -m "Sua mensagem de commit"
git push
```

### Criar uma nova branch
```bash
git checkout -b nome-da-branch
git push -u origin nome-da-branch
```

## 📝 Estrutura do Repositório

O repositório inclui:
- ✅ Código fonte completo
- ✅ Configuração Docker
- ✅ Schema do Prisma (PostgreSQL)
- ✅ Scripts utilitários
- ✅ README.md atualizado
- ✅ .gitignore configurado

## ⚠️ Arquivos NÃO Enviados (por segurança)

Os seguintes arquivos são ignorados pelo `.gitignore`:
- `.env` (variáveis de ambiente)
- `node_modules/` (dependências)
- `build/` e `dist/` (arquivos compilados)
- Arquivos de backup (`.backup`, `.bak`)

## 🎉 Pronto!

Seu projeto está agora no GitHub e pronto para ser compartilhado ou deployado!

