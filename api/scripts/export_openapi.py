#!/usr/bin/env python3
"""Export the FastAPI OpenAPI schema to api/openapi.json."""

from __future__ import annotations

import json
from pathlib import Path

from app.main import app

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "openapi.json"


def main() -> None:
    schema = app.openapi()
    OUTPUT.write_text(
        json.dumps(schema, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
