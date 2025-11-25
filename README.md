# Cloud Reader

Aplicação Cloud Reader com backend em Go (Gin) e frontend em Next.js.

## Estrutura do Projeto

```
cloud-reader/
├── backend/          # Backend em Go com Gin
├── frontend/         # Frontend em Next.js
└── README.md         # Este arquivo
```

## Requisitos

### Backend
- Go 1.21 ou superior

### Frontend
- Node.js 18 ou superior
- npm ou yarn

## Instalação e Execução

### Backend

```bash
cd backend
go mod download
go run main.go
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

- **Backend**: Go, Gin Framework
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS

## Desenvolvimento

1. Inicie o backend primeiro
2. Em seguida, inicie o frontend
3. O frontend já está configurado para se conectar ao backend na porta 8080

