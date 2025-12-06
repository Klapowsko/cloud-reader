FROM golang:1.25-alpine

# Instala dependências necessárias
RUN apk add --no-cache git curl

# Instala Air para live reload (versão compatível com Go 1.22)
# Usando versão v1.40.0 que funciona com Go 1.22
RUN go install github.com/cosmtrek/air@v1.40.0

WORKDIR /app

# Copia go mod files primeiro (para cache de layers)
COPY go.mod ./
COPY go.sum* ./
RUN go mod download

# Copia o código fonte
COPY . .

# Ajusta permissões para garantir acesso quando volumes são montados
RUN chmod -R 755 /app

# Expõe a porta
EXPOSE 8080

# Comando padrão usa Air para live reload
CMD ["air", "-c", ".air.toml"]

