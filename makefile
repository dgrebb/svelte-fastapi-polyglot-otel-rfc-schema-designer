.PHONY: dev build build-prod up down restart logs setup install install-hooks check-commit bump-api bump-ui o11y o11y-grafana o11y-elastic export-openapi

UI_VERSION := $(shell node -p "require('./ui/package.json').version" 2>/dev/null || echo unknown)
API_VERSION := $(shell grep -m1 '^version = ' api/pyproject.toml 2>/dev/null | sed 's/.*"\(.*\)".*/\1/' || echo unknown)
export UI_VERSION
export API_VERSION

COMPOSE_PROD := docker compose -f compose.yaml
COMPOSE_DEV := docker compose -f compose.yaml -f compose.dev.yaml
COMPOSE_O11Y := $(COMPOSE_DEV) -f o11y/compose.yaml
# compose.dev.yaml used alone (older invocations) defaults project to the directory name
COMPOSE_DEV_LEGACY := docker compose -f compose.dev.yaml
# Pre-rename production stack (compose.yaml name: agent-orchestrator)
COMPOSE_PROD_LEGACY := docker compose -p agent-orchestrator -f compose.yaml

API_CZ := api/.venv/bin/cz
SETUP := ./scripts/setup.sh

setup:
	@chmod +x $(SETUP)
	@$(SETUP)

install: setup

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

export-openapi:
	$(MAKE) -C api export-openapi

# Stop whatever is running: prod, dev (merged), legacy dev-only, or pre-rename prod project
down:
	@$(COMPOSE_O11Y) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_DEV) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_PROD) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_PROD_LEGACY) down --remove-orphans 2>/dev/null || true
	@$(COMPOSE_DEV_LEGACY) down --remove-orphans 2>/dev/null || true

restart:
	$(COMPOSE_DEV) restart

logs:
	$(COMPOSE_DEV) logs -f

# o11y — opt-in telemetry stack (does not affect plain `make dev`)
o11y:
	$(COMPOSE_O11Y) --profile o11y up --build

o11y-grafana:
	OTEL_COLLECTOR_CONFIG_FILE=collector.grafana.yml $(COMPOSE_O11Y) --profile o11y --profile o11y-grafana up --build

o11y-elastic:
	OTEL_COLLECTOR_CONFIG_FILE=collector.elastic.yml $(COMPOSE_O11Y) --profile o11y --profile o11y-elastic up --build
