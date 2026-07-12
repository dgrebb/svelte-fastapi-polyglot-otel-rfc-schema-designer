<script lang="ts">
	import type { FormDesignResource } from '$lib/form-design/types.js';

	type Props = {
		resources: FormDesignResource[];
	};

	let { resources }: Props = $props();
</script>

<nav aria-label="Form design sections" class="rounded-lg border border-border/60 bg-muted/20 p-4">
	<p class="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">On this page</p>
	<ul class="space-y-3 text-sm">
		{#each resources as resource (resource.id)}
			<li>
				<a href={`#${resource.id}`} class="font-mono text-foreground hover:underline">
					{resource.path}
				</a>
				<ul class="mt-1 space-y-1 border-l border-border/60 pl-3">
					<li>
						<a href={`#${resource.id}-schema`} class="text-muted-foreground hover:text-foreground">
							schema
						</a>
					</li>
					<li>
						<a href={`#${resource.id}-forms`} class="text-muted-foreground hover:text-foreground">
							forms
						</a>
					</li>
					<li>
						<a href="/form-design/shadcn" class="text-muted-foreground hover:text-foreground">
							shadcn-svelte
						</a>
					</li>
					{#each resource.endpoints as endpoint (endpoint.operationId)}
						<li>
							<a
								href={`#${resource.id}-${endpoint.remoteExport}`}
								class="font-mono text-xs text-muted-foreground hover:text-foreground"
							>
								{endpoint.remoteExport}
							</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
</nav>
