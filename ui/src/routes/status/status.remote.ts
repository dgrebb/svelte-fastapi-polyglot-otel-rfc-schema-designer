import { query } from '$app/server';

import { statusUpdates } from '$lib/server/status-stream';

export const getStatus = query.live(statusUpdates);
