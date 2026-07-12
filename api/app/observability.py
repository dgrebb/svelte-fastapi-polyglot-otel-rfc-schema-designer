"""OpenTelemetry setup for the FastAPI API — gated by OTEL_ENABLED."""

from __future__ import annotations

import importlib.metadata
import json
import logging
import os
from datetime import UTC, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI
    from sqlalchemy.engine import Engine

_configured = False
_logger = logging.getLogger(__name__)


def is_enabled() -> bool:
    return os.getenv("OTEL_ENABLED", "").lower() in {"1", "true", "yes"}


def _service_version() -> str:
    try:
        return importlib.metadata.version("svelte-fastapi-polyglot-otel-rfc-schema-designer-api")
    except importlib.metadata.PackageNotFoundError:
        return "unknown"


class _JsonFormatter(logging.Formatter):
    """Structured JSON logs with optional OpenTelemetry trace correlation."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "service.name": os.getenv("OTEL_SERVICE_NAME", "api"),
            "service.version": _service_version(),
        }

        trace_id = getattr(record, "otelTraceID", "0")
        span_id = getattr(record, "otelSpanID", "0")
        if trace_id and trace_id != "0":
            payload["trace.id"] = trace_id
        if span_id and span_id != "0":
            payload["span.id"] = span_id

        if record.exc_info:
            payload["error.type"] = record.exc_info[0].__name__ if record.exc_info[0] else None
            payload["error.message"] = str(record.exc_info[1]) if record.exc_info[1] else None

        return json.dumps(payload, default=str)


def _configure_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler()
    if os.getenv("LOG_FORMAT", "json").lower() == "json":
        handler.setFormatter(_JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter("%(levelname)s %(name)s %(message)s"))
    root.addHandler(handler)
    root.setLevel(log_level)


def setup(app: FastAPI, engine: Engine | None = None) -> None:
    """Initialize tracing, metrics, and log correlation when OTEL_ENABLED=true."""
    global _configured
    if not is_enabled() or _configured:
        return

    from opentelemetry import metrics, trace
    from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.logging import LoggingInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    resource = Resource.create(
        {
            "service.name": os.getenv("OTEL_SERVICE_NAME", "api"),
            "service.version": _service_version(),
            "deployment.environment": os.getenv("DEPLOYMENT_ENVIRONMENT", "local"),
            "app.component": "api",
            "runtime.name": "python",
        }
    )

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint, insecure=True)))
    trace.set_tracer_provider(tracer_provider)

    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=endpoint, insecure=True),
        export_interval_millis=60_000,
    )
    metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[metric_reader]))

    excluded_urls = os.getenv("OTEL_PYTHON_FASTAPI_EXCLUDED_URLS", "/health")
    FastAPIInstrumentor.instrument_app(app, excluded_urls=excluded_urls)

    if engine is not None:
        SQLAlchemyInstrumentor().instrument(engine=engine)

    LoggingInstrumentor().instrument(set_logging_format=False)
    _configure_logging()

    _configured = True
    _logger.info("OpenTelemetry enabled for API")


def shutdown() -> None:
    """Flush telemetry providers on application shutdown."""
    if not _configured:
        return

    from opentelemetry import metrics, trace

    trace_provider = trace.get_tracer_provider()
    if hasattr(trace_provider, "shutdown"):
        trace_provider.shutdown()

    meter_provider = metrics.get_meter_provider()
    if hasattr(meter_provider, "shutdown"):
        meter_provider.shutdown()
