import { json, type Handle } from '@sveltejs/kit';

import { collectStatus } from '$lib/server/status';

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

	return resolve(event);
};
