# Cloud Reader

Aplicação Cloud Reader com backend em Go (Gin) e frontend em Next.js.

## Estrutura do Projeto

```
cloud-reader/
├── backend/          # Backend em Go com Gin (Arquitetura Hexagonal)
├── frontend/         # Frontend em Next.js
├── docker compose.yml # Configuração Docker Compose
└── README.md         # Este arquivo
```

## Requisitos

- Docker e Docker Compose instalados

## Instalação e Execução com Docker

### Desenvolvimento

```bash
# 1. Configure os arquivos .env em cada projeto
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# 2. Edite os arquivos .env conforme necessário

# 3. Inicia todos os serviços (backend, frontend, postgres)
make up

# Ou usando docker compose diretamente
docker compose up -d
```

### Produção

```bash
# 1. Configure os arquivos .env.production em cada projeto
# Backend
cp backend/.env.production.example backend/.env.production

# Frontend
cp frontend/.env.production.example frontend/.env.production

# 2. Edite os arquivos .env.production com suas configurações
# IMPORTANTE: No frontend, configure NEXT_PUBLIC_API_URL com o IP do servidor

# 3. Constrói as imagens de produção
make prod-build

# 4. Inicia os serviços de produção
make prod-up
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
docker compose logs -f

# Parar serviços
make down
# ou
docker compose down

# Reconstruir imagens
make build
# ou
docker compose build

# Limpar tudo (containers, volumes, imagens)
make clean
```

### Configuração

#### Desenvolvimento

**Backend:**
1. Copie o arquivo de exemplo:
```bash
cp backend/.env.example backend/.env
```

2. Edite `backend/.env` com suas configurações (valores padrão já estão configurados):
```env
ENVIRONMENT=development
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cloud_reader
SERVER_PORT=8080
```

**Frontend:**
1. Copie o arquivo de exemplo:
```bash
cp frontend/.env.example frontend/.env
```

2. Edite `frontend/.env` com suas configurações:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Produção

**Backend:**
1. Copie o arquivo de exemplo:
```bash
cp backend/.env.production.example backend/.env.production
```

2. Edite `backend/.env.production` com as configurações do servidor:
```env
ENVIRONMENT=production
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI
DB_NAME=cloud_reader
SERVER_PORT=8080
```

**Frontend:**
1. Copie o arquivo de exemplo:
```bash
cp frontend/.env.production.example frontend/.env.production
```

2. Edite `frontend/.env.production` com as configurações do servidor:
```env
# IMPORTANTE: Use o IP do servidor ou domínio onde o backend está rodando
NEXT_PUBLIC_API_URL=http://SEU_IP_OU_DOMINIO:8080
```

**Importante**: O `NEXT_PUBLIC_API_URL` no frontend deve conter o IP ou domínio do servidor onde o backend está rodando, pois essa URL precisa ser acessível do navegador do cliente.

Para mais detalhes sobre configuração Docker, veja [README.DOCKER.md](./README.DOCKER.md).

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

