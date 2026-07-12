<script lang="ts">
	import ShadcnPlaygroundForm from '$lib/components/form-design/shadcn/ShadcnPlaygroundForm.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>shadcn-svelte forms · Form design</title>
	<meta
		name="description"
		content="Formsnap, Superforms, and shadcn-svelte form primitives with Zod validation."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-8">
	<header class="space-y-3">
		<p class="text-xs tracking-[0.2em] text-muted-foreground uppercase">
			<a href="/form-design" class="hover:text-foreground">Form design</a>
			· shadcn-svelte
		</p>
		<h1 class="font-heading text-3xl font-semibold tracking-tight">
			shadcn-svelte form playground
		</h1>
		<p class="max-w-3xl text-sm text-muted-foreground">
			<a
				href="https://www.shadcn-svelte.com/docs/components/form"
				class="underline-offset-4 hover:underline"
				target="_blank"
				rel="noreferrer"
			>
				Formsnap &amp; Superforms
			</a>
			wrapped by shadcn-svelte <code class="text-xs">Form.*</code> components. Each collapsible section
			demonstrates a widget pattern you can map to fields from generated Zod schemas. Combobox and date
			picker are compositions (Command + Popover, Calendar + Popover) — not standalone registry items
			on this style.
		</p>
	</header>

	<nav
		aria-label="Widget sections"
		class="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm"
	>
		<p class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Sections</p>
		<ul class="flex flex-wrap gap-x-4 gap-y-1">
			<li><a href="#shadcn-text" class="hover:underline">Input &amp; textarea</a></li>
			<li><a href="#shadcn-select" class="hover:underline">Select</a></li>
			<li><a href="#shadcn-radio" class="hover:underline">Radio group</a></li>
			<li><a href="#shadcn-switch-checkbox" class="hover:underline">Switch &amp; checkbox</a></li>
			<li><a href="#shadcn-slider" class="hover:underline">Slider</a></li>
			<li><a href="#shadcn-combobox" class="hover:underline">Combobox</a></li>
			<li><a href="#shadcn-date" class="hover:underline">Date &amp; range</a></li>
		</ul>
	</nav>

	<ShadcnPlaygroundForm data={data.form} />
</div>
