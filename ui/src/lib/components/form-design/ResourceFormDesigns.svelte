<script lang="ts">
	import CollapsibleSection from '$lib/components/form-design/CollapsibleSection.svelte';
	import type { FormDesignResource } from '$lib/form-design/types.js';
	import type { Snippet } from 'svelte';

	type Props = {
		resource: FormDesignResource;
		children: Snippet;
	};

	let { resource, children }: Props = $props();
</script>

<CollapsibleSection
	id={`${resource.id}-forms`}
	title="Forms & interactions"
	subtitle="One panel per generated remote — load, submit, validation errors, and response payloads."
	defaultOpen
>
	<div class="space-y-4">
		{@render children()}
	</div>
</CollapsibleSection>
