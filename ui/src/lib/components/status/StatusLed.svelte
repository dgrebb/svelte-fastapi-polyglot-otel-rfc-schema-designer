<script lang="ts" module>
	export type LedState = 'ok' | 'warn' | 'error' | 'unknown';
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		state,
		label,
		class: className
	}: {
		state: LedState;
		label?: string;
		class?: string;
	} = $props();

	const tone: Record<LedState, string> = {
		ok: 'bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/50',
		warn: 'bg-amber-400 shadow-[0_0_10px_2px] shadow-amber-400/50',
		error: 'bg-red-500 shadow-[0_0_10px_2px] shadow-red-500/50',
		unknown: 'bg-muted-foreground/40 shadow-none'
	};
</script>

<span class={cn('inline-flex items-center gap-2', className)}>
	<span
		class={cn('size-2.5 shrink-0 rounded-full', tone[state], state === 'ok' && 'animate-pulse')}
		aria-hidden="true"
	></span>
	{#if label}
		<span class="text-sm text-muted-foreground">{label}</span>
	{/if}
	<span class="sr-only">{state}</span>
</span>
