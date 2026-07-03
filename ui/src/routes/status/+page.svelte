<script lang="ts">
	import StatusLed, { type LedState } from '$lib/components/status/StatusLed.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Meter } from '$lib/components/ui/meter/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import { formatPackageVersions } from '$lib/versions';

	import { getStatus } from './status.remote.js';

	const status = getStatus();

	const snapshot = $derived(status.ready ? status.current : null);

	const overallLed = $derived<LedState>(snapshot?.ready ? 'ok' : snapshot ? 'error' : 'warn');

	const heapPercent = $derived(
		snapshot && snapshot.process.heap_total_mb > 0
			? Math.round((snapshot.process.heap_used_mb / snapshot.process.heap_total_mb) * 100)
			: 0
	);

	const heapLed = $derived<LedState>(heapPercent > 95 ? 'error' : heapPercent > 85 ? 'warn' : 'ok');

	const memoryLed = $derived<LedState>(
		!snapshot
			? 'warn'
			: snapshot.system.memory_used_percent > 90
				? 'error'
				: snapshot.system.memory_used_percent > 75
					? 'warn'
					: 'ok'
	);

	const loadLabel = $derived(
		snapshot?.system.load_average?.map((v) => v.toFixed(2)).join(' · ') ?? 'n/a'
	);

	const releaseLabel = $derived(snapshot ? formatPackageVersions(snapshot.versions) : '');

	function formatUptime(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	}
</script>

<svelte:head>
	<title>Status · Agent Orchestrator UI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Frontend operations</p>
			<h1 class="font-heading mt-1 text-2xl font-semibold tracking-tight">UI Status</h1>
		</div>
		{#if snapshot}
			<div class="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
				<StatusLed state={overallLed} />
				<div>
					<p class="text-sm font-medium capitalize">{snapshot.status.replace('_', ' ')}</p>
					<p class="text-xs text-muted-foreground">{releaseLabel}</p>
				</div>
				<Badge variant={snapshot.ready ? 'default' : 'destructive'}>
					{snapshot.ready ? 'Ready' : 'Not ready'}
				</Badge>
				<Badge variant="outline" class={status.connected ? 'border-emerald-500/50' : ''}>
					{status.connected ? 'Live' : 'Reconnecting'}
				</Badge>
			</div>
		{:else}
			<Badge variant="outline">Connecting…</Badge>
		{/if}
	</div>

	{#if snapshot}
		<div class="mb-6 grid gap-3 sm:grid-cols-3">
			<div class="flex items-center gap-3 rounded-md border border-border bg-card/50 px-4 py-3">
				<StatusLed state={overallLed} />
				<span class="text-sm font-medium">SSR server</span>
				<Badge variant="outline" class="ml-auto">{snapshot.runtime.env}</Badge>
			</div>
			<div class="flex items-center gap-3 rounded-md border border-border bg-card/50 px-4 py-3">
				<StatusLed state={heapLed} />
				<span class="text-sm font-medium">Process heap</span>
				<span class="ml-auto font-mono text-sm">{heapPercent}%</span>
			</div>
			<div class="flex items-center gap-3 rounded-md border border-border bg-card/50 px-4 py-3">
				<StatusLed state={memoryLed} />
				<span class="text-sm font-medium">Visible memory</span>
				<span class="ml-auto font-mono text-sm">{snapshot.system.memory_used_percent}%</span>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<StatusLed state={overallLed} />
						Runtime
					</CardTitle>
					<CardDescription>Node process serving this UI</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3 text-sm">
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">Node</span>
						<span class="font-mono">{snapshot.runtime.node}</span>
					</div>
					<Separator />
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">Uptime</span>
						<span class="font-mono">{formatUptime(snapshot.runtime.uptime_seconds)}</span>
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">Environment</span>
						<span class="font-mono">{snapshot.runtime.env}</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<StatusLed state={heapLed} />
						Process memory
					</CardTitle>
					<CardDescription>V8 heap and RSS for this Node process</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 text-sm">
					<div class="space-y-2">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Heap</span>
							<span class="font-mono"
								>{snapshot.process.heap_used_mb} / {snapshot.process.heap_total_mb} MB</span
							>
						</div>
						<Progress value={heapPercent} max={100} />
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">RSS</span>
						<span class="font-mono">{snapshot.process.rss_mb} MB</span>
					</div>
				</CardContent>
			</Card>

			<Card class="md:col-span-2">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<StatusLed state={memoryLed} />
						Container-visible resources
					</CardTitle>
					<CardDescription>
						What this Node process can see via <code class="text-xs">os</code> — often the Docker host,
						not a cgroup limit
					</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4 text-sm sm:grid-cols-3">
					<div class="space-y-2 sm:col-span-1">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Memory</span>
							<span class="font-mono">{snapshot.system.memory_used_percent}%</span>
						</div>
						<Meter value={snapshot.system.memory_used_percent} max={100} />
						<p class="font-mono text-xs text-muted-foreground">
							{snapshot.system.memory_used_mb} / {snapshot.system.memory_total_mb} MB
						</p>
					</div>
					<div class="flex flex-col justify-center gap-2">
						<span class="text-muted-foreground">CPUs visible</span>
						<span class="font-mono text-lg">{snapshot.system.cpus}</span>
					</div>
					<div class="flex flex-col justify-center gap-2">
						<span class="text-muted-foreground">Load average</span>
						<span class="font-mono text-lg">{loadLabel}</span>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
