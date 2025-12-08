# Dockerfile unificado para desenvolvimento e produção
ARG BUILD_ENV=development
ARG NEXT_PUBLIC_API_URL

# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm ci

# Copia o código fonte
COPY . .

# Variáveis de ambiente para build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Build da aplicação Next.js
RUN npm run build

# Estágio final - desenvolvimento
FROM node:18-alpine AS development

WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json* ./

# Instala dependências (incluindo devDependencies para hot reload)
RUN npm install

# Copia o código fonte
COPY . .

# Ajusta permissões
RUN chmod -R 755 /app

EXPOSE 3000

# Comando para desenvolvimento (hot reload)
CMD ["npm", "run", "dev"]

# Estágio final - produção
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos do build
# O Next.js standalone coloca tudo em .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Criar diretório public (Next.js standalone já inclui o necessário, public é opcional)
RUN mkdir -p ./public && chown nextjs:nodejs ./public

# Verificar estrutura e encontrar server.js
RUN echo "=== Estrutura do diretório /app ===" && \
    ls -la /app/ && \
    echo "=== Procurando server.js ===" && \
    find /app -name "server.js" -type f 2>/dev/null || echo "server.js não encontrado" && \
    echo "=== Conteúdo de .next/standalone (se existir) ===" && \
    ls -la /app/.next/standalone/ 2>/dev/null || echo ".next/standalone não existe"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Variável de ambiente para API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Tentar encontrar e executar server.js, ou usar npm start como fallback
CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f .next/standalone/server.js ]; then node .next/standalone/server.js; else echo 'Erro: server.js não encontrado. Estrutura:' && ls -la && exit 1; fi"]

# Seleciona o estágio baseado no BUILD_ENV
FROM ${BUILD_ENV} AS final
