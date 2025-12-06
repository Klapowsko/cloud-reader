FROM node:18-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm install

# Copia o código fonte
COPY . .

# Ajusta permissões para garantir acesso quando volumes são montados
RUN chmod -R 755 /app

# Expõe a porta
EXPOSE 3000

# Executa como root para desenvolvimento (aceitável com volumes montados)
# Isso resolve problemas de permissão com volumes do docker-compose
CMD ["npm", "run", "dev"]

