<script lang="ts">
	import AgentsResourceSection from '$lib/components/form-design/AgentsResourceSection.svelte';
	import FormDesignNav from '$lib/components/form-design/FormDesignNav.svelte';
	import { formDesignResources } from '$lib/form-design/catalog.js';
</script>

<svelte:head>
	<title>Form design · Agent Orchestrator UI</title>
	<meta
		name="description"
		content="Schema-driven form design playground — generated Zod types and SvelteKit remote functions."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8">
	<header class="space-y-3">
		<h1 class="font-heading text-3xl font-semibold tracking-tight">Form design playground</h1>
		<p class="max-w-3xl text-sm text-muted-foreground">
			FastAPI publishes OpenAPI; we generate Zod schemas and SvelteKit remotes. This page walks
			through every operation for each resource — schema introspection, field layout, load/submit,
			validation errors, and response display — so you can style forms without guessing field
			shapes.
		</p>
		<p class="text-sm">
			<a href="/form-design/shadcn" class="text-foreground underline-offset-4 hover:underline">
				shadcn-svelte form playground →
			</a>
			<span class="text-muted-foreground">
				Formsnap, Superforms, and design-system widgets (Select, Switch, Calendar, Combobox, …).
			</span>
		</p>
	</header>

	<FormDesignNav resources={formDesignResources} />

	<AgentsResourceSection />

	<section
		class="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground"
	>
		<p class="font-medium text-foreground">More resources</p>
		<p class="mt-2">
			When the API grows, add another entry to <code class="text-xs">formDesignResources</code> and
			a composite section component (e.g. <code class="text-xs">ToolkitsResourceSection</code>)
			following the same pattern: header, schema details, then one panel per remote.
		</p>
	</section>
</div>
