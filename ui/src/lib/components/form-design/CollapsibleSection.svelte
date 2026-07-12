<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	type Props = {
		id?: string;
		title: string;
		subtitle?: string;
		defaultOpen?: boolean;
		level?: 'section' | 'panel';
		header?: Snippet;
		children: Snippet;
	};

	let {
		id,
		title,
		subtitle,
		defaultOpen = true,
		level = 'section',
		header,
		children
	}: Props = $props();

	let open = $state(defaultOpen);

	const titleClass =
		level === 'section' ? 'font-heading text-lg font-semibold' : 'text-base font-medium';
</script>

<Collapsible.Root bind:open class="scroll-mt-24" {id}>
	<div class="rounded-lg border border-border/60 bg-background">
		<Collapsible.Trigger
			class="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30"
		>
			<div class="min-w-0 space-y-1">
				{#if header}
					{@render header()}
				{:else}
					<h2 class={titleClass}>{title}</h2>
					{#if subtitle}
						<p class="text-sm text-muted-foreground">{subtitle}</p>
					{/if}
				{/if}
			</div>
			<ChevronDownIcon
				class={cn(
					'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
					open && 'rotate-180'
				)}
			/>
		</Collapsible.Trigger>
		<Collapsible.Content class="border-t border-border/60 px-4 pb-4 pt-4">
			{@render children()}
		</Collapsible.Content>
	</div>
</Collapsible.Root>
