# Cloud Reader - Backend

Backend da aplicação Cloud Reader desenvolvido em Go com Gin, seguindo arquitetura hexagonal modular.

## Requisitos

- Go 1.21 ou superior
- PostgreSQL (ou Docker para rodar PostgreSQL)

## Instalação

```bash
# Instalar dependências
go mod download

# Configurar variáveis de ambiente (criar arquivo .env)
# Veja as variáveis necessárias abaixo

# Executar o servidor
go run cmd/server/main.go
```

O servidor estará disponível em `http://localhost:8080`

## Configuração

Crie um arquivo `.env` na raiz do backend com as seguintes variáveis:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=cloud_reader
SERVER_PORT=8080
ENVIRONMENT=development
```

Ou use `DATABASE_URL` diretamente:

```env
DATABASE_URL=host=localhost port=5432 user=postgres password=postgres dbname=cloud_reader sslmode=disable TimeZone=UTC
```

## Endpoints

### Health Check
- `GET /health` - Health check
- `GET /api/health` - Health check da API
- `GET /api/v1/` - Endpoint de boas-vindas

### Autenticação
- `POST /api/v1/auth/register` - Registro de usuário
  ```json
  {
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }
  ```

- `POST /api/v1/auth/login` - Login de usuário
  ```json
  {
    "email": "joao@example.com",
    "password": "senha123"
  }
  ```

## Estrutura do Projeto

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Ponto de entrada da aplicação
├── internal/
│   ├── auth/                    # Módulo de autenticação
│   │   ├── domain/              # Entidades e interfaces de domínio
│   │   ├── application/         # Casos de uso (services)
│   │   └── infrastructure/      # Implementações concretas
│   ├── shared/                  # Código compartilhado
│   │   ├── config/              # Configurações
│   │   ├── database/            # Conexão com banco
│   │   └── middleware/          # Middlewares compartilhados
│   └── wire/                    # Configuração do Wire (DI)
├── pkg/                         # Pacotes externos reutilizáveis
│   └── password/                # Utilitário de hash de senhas
├── go.mod
└── README.md
```

## Arquitetura

O projeto segue a **Arquitetura Hexagonal (Ports & Adapters)** com modularização:

- **Domain**: Entidades e interfaces (ports)
- **Application**: Casos de uso e lógica de negócio
- **Infrastructure**: Implementações concretas (adapters)

Cada módulo (ex: `auth`) é independente e pode ser facilmente estendido ou substituído.

## Tecnologias

- **Go 1.21+**
- **Gin** - Framework web
- **GORM** - ORM para PostgreSQL
- **Wire** - Injeção de dependência
- **bcrypt** - Hash de senhas
- **PostgreSQL** - Banco de dados

