.PHONY: help up down build restart logs clean prod-up prod-down prod-build prod-logs

# Comando padrão
.DEFAULT_GOAL := help

## help: Mostra esta mensagem de ajuda
help:
	@echo "Comandos disponíveis (Desenvolvimento):"
	@echo ""
	@echo "  make up        - Inicia todos os serviços em modo desenvolvimento"
	@echo "  make down      - Para todos os serviços"
	@echo "  make build     - Constrói as imagens Docker"
	@echo "  make restart   - Reinicia todos os serviços"
	@echo "  make logs      - Mostra os logs de todos os serviços"
	@echo "  make clean     - Remove containers, volumes e imagens"
	@echo ""
	@echo "Comandos disponíveis (Produção):"
	@echo ""
	@echo "  make prod-build - Constrói as imagens Docker para produção"
	@echo "  make prod-up    - Inicia os serviços em modo produção"
	@echo "  make prod-down  - Para os serviços de produção"
	@echo "  make prod-logs  - Mostra os logs dos serviços de produção"
	@echo ""

## up: Inicia todos os serviços em modo desenvolvimento
up:
	@echo "🚀 Iniciando serviços (desenvolvimento)..."
	@if [ ! -f backend/.env ] || [ ! -f frontend/.env ]; then \
		echo "⚠️  Arquivos .env não encontrados!"; \
		echo "📝 Execute:"; \
		echo "   cp backend/.env.example backend/.env"; \
		echo "   cp frontend/.env.example frontend/.env"; \
		exit 1; \
	fi
	ENVIRONMENT=development docker compose up -d
	@echo "✅ Serviços iniciados!"
	@echo ""
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@echo "PostgreSQL: localhost:5432"

## down: Para todos os serviços
down:
	@echo "🛑 Parando serviços..."
	docker compose down

## build: Instala dependências e constrói as imagens Docker
build:
	@echo ""
	@echo "🔨 Construindo imagens Docker..."
	docker compose build
	@echo "✅ Build concluído!"

## restart: Reinicia todos os serviços
restart:
	@echo "🔄 Reiniciando serviços..."
	docker compose restart

## logs: Mostra os logs de todos os serviços
logs:
	docker compose logs -f

## clean: Remove containers, volumes e imagens
clean:
	@echo "🧹 Limpando containers, volumes e imagens..."
	docker compose down -v --rmi all
	@echo "✅ Limpeza concluída!"

## prod-build: Constrói as imagens Docker para produção
prod-build:
	@echo "🔨 Construindo imagens de produção..."
	@if [ ! -f backend/.env.production ] || [ ! -f frontend/.env.production ]; then \
		echo "⚠️  Arquivos .env.production não encontrados!"; \
		echo "📝 Execute:"; \
		echo "   cp backend/.env.production.example backend/.env.production"; \
		echo "   cp frontend/.env.production.example frontend/.env.production"; \
		exit 1; \
	fi
	ENVIRONMENT=production docker compose build
	@echo "✅ Build de produção concluído!"

## prod-up: Inicia os serviços em modo produção
prod-up:
	@echo "🚀 Iniciando serviços (produção)..."
	@if [ ! -f backend/.env.production ] || [ ! -f frontend/.env.production ]; then \
		echo "⚠️  Arquivos .env.production não encontrados!"; \
		echo "📝 Execute:"; \
		echo "   cp backend/.env.production.example backend/.env.production"; \
		echo "   cp frontend/.env.production.example frontend/.env.production"; \
		exit 1; \
	fi
	ENVIRONMENT=production docker compose up -d
	@echo "✅ Serviços de produção iniciados!"

## prod-down: Para os serviços de produção
prod-down:
	@echo "🛑 Parando serviços de produção..."
	docker compose down

## prod-logs: Mostra os logs dos serviços de produção
prod-logs:
	docker compose logs -f

