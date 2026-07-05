.PHONY: install update dev run build test lint clean export-openapi

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

install:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -e ".[dev]"

update:
	$(PIP) install --upgrade -e ".[dev]"

dev:
	$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

run:
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000

build:
	@echo "API is interpreted — no build step required."

test:
	$(PYTHON) -m pytest -q

lint:
	$(VENV)/bin/ruff check .

export-openapi:
	$(PYTHON) scripts/export_openapi.py

clean:
	rm -rf $(VENV) data __pycache__ app/__pycache__ app/**/__pycache__ .pytest_cache .ruff_cache
	find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
