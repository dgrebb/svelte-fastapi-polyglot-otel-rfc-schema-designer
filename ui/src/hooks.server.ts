import { json, type Handle } from '@sveltejs/kit';

import { collectStatus } from '$lib/server/status';
import { getTracer, initOtel, isOtelEnabled } from '$lib/server/otel';

initOtel();

function sanitizedPath(pathname: string): string {
	try {
		const url = new URL(pathname, 'http://localhost');
		return url.pathname;
	} catch {
		return pathname.split('?')[0] ?? pathname;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/status') {
		const wantsJson =
			event.url.searchParams.get('format') === 'json' ||
			event.request.headers.get('accept')?.includes('application/json');

		if (wantsJson) {
			const snapshot = collectStatus();
			return json(snapshot, { status: snapshot.ready ? 200 : 503 });
		}
	}

	if (!isOtelEnabled()) {
		return resolve(event);
	}

	const route = sanitizedPath(event.url.pathname);
	const spanName = `${event.request.method} ${route}`;

	return getTracer().startActiveSpan(
		spanName,
		{
			attributes: {
				'http.method': event.request.method,
				'http.route': route,
				'app.component': 'ui'
			}
		},
		async (span) => {
			try {
				const response = await resolve(event);
				span.setAttribute('http.status_code', response.status);
				return response;
			} catch (error) {
				span.recordException(error as Error);
				throw error;
			} finally {
				span.end();
			}
		}
	);
};
