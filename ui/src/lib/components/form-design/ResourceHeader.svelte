<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { FormDesignResource } from '$lib/form-design/types.js';

	type Props = {
		resource: FormDesignResource;
	};

	let { resource }: Props = $props();
</script>

<header class="space-y-2 border-b border-border/60 pb-6">
	<p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">Resource</p>
	<h1 id={resource.id} class="font-heading text-2xl font-semibold tracking-tight scroll-mt-24">
		{resource.path}
		<span class="text-muted-foreground">— {resource.title}</span>
	</h1>
	<p class="max-w-3xl text-sm text-muted-foreground">{resource.description}</p>
	<div class="flex flex-wrap gap-2 pt-1">
		<Badge variant="outline">{resource.endpoints.length} endpoints</Badge>
		<Badge variant="outline">{resource.schemas.length} schemas</Badge>
	</div>
</header>
