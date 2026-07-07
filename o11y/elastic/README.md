# Elastic dev stack (o11y-elastic profile)

## Memory

Elasticsearch 8.x wants **at least ~2 GB** free RAM for a comfortable local start. The compose file caps the JVM at 512m (`ES_JAVA_OPTS=-Xms512m -Xmx512m`), which can work on tighter machines but may OOM under load.

If Elasticsearch exits with code 137 or `max virtual memory areas vm.max_map_count [65530] is too low`:

```bash
# macOS Docker Desktop — increase memory in Settings → Resources (4 GB+ recommended)
# Linux host:
sudo sysctl -w vm.max_map_count=262144
```

## Startup order

1. `make o11y-elastic` (or compose with `--profile o11y --profile o11y-elastic`)
2. Wait for Elasticsearch healthcheck (can take 1–2 minutes on first pull)
3. Kibana at http://localhost:5601
4. Collector forwards traces/logs to `http://elasticsearch:9200` (indices `traces-otel`, `logs-otel`)

## Kibana waiting forever

- Check `docker compose … logs elasticsearch` for OOM or bootstrap errors
- Confirm `curl -fsS http://localhost:9200/_cluster/health` returns green/yellow
- Kibana depends on Elasticsearch `service_healthy` — if ES is yellow, Kibana should still start

## No data in Kibana

- Confirm apps are running with the o11y overlay (`OTEL_ENABLED=true`)
- Check collector logs: `docker compose … logs otel-collector`
- Use Discover with index pattern `traces-otel*` or `logs-otel*`
- OTLP logs from apps may be sparse in v1 — traces are the primary signal

## Security

Local profile runs with `xpack.security.enabled=false`. **Never use this configuration in production.**
