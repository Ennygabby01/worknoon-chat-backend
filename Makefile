DEV_HOST ?= 0.0.0.0
LOCAL_HOST := 127.0.0.1

.PHONY: help
help:
	@echo "Worknoon chat backend commands"
	@echo ""
	@echo "  make install      Install dependencies"
	@echo "  make dev          Start dev server on $(DEV_HOST)"
	@echo "  make dev-local    Start dev server on localhost only"
	@echo "  make seed-admin   Create or update the admin user from env"
	@echo "  make seed-agents  Seed agent users from env"
	@echo "  make seed-demo    Seed demo users, conversations, and orders"
	@echo "  make lint         Run ESLint"
	@echo "  make typecheck    Run TypeScript typecheck"
	@echo "  make build        Build TypeScript output"
	@echo "  make start        Run built server"
	@echo "  make backend-start Alias for make start"

.PHONY: install
install:
	npm install

.PHONY: dev
dev:
	HOST=$(DEV_HOST) npm run dev

.PHONY: dev-local
dev-local:
	HOST=$(LOCAL_HOST) npm run dev

.PHONY: seed-admin
seed-admin:
	npm run seed:admin

.PHONY: seed-agents
seed-agents:
	npm run seed:agents

.PHONY: seed-demo
seed-demo:
	npm run seed:demo

.PHONY: lint
lint:
	npm run lint

.PHONY: typecheck
typecheck:
	npm run typecheck

.PHONY: build
build:
	npm run build

.PHONY: start
start:
	npm run start

.PHONY: backend-start
backend-start: start
