# Cloud Reader

Aplicação Cloud Reader com backend em Go (Gin) e frontend em Next.js.

## Estrutura do Projeto

```
cloud-reader/
├── backend/          # Backend em Go com Gin (Arquitetura Hexagonal)
├── frontend/         # Frontend em Next.js
├── docker-compose.yml # Configuração Docker Compose
└── README.md         # Este arquivo
```

## Requisitos

- Docker e Docker Compose instalados

## Instalação e Execução com Docker

### Opção 1: Usando Docker Compose (Recomendado)

```bash
# Inicia todos os serviços (backend, frontend, postgres)
make up

# Ou usando docker-compose diretamente
docker-compose up -d
```

Os serviços estarão disponíveis em:
- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### Comandos úteis

```bash
# Ver logs
make logs
# ou
docker-compose logs -f

# Parar serviços
make down
# ou
docker-compose down

# Reconstruir imagens
make build
# ou
docker-compose build

# Limpar tudo (containers, volumes, imagens)
make clean
```

### Configuração

Crie um arquivo `.env` na raiz do projeto (opcional, valores padrão serão usados):

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cloud_reader
DB_PORT=5432
SERVER_PORT=8080
FRONTEND_PORT=3000
ENVIRONMENT=development
```

## Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

O servidor estará disponível em `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Tecnologias

- **Backend**: Go 1.21+, Gin Framework, GORM, PostgreSQL, Arquitetura Hexagonal
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **DevOps**: Docker, Docker Compose, Air (live reload)

## Features

- ✅ Live reload no backend (Air)
- ✅ Hot reload no frontend (Next.js)
- ✅ Migrations automáticas do banco de dados (GORM AutoMigrate)
- ✅ Arquitetura hexagonal modular
- ✅ Injeção de dependência (Wire)

