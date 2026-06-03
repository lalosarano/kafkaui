.PHONY: up down logs dev dev-backend dev-frontend test build clean help

help:
	@echo "Targets:"
	@echo "  up        docker compose up -d (backend + frontend, BYO Kafka)"
	@echo "  down      docker compose down"
	@echo "  logs      tail compose logs"
	@echo "  dev       run backend (:8080) and frontend (:3000) natively in parallel"
	@echo "  test      backend mvn verify + frontend npm test"
	@echo "  build     backend mvn package + frontend next build"
	@echo "  clean     wipe target/ and .next/"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

dev:
	@echo "Starting backend on :8080 and frontend on :3000…"
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && mvn -q spring-boot:run

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && mvn -q verify
	cd frontend && npm run lint && npm test

build:
	cd backend && mvn -q -DskipTests package
	cd frontend && npm run build

clean:
	rm -rf backend/target frontend/.next frontend/node_modules/.cache
