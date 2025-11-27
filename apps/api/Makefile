# =============================================================================
# TEMPO API - Makefile
# =============================================================================
# Makefiles are standard at big tech for project automation.
# Run commands with: make <target>
#
# Examples:
#   make dev        - Start everything for development
#   make logs       - View logs
#   make down       - Stop everything
#   make test       - Run tests
# =============================================================================

.PHONY: help dev up down logs restart clean test build migrate

# Default target - show help
help:
	@echo "Tempo API - Available Commands"
	@echo "=============================="
	@echo ""
	@echo "  make dev       - Start all services (PostgreSQL, Redis, API)"
	@echo "  make up        - Start services in background"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs (follow mode)"
	@echo "  make restart   - Restart all services"
	@echo "  make clean     - Stop services and remove volumes (reset DB)"
	@echo ""
	@echo "  make build     - Build Go binary locally"
	@echo "  make test      - Run tests"
	@echo "  make lint      - Run linter"
	@echo ""
	@echo "  make db-shell  - Open PostgreSQL shell"
	@echo "  make redis-cli - Open Redis CLI"
	@echo ""

# =============================================================================
# Docker Commands
# =============================================================================

# Start everything in foreground (see logs)
dev:
	docker-compose up --build

# Start everything in background
up:
	docker-compose up -d --build

# Stop everything
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-api:
	docker-compose logs -f api

logs-db:
	docker-compose logs -f postgres

# Restart everything
restart:
	docker-compose restart

# Stop and remove all data (fresh start)
clean:
	docker-compose down -v
	@echo "All data has been removed. Run 'make dev' for fresh start."

# =============================================================================
# Development Commands
# =============================================================================

# Build Go binary locally (without Docker)
build:
	go build -o bin/server ./cmd/server

# Run locally (requires PostgreSQL running)
run:
	go run ./cmd/server

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run linter (install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
lint:
	golangci-lint run

# Format code
fmt:
	go fmt ./...

# Download dependencies
deps:
	go mod download
	go mod tidy

# =============================================================================
# Database Commands
# =============================================================================

# Open PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U tempo -d tempo

# Open Redis CLI
redis-cli:
	docker-compose exec redis redis-cli

# Run migrations manually
migrate:
	docker-compose exec postgres psql -U tempo -d tempo -f /docker-entrypoint-initdb.d/01-schema.sql

# Backup database
backup:
	docker-compose exec postgres pg_dump -U tempo tempo > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created!"

# =============================================================================
# Production Commands
# =============================================================================

# Build production Docker image
docker-build:
	docker build -t tempo-api:latest .

# Tag for registry
docker-tag:
	docker tag tempo-api:latest ghcr.io/ch4nbin/tempo-api:latest

# Push to registry
docker-push:
	docker push ghcr.io/ch4nbin/tempo-api:latest

