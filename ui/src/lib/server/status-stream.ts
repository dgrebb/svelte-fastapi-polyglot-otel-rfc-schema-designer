import { collectStatus, type StatusSnapshot } from './status';

const POLL_INTERVAL_MS = 2_000;

/** Active `query.live` connections waiting for the next broadcast. */
export const listeners = new Set<(snapshot: StatusSnapshot) => void>();

let latestSnapshot: StatusSnapshot | undefined;
let ticker: ReturnType<typeof setInterval> | undefined;

function pollAndBroadcast(): void {
	latestSnapshot = collectStatus();

	for (const listener of listeners) {
		listener(latestSnapshot);
	}
}

function getLatestSnapshot(): StatusSnapshot {
	if (!latestSnapshot) {
		latestSnapshot = collectStatus();
	}
	return latestSnapshot;
}

function ensureTicker(): void {
	if (ticker !== undefined) return;

	pollAndBroadcast();
	ticker = setInterval(pollAndBroadcast, POLL_INTERVAL_MS);
}

function maybeStopTicker(): void {
	if (listeners.size === 0 && ticker !== undefined) {
		clearInterval(ticker);
		ticker = undefined;
	}
}

/** Async generator consumed by `query.live` — fans out a single polled snapshot. */
export async function* statusUpdates(): AsyncGenerator<StatusSnapshot> {
	while (true) {
		ensureTicker();
		yield getLatestSnapshot();

		const { promise, resolve } = Promise.withResolvers<StatusSnapshot>();
		listeners.add(resolve);

		try {
			await promise;
		} finally {
			listeners.delete(resolve);
			maybeStopTicker();
		}
	}
}
