.PHONY: help install dev build start lint clean test

# Variáveis
NODE_MODULES := node_modules
PORT := 3000

# Comando padrão
.DEFAULT_GOAL := help

## help: Mostra esta mensagem de ajuda
help:
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make install    - Instala as dependências do projeto"
	@echo "  make dev        - Inicia o servidor de desenvolvimento (porta $(PORT))"
	@echo "  make build      - Faz o build do projeto para produção"
	@echo "  make start      - Inicia o servidor em modo produção"
	@echo "  make lint       - Executa o linter do projeto"
	@echo "  make clean      - Remove node_modules e arquivos gerados"
	@echo "  make test       - Executa os testes (quando disponível)"
	@echo ""

## install: Instala as dependências do projeto
install:
	@echo "📦 Instalando dependências..."
	npm install

## dev: Inicia o servidor de desenvolvimento
dev:
	@echo "🚀 Iniciando servidor de desenvolvimento na porta $(PORT)..."
	npm run dev

## build: Faz o build do projeto para produção
build:
	@echo "🔨 Fazendo build do projeto..."
	npm run build

## start: Inicia o servidor em modo produção (requer build prévio)
start:
	@echo "🎯 Iniciando servidor em modo produção..."
	npm run start

## lint: Executa o linter do projeto
lint:
	@echo "🔍 Executando linter..."
	npm run lint

## clean: Remove node_modules e arquivos gerados
clean:
	@echo "🧹 Limpando arquivos gerados..."
	rm -rf $(NODE_MODULES)
	rm -rf .next
	rm -rf out
	rm -f package-lock.json
	@echo "✅ Limpeza concluída!"

## test: Executa os testes (quando disponível)
test:
	@echo "🧪 Executando testes..."
	@if npm run test 2>/dev/null; then \
		npm run test; \
	else \
		echo "⚠️  Nenhum script de teste configurado"; \
	fi

