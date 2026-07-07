import { initOtel } from '$lib/server/otel';

/** SvelteKit server instrumentation entry — initializes OTel when enabled. */
export async function register(): Promise<void> {
	initOtel();
}
