.PHONY: dev build build-prod up down restart logs install-hooks check-commit bump-api bump-ui

COMPOSE_PROD := docker compose -f compose.yaml
COMPOSE_DEV := docker compose -f compose.yaml -f compose.dev.yaml
# compose.dev.yaml used alone (older invocations) defaults project to the directory name
COMPOSE_DEV_LEGACY := docker compose -f compose.dev.yaml

API_CZ := api/.venv/bin/cz

dev:
	$(COMPOSE_DEV) up --build

build:
	$(COMPOSE_DEV) build

build-prod:
	$(COMPOSE_PROD) build

up:
	$(COMPOSE_PROD) up --build

install-hooks:
	$(MAKE) -C api install
	git config core.hooksPath .githooks
	chmod +x .githooks/commit-msg

check-commit:
	@test -x $(API_CZ) || (echo "Run: make install-hooks" && exit 1)
	$(API_CZ) check

bump-api:
	@test -x $(API_CZ) || (echo "Run: make install-hooks" && exit 1)
	cd api && ./.venv/bin/cz bump --changelog

bump-ui:
	@test -x $(API_CZ) || (echo "Run: make install-hooks" && exit 1)
	cd api && ./.venv/bin/cz -c ../ui/.cz.toml bump --changelog

# Stop whatever is running: prod, dev (merged), or legacy dev-only project
down:
	@$(COMPOSE_DEV) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_PROD) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_DEV_LEGACY) down --remove-orphans 2>/dev/null || true

restart:
	$(COMPOSE_DEV) restart

logs:
	$(COMPOSE_DEV) logs -f
