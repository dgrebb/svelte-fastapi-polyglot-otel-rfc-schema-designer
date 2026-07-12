<script lang="ts">
	import { LightSwitch } from '$lib/components/ui/light-switch';
</script>

<header class="border-b border-border/60 bg-background/80 backdrop-blur-sm">
	<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
		<div class="flex items-center gap-3">
			<a href="/" class="font-heading text-sm font-semibold tracking-wide text-foreground">
				Agent Orchestrator
			</a>
			<span class="hidden text-xs text-muted-foreground sm:inline"
				>LLM task &amp; workflow control</span
			>
		</div>
		<nav class="flex items-center gap-2">
			<a
				href="/status"
				class="rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				Status
			</a>
			<a
				href="/form-design"
				class="rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				Form design
			</a>
			<a
				href="/admin/api-explorer"
				class="rounded-sm px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				API Explorer
			</a>
			<LightSwitch variant="ghost" size="sm" />
		</nav>
	</div>
</header>
