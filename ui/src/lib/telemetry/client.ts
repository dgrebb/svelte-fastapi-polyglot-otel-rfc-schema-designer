/**
 * Browser/client telemetry — deferred in v1.
 *
 * Options for a future pass (collector-first — no vendor SDKs in app code yet):
 * 1. OpenTelemetry browser SDK → UI server OTLP relay (preferred)
 * 2. Grafana Faro → collector only if explicitly adopted as backend config
 * 3. Elastic RUM → avoid direct coupling; use collector seam instead
 * 4. Minimal custom events → SvelteKit server endpoint → OTLP
 *
 * Privacy: never send cookies, tokens, auth headers, full URLs with sensitive
 * query params, request bodies, form data, or PII.
 */

export type ClientTelemetryEvent = {
	feature: string;
	durationMs?: number;
};

/** No-op — browser telemetry is not enabled. */
export function recordClientEvent(_event: ClientTelemetryEvent): void {
	// intentionally empty
}
