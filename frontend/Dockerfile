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

# Copiar package.json e arquivos necessários
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json* ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar node_modules para /tmp como backup (volume pode sobrescrever)
RUN cp -r /app/node_modules /tmp/node_modules && \
    chown -R nextjs:nodejs /tmp/node_modules

# Copiar arquivos do build para /tmp como backup (volume pode sobrescrever)
COPY --from=builder --chown=nextjs:nodejs /app/.next /tmp/.next
# Também copiar para /app (será sobrescrito pelo volume, mas serve como fallback)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Criar diretório public se não existir
RUN mkdir -p ./public && chown nextjs:nodejs ./public

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Variável de ambiente para API
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Script de inicialização: restaura node_modules e .next se volume os sobrescreveu
# Usa o caminho completo do next do backup se o volume sobrescreveu
CMD ["sh", "-c", "if [ ! -d node_modules ] || [ ! -f node_modules/.bin/next ]; then echo 'Restaurando node_modules do container...' && cp -r /tmp/node_modules/* ./node_modules/ 2>/dev/null || cp -r /tmp/node_modules ./node_modules 2>/dev/null || echo 'Aviso: node_modules não encontrado'; fi && if [ ! -d .next ] || [ ! -f .next/BUILD_ID ]; then echo 'Restaurando .next do container...' && cp -r /tmp/.next/* ./.next/ 2>/dev/null || cp -r /tmp/.next ./.next 2>/dev/null || echo 'Aviso: .next não encontrado'; fi && if [ -f /tmp/node_modules/.bin/next ]; then /tmp/node_modules/.bin/next start; elif [ -f node_modules/.bin/next ]; then node_modules/.bin/next start; else echo 'Erro: next não encontrado' && exit 1; fi"]

# Seleciona o estágio baseado no BUILD_ENV
FROM ${BUILD_ENV} AS final
