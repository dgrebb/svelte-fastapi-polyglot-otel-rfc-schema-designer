<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CollapsibleSection from '$lib/components/form-design/CollapsibleSection.svelte';
	import { formInputClass } from '$lib/components/form-design/styles.js';
	import { formatJson, methodVariant } from '$lib/form-design/schema-introspect.js';
	import type { GeneratedEndpoint } from '$lib/generated/metadata/endpoints.js';

	type Props = {
		resourceId: string;
		endpoint: GeneratedEndpoint;
		title: string;
		description?: string;
		paramLabel?: string;
		paramPlaceholder?: string;
		submitLabel: string;
		submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
		needsParam?: boolean;
		onRun: (param?: string) => Promise<unknown>;
	};

	let {
		resourceId,
		endpoint,
		title,
		description,
		paramLabel = 'Parameter',
		paramPlaceholder = '',
		submitLabel,
		submitVariant = 'default',
		needsParam = false,
		onRun
	}: Props = $props();

	let param = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let result = $state<unknown>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;
		try {
			result = await onRun(needsParam ? param : undefined);
		} catch (caught) {
			error = caught instanceof Error ? caught.message : 'Request failed';
			result = null;
		} finally {
			loading = false;
		}
	}
</script>

<CollapsibleSection id={`${resourceId}-${endpoint.remoteExport}`} {title} level="panel" defaultOpen>
	{#snippet header()}
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<h3 class="text-base font-medium">{title}</h3>
				<Badge variant={methodVariant(endpoint.method)}>{endpoint.method}</Badge>
				<Badge variant="outline">{endpoint.remoteKind}</Badge>
			</div>
			<p class="text-sm text-muted-foreground">
				{#if description}
					{description}
				{/if}
				<code class="text-xs">{endpoint.path}</code>
				· remote <code class="text-xs">{endpoint.remoteExport}</code>
			</p>
		</div>
	{/snippet}

	<form onsubmit={handleSubmit} class="space-y-4">
		{#if needsParam}
			<fieldset class="space-y-3 rounded-md border border-border/60 p-4">
				<legend class="px-1 text-sm font-medium">{paramLabel}</legend>
				<label class="block space-y-2 text-sm">
					<span class="text-muted-foreground">Value</span>
					<input
						bind:value={param}
						class={formInputClass}
						placeholder={paramPlaceholder}
						required
					/>
				</label>
			</fieldset>
		{/if}

		{#if error}
			<div
				class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{error}
			</div>
		{/if}

		<Button type="submit" variant={submitVariant} disabled={loading}>
			{loading ? 'Working…' : submitLabel}
		</Button>
	</form>

	{#if result !== null}
		<div class="mt-4 space-y-2">
			<p class="text-sm font-medium">Response</p>
			<pre
				class="bg-muted/40 overflow-x-auto rounded-md border border-border/60 p-4 font-mono text-xs leading-relaxed">{formatJson(
					result
				)}</pre>
		</div>
	{/if}

	{#if endpoint.responseSchemaName}
		<p class="mt-4 text-xs text-muted-foreground">
			Response schema: <code>{endpoint.responseSchemaName}</code>
		</p>
	{/if}
</CollapsibleSection>
