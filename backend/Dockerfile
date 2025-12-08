# Dockerfile unificado para desenvolvimento e produção
ARG BUILD_ENV=development

# Estágio de build
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Instala dependências necessárias
RUN apk add --no-cache git

# Copia go mod files primeiro (para cache de layers)
COPY go.mod ./
COPY go.sum* ./
RUN go mod download

# Copia o código fonte
COPY . .

# Build da aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server/main.go

# Estágio final - desenvolvimento
FROM golang:1.25-alpine AS development

# Instala Air para live reload
RUN apk add --no-cache git curl && \
    go install github.com/cosmtrek/air@v1.40.0

WORKDIR /app

# Copia o código fonte para desenvolvimento
COPY . .

# Ajusta permissões
RUN chmod -R 755 /app

EXPOSE 8080

# Comando padrão usa Air para live reload
CMD ["air", "-c", ".air.toml"]

# Estágio final - produção
FROM alpine:latest AS production

# Instala ca-certificates para HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copia o binário do builder
COPY --from=builder /app/server .

# Cria diretório para uploads
RUN mkdir -p /root/uploads/books && \
    chmod -R 755 /root/uploads

EXPOSE 8080

# Comando para executar o servidor
CMD ["./server"]

# Seleciona o estágio baseado no BUILD_ENV
FROM ${BUILD_ENV} AS final
