# Grafana LGTM (o11y-grafana profile)

The `grafana/otel-lgtm` image bundles Grafana, Tempo, Loki, and Prometheus for local validation.

- **Grafana UI:** http://localhost:3001
- **Collector** forwards OTLP HTTP to `http://lgtm:4318` when `collector.grafana.yml` is active

LGTM datasources are pre-provisioned inside the image — no extra provisioning files required for the dev smoke test.
