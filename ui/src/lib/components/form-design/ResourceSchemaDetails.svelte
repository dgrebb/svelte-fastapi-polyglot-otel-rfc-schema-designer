<script lang="ts">
	import CollapsibleSection from '$lib/components/form-design/CollapsibleSection.svelte';
	import { formatJson, schemaToJson } from '$lib/form-design/schema-introspect.js';
	import type { FormDesignResource } from '$lib/form-design/types.js';

	type Props = {
		resource: FormDesignResource;
	};

	let { resource }: Props = $props();
</script>

<CollapsibleSection
	id={`${resource.id}-schema`}
	title="Schema"
	subtitle="Generated Zod schemas and inferred TypeScript types — source of truth for field layout and validation."
	defaultOpen
>
	<div class="grid gap-4">
		{#each resource.schemas as entry (entry.name)}
			<CollapsibleSection
				id={`${resource.id}-schema-${entry.name}`}
				title={entry.name}
				subtitle={`type ${entry.typeName} from z.infer`}
				level="panel"
				defaultOpen={false}
			>
				<pre
					class="bg-muted/40 overflow-x-auto rounded-md border border-border/60 p-4 font-mono text-xs leading-relaxed">{formatJson(
						schemaToJson(entry.schema)
					)}</pre>
			</CollapsibleSection>
		{/each}
	</div>
</CollapsibleSection>
