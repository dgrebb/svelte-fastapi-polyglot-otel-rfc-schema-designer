<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="mx-auto max-w-5xl px-4 py-16">
	<Badge variant="outline" class="mb-4">Agent Orchestrator</Badge>
	<h1 class="font-heading text-3xl font-semibold tracking-tight">
		LLM agents, tasks &amp; workflows
	</h1>
	<p class="mt-3 max-w-2xl text-muted-foreground">
		Compose compute profiles, toolkits, agents, and orchestrated pipelines — wired to a FastAPI
		backend with relational entities.
	</p>
	<div class="mt-8 flex flex-wrap gap-3">
		<Button href="/status" variant="default">System status</Button>
	</div>
</div>
