import os from 'node:os';
import process from 'node:process';

import { getPackageVersions, type PackageVersions } from './versions';

const START_TIME = Date.now();

export type StatusSnapshot = {
	service: 'ui';
	status: 'ready' | 'not_ready';
	ready: boolean;
	versions: PackageVersions;
	runtime: {
		node: string;
		uptime_seconds: number;
		env: string;
	};
	process: {
		heap_used_mb: number;
		heap_total_mb: number;
		rss_mb: number;
	};
	system: {
		cpus: number;
		memory_used_mb: number;
		memory_total_mb: number;
		memory_used_percent: number;
		load_average: [number, number, number] | null;
	};
};

function bytesToMb(bytes: number): number {
	return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function collectStatus(): StatusSnapshot {
	const memory = process.memoryUsage();
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	const heapPercent = memory.heapTotal > 0 ? (memory.heapUsed / memory.heapTotal) * 100 : 0;

	// Frontend readiness: process is up and not under extreme memory pressure.
	const ready = heapPercent < 95;

	return {
		service: 'ui',
		status: ready ? 'ready' : 'not_ready',
		ready,
		versions: getPackageVersions(),
		runtime: {
			node: process.version,
			uptime_seconds: Math.round((Date.now() - START_TIME) / 100) / 10,
			env: process.env.NODE_ENV ?? 'development'
		},
		process: {
			heap_used_mb: bytesToMb(memory.heapUsed),
			heap_total_mb: bytesToMb(memory.heapTotal),
			rss_mb: bytesToMb(memory.rss)
		},
		system: {
			cpus: os.cpus().length,
			memory_used_mb: bytesToMb(usedMem),
			memory_total_mb: bytesToMb(totalMem),
			memory_used_percent: Math.round((usedMem / totalMem) * 1000) / 10,
			load_average: (() => {
				const load = os.loadavg();
				return load.some((value) => value > 0)
					? ([load[0], load[1], load[2]] as [number, number, number])
					: null;
			})()
		}
	};
}
