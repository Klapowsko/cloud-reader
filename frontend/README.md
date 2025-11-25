# Cloud Reader - Frontend

Frontend da aplicação Cloud Reader desenvolvido com Next.js 14.

## Requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Scripts

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## Estrutura

```
frontend/
├── app/              # App Router do Next.js
│   ├── layout.tsx    # Layout principal
│   ├── page.tsx      # Página inicial
│   └── globals.css   # Estilos globais
├── package.json       # Dependências
├── tsconfig.json     # Configuração TypeScript
└── README.md         # Documentação
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

