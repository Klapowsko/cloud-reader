.PHONY: help up down build restart logs clean

# Comando padrão
.DEFAULT_GOAL := help

## help: Mostra esta mensagem de ajuda
help:
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make up        - Inicia todos os serviços (backend, frontend, postgres)"
	@echo "  make down      - Para todos os serviços"
	@echo "  make build     - Constrói as imagens Docker"
	@echo "  make restart   - Reinicia todos os serviços"
	@echo "  make logs      - Mostra os logs de todos os serviços"
	@echo "  make clean     - Remove containers, volumes e imagens"
	@echo ""

## up: Inicia todos os serviços
up:
	@echo "🚀 Iniciando serviços..."
	docker compose up -d
	@echo "✅ Serviços iniciados!"
	@echo ""
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@echo "PostgreSQL: localhost:5432"

## down: Para todos os serviços
down:
	@echo "🛑 Parando serviços..."
	docker compose down

## build: Constrói as imagens Docker
build:
	@echo "🔨 Construindo imagens..."
	docker compose build

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

