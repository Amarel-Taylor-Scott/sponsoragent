.PHONY: dev dev-down dev-logs prod build migrate seed test clean db-shell

# ════════════════════════════════════════════════════════════
#  DEVELOPMENT
# ════════════════════════════════════════════════════════════
dev:
	docker compose up -d --build
	@echo "SponsorAgent running at http://localhost"
	@echo "  4 services: backend + frontend + caddy + postgres"

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

dev-backend:
	docker compose logs -f backend

# ════════════════════════════════════════════════════════════
#  PRODUCTION
# ════════════════════════════════════════════════════════════
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# ════════════════════════════════════════════════════════════
#  DATABASE
# ════════════════════════════════════════════════════════════
migrate:
	docker compose exec backend npx knex migrate:latest --knexfile src/knexfile.ts

migrate-rollback:
	docker compose exec backend npx knex migrate:rollback --knexfile src/knexfile.ts

seed:
	docker compose exec backend npx knex seed:run --knexfile src/knexfile.ts

db-reset:
	docker compose exec backend npx knex migrate:rollback --all --knexfile src/knexfile.ts
	docker compose exec backend npx knex migrate:latest --knexfile src/knexfile.ts
	docker compose exec backend npx knex seed:run --knexfile src/knexfile.ts

db-shell:
	docker compose exec postgres psql -U sponsoragent

# ════════════════════════════════════════════════════════════
#  BUILD & TEST
# ════════════════════════════════════════════════════════════
build:
	npm run build --workspaces

test:
	npm test --workspace=backend

# ════════════════════════════════════════════════════════════
#  CLEANUP
# ════════════════════════════════════════════════════════════
clean:
	docker compose down -v
	rm -rf node_modules backend/node_modules frontend/node_modules
