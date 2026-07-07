import { trace, type Tracer } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;
let started = false;

export function isOtelEnabled(): boolean {
	const value = process.env.OTEL_ENABLED?.toLowerCase();
	return value === 'true' || value === '1' || value === 'yes';
}

function otlpBaseUrl(): string {
	const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
	return endpoint.replace(/\/$/, '');
}

function tracesUrl(): string {
	const base = otlpBaseUrl();
	return base.endsWith('/v1/traces') ? base : `${base}/v1/traces`;
}

function metricsUrl(): string {
	const base = otlpBaseUrl();
	return base.endsWith('/v1/metrics') ? base : `${base}/v1/metrics`;
}

/** Initialize Node SDK once — no-op when OTEL_ENABLED is off. */
export function initOtel(): void {
	if (!isOtelEnabled() || started) return;

	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'ui',
		[ATTR_SERVICE_VERSION]: process.env.UI_VERSION ?? 'unknown',
		'deployment.environment': process.env.DEPLOYMENT_ENVIRONMENT ?? 'local',
		'app.component': 'ui',
		'runtime.name': 'nodejs'
	});

	sdk = new NodeSDK({
		resource,
		traceExporter: new OTLPTraceExporter({ url: tracesUrl() }),
		metricReader: new PeriodicExportingMetricReader({
			exporter: new OTLPMetricExporter({ url: metricsUrl() }),
			exportIntervalMillis: 60_000
		}),
		instrumentations: [
			new HttpInstrumentation({
				ignoreIncomingRequestHook: (request) => {
					const url = request.url ?? '';
					return url.includes('/status');
				}
			})
		]
	});

	sdk.start();
	started = true;
}

export async function shutdownOtel(): Promise<void> {
	if (!sdk) return;
	await sdk.shutdown();
	sdk = undefined;
	started = false;
}

export function getTracer(name = 'ui'): Tracer {
	return trace.getTracer(name);
}
