# Cloud Reader - Backend

Backend da aplicação Cloud Reader desenvolvido em Go com Gin.

## Requisitos

- Go 1.21 ou superior

## Instalação

```bash
# Instalar dependências
go mod download

# Executar o servidor
go run main.go
```

O servidor estará disponível em `http://localhost:8080`

## Endpoints

- `GET /health` - Health check
- `GET /api/health` - Health check da API
- `GET /api/v1/` - Endpoint de boas-vindas

## Estrutura

```
backend/
├── main.go          # Arquivo principal
├── go.mod           # Dependências
└── README.md        # Documentação
```

