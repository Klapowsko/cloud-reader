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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Criar diretório public (Next.js standalone já inclui o necessário, public é opcional)
RUN mkdir -p ./public && chown nextjs:nodejs ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Variável de ambiente para API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

CMD ["node", "server.js"]

# Seleciona o estágio baseado no BUILD_ENV
FROM ${BUILD_ENV} AS final
