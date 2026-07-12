<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { endpoints } from '$lib/generated/metadata/endpoints.js';
	import { createAgent } from '$lib/generated/remotes/agents.remote.js';

	let submitError = $state<string | null>(null);

	function methodVariant(method: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (method) {
			case 'GET':
				return 'secondary';
			case 'POST':
				return 'default';
			case 'PATCH':
				return 'outline';
			case 'DELETE':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function formatJson(value: unknown): string {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
</script>

<svelte:head>
	<title>API Explorer · FastAPI SvelteKit Schema Generation and Form Design UI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-4 py-8">
	<div>
		<p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Developer tools</p>
		<h1 class="font-heading mt-1 text-2xl font-semibold tracking-tight">API Explorer</h1>
		<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
			Generated agents remotes from OpenAPI. Submit the create-agent form to exercise the
			<code class="text-xs">backendFetch</code> pipeline end-to-end.
		</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Generated endpoints</Card.Title>
			<Card.Description>{endpoints.length} agents operations from OpenAPI metadata</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[640px] text-sm">
					<thead>
						<tr class="border-b border-border/60 text-left text-xs text-muted-foreground">
							<th class="px-3 py-2 font-medium">Method</th>
							<th class="px-3 py-2 font-medium">Path</th>
							<th class="px-3 py-2 font-medium">Remote</th>
							<th class="px-3 py-2 font-medium">Kind</th>
						</tr>
					</thead>
					<tbody>
						{#each endpoints as endpoint (endpoint.operationId)}
							<tr class="border-b border-border/40 last:border-0">
								<td class="px-3 py-2">
									<Badge variant={methodVariant(endpoint.method)}>{endpoint.method}</Badge>
								</td>
								<td class="px-3 py-2 font-mono text-xs">{endpoint.path}</td>
								<td class="px-3 py-2 font-mono text-xs">{endpoint.remoteExport}</td>
								<td class="px-3 py-2">
									<Badge variant="outline">{endpoint.remoteKind}</Badge>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Try it out — create agent</Card.Title>
			<Card.Description>
				POST <code class="text-xs">/agents/create</code> via the generated
				<code class="text-xs">createAgent</code> form remote
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<form
				{...createAgent.enhance(async (form) => {
					submitError = null;
					try {
						const ok = await form.submit();
						if (!ok) {
							submitError = 'Validation failed — check required fields.';
						}
					} catch (error) {
						submitError = error instanceof Error ? error.message : 'Request failed';
					}
				})}
				class="space-y-4"
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="space-y-2 text-sm">
						<span class="font-medium">Name</span>
						<input
							{...createAgent.fields.name.as('text')}
							class="border-input bg-background focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
							placeholder="Research Assistant"
						/>
					</label>
					<label class="space-y-2 text-sm">
						<span class="font-medium">Model</span>
						<input
							{...createAgent.fields.model.as('text', 'claude-sonnet-4')}
							class="border-input bg-background focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
						/>
					</label>
				</div>

				<label class="block space-y-2 text-sm">
					<span class="font-medium">System prompt</span>
					<textarea
						{...createAgent.fields.system_prompt.as('text', 'You are a helpful AI agent.')}
						class="border-input bg-background focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
					></textarea>
				</label>

				{#if (createAgent.fields?.allIssues()?.length ?? 0) > 0}
					<div
						class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						<ul class="list-disc pl-4">
							{#each createAgent.fields?.allIssues() ?? [] as issue (issue.message)}
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

				<Button type="submit">Create agent</Button>
			</form>

			{#if createAgent.result}
				<div class="space-y-2">
					<p class="text-sm font-medium">Response</p>
					<pre
						class="bg-muted/40 overflow-x-auto rounded-md border border-border/60 p-4 font-mono text-xs leading-relaxed">{formatJson(
							createAgent.result
						)}</pre>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
