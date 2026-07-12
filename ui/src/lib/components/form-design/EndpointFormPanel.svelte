<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CollapsibleSection from '$lib/components/form-design/CollapsibleSection.svelte';
	import { formatJson, methodVariant } from '$lib/form-design/schema-introspect.js';
	import type { FormDesignFormRemote } from '$lib/form-design/remote-types.js';
	import type { GeneratedEndpoint } from '$lib/generated/metadata/endpoints.js';

	type Props = {
		resourceId: string;
		endpoint: GeneratedEndpoint;
		title: string;
		form: FormDesignFormRemote;
		submitLabel: string;
		children: import('svelte').Snippet;
	};

	let { resourceId, endpoint, title, form, submitLabel, children }: Props = $props();

	let submitError = $state<string | null>(null);
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
				<code class="text-xs">{endpoint.path}</code>
				· remote <code class="text-xs">{endpoint.remoteExport}</code>
				{#if endpoint.requestSchemaName}
					· request <code class="text-xs">{endpoint.requestSchemaName}</code>
				{/if}
			</p>
		</div>
	{/snippet}

	<form
		{...form.enhance(async (submission) => {
			submitError = null;
			try {
				const ok = await submission.submit();
				if (!ok) submitError = 'Validation failed — check field constraints.';
			} catch (error) {
				submitError = error instanceof Error ? error.message : 'Request failed';
			}
		})}
		class="space-y-4"
	>
		{@render children()}

		{#if (form.fields?.allIssues?.() ?? []).length > 0}
			<div
				class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				<ul class="list-disc pl-4">
					{#each form.fields?.allIssues?.() ?? [] as issue (issue.message)}
						<li>{issue.message}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if submitError}
			<div
				class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{submitError}
			</div>
		{/if}

		<Button type="submit">{submitLabel}</Button>
	</form>

	{#if form.result}
		<div class="mt-4 space-y-2">
			<p class="text-sm font-medium">Response</p>
			<pre
				class="bg-muted/40 overflow-x-auto rounded-md border border-border/60 p-4 font-mono text-xs leading-relaxed">{formatJson(
					form.result
				)}</pre>
		</div>
	{/if}
</CollapsibleSection>
