.PHONY: help build up down logs clean test

# Default target
help:
	@echo "Available commands:"
	@echo "  build    - Build all Docker images"
	@echo "  up       - Start all services"
	@echo "  down     - Stop all services"
	@echo "  logs     - Show logs for all services"
	@echo "  clean    - Remove all containers, images, and volumes"
	@echo "  test     - Run tests"
	@echo "  backend  - Start only backend services (MySQL + Backend)"
	@echo "  frontend - Start only frontend development server"

# Build all Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d
	@echo "Services starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8080"
	@echo "MySQL: localhost:3306"

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Clean up everything
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# Run backend and database only
backend:
	docker-compose up -d mysql backend
	@echo "Backend services started:"
	@echo "Backend API: http://localhost:8080"
	@echo "MySQL: localhost:3306"

# Start frontend development server (requires backend to be running)
frontend:
	cd frontend && npm run dev

# Run tests
test:
	cd frontend && npm test
	cd backend && go test ./...

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	cp backend/.env.example backend/.env
	cp frontend/.env.example frontend/.env
	cd frontend && npm install
	cd backend && go mod tidy
	@echo "Development environment ready!"
	@echo "Run 'make backend' to start backend services"
	@echo "Run 'make frontend' to start frontend development server"

# Full development start
dev:
	make backend
	@echo "Waiting for backend to start..."
	@sleep 10
	make frontend
