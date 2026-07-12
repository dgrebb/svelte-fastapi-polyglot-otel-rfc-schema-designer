<script lang="ts">
	import StatusLed, { type LedState } from '$lib/components/status/StatusLed.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Meter } from '$lib/components/ui/meter';
	import * as Progress from '$lib/components/ui/progress';
	import * as Separator from '$lib/components/ui/separator';

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

	const statTileClass = 'status-surface flex h-full min-h-11 items-center gap-3 px-4 py-3';

	function formatUptime(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	}
</script>

<svelte:head>
	<title>Status · FastAPI SvelteKit Schema Generation and Form Design UI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Frontend operations</p>
			<h1 class="font-heading mt-1 text-2xl font-semibold tracking-tight">UI Status</h1>
		</div>
		{#if snapshot}
			<div
				class="status-surface flex flex-wrap items-center gap-3 px-4 py-3 sm:max-w-md sm:justify-end"
			>
				<StatusLed state={overallLed} />
				<div class="min-w-0">
					<p class="text-sm font-medium capitalize">{snapshot.status.replace('_', ' ')}</p>
					<p class="truncate text-xs text-muted-foreground">{releaseLabel}</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant={snapshot.ready ? 'default' : 'destructive'}>
						{snapshot.ready ? 'Ready' : 'Not ready'}
					</Badge>
					<Badge variant="outline" class={status.connected ? 'border-emerald-500/50' : ''}>
						{status.connected ? 'Live' : 'Reconnecting'}
					</Badge>
				</div>
			</div>
		{:else}
			<Badge variant="outline">Connecting…</Badge>
		{/if}
	</div>

	{#if snapshot}
		<div class="grid items-stretch gap-4 sm:grid-cols-3">
			<div class={statTileClass}>
				<StatusLed state={overallLed} />
				<span class="text-sm font-medium">SSR server</span>
				<Badge variant="outline" class="ml-auto shrink-0">{snapshot.runtime.env}</Badge>
			</div>
			<div class={statTileClass}>
				<StatusLed state={heapLed} />
				<span class="text-sm font-medium">Process heap</span>
				<span class="ml-auto shrink-0 font-mono text-sm">{heapPercent}%</span>
			</div>
			<div class={statTileClass}>
				<StatusLed state={memoryLed} />
				<span class="text-sm font-medium">Visible memory</span>
				<span class="ml-auto shrink-0 font-mono text-sm"
					>{snapshot.system.memory_used_percent}%</span
				>
			</div>
		</div>

		<div class="grid items-stretch gap-4 md:grid-cols-2">
			<Card.Root class="h-full">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<StatusLed state={overallLed} />
						Runtime
					</Card.Title>
					<Card.Description>Node process serving this UI</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-1 flex-col space-y-3 text-sm">
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">Node</span>
						<span class="font-mono">{snapshot.runtime.node}</span>
					</div>
					<Separator.Root />
					<div class="flex justify-between gap-4">
						<span class="text-muted-foreground">Uptime</span>
						<span class="font-mono">{formatUptime(snapshot.runtime.uptime_seconds)}</span>
					</div>
					<div class="mt-auto flex justify-between gap-4">
						<span class="text-muted-foreground">Environment</span>
						<span class="font-mono">{snapshot.runtime.env}</span>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="h-full">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<StatusLed state={heapLed} />
						Process memory
					</Card.Title>
					<Card.Description>V8 heap and RSS for this Node process</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-1 flex-col space-y-3 text-sm">
					<div class="space-y-2">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Heap</span>
							<span class="font-mono"
								>{snapshot.process.heap_used_mb} / {snapshot.process.heap_total_mb} MB</span
							>
						</div>
						<Progress.Root value={heapPercent} max={100} />
					</div>
					<div class="mt-auto flex justify-between gap-4">
						<span class="text-muted-foreground">RSS</span>
						<span class="font-mono">{snapshot.process.rss_mb} MB</span>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="h-full md:col-span-2">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<StatusLed state={memoryLed} />
						Container-visible resources
					</Card.Title>
					<Card.Description>
						What this Node process can see via <code class="text-xs">os</code> — often the Docker host,
						not a cgroup limit
					</Card.Description>
				</Card.Header>
				<Card.Content class="grid h-full gap-4 text-sm sm:grid-cols-3 sm:items-stretch">
					<div class="flex h-full flex-col gap-2">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Memory</span>
							<span class="font-mono">{snapshot.system.memory_used_percent}%</span>
						</div>
						<Meter value={snapshot.system.memory_used_percent} max={100} />
						<p class="font-mono text-xs text-muted-foreground">
							{snapshot.system.memory_used_mb} / {snapshot.system.memory_total_mb} MB
						</p>
					</div>
					<div class="flex h-full flex-col gap-1">
						<span class="text-muted-foreground">CPUs visible</span>
						<span class="font-mono text-lg leading-none">{snapshot.system.cpus}</span>
					</div>
					<div class="flex h-full flex-col gap-1">
						<span class="text-muted-foreground">Load average</span>
						<span class="font-mono text-lg leading-none">{loadLabel}</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
