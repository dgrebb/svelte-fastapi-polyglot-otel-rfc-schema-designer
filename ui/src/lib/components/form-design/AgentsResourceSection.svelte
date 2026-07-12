<script lang="ts">
	import EndpointFormPanel from '$lib/components/form-design/EndpointFormPanel.svelte';
	import EndpointQueryPanel from '$lib/components/form-design/EndpointQueryPanel.svelte';
	import ResourceFormDesigns from '$lib/components/form-design/ResourceFormDesigns.svelte';
	import ResourceHeader from '$lib/components/form-design/ResourceHeader.svelte';
	import ResourceSchemaDetails from '$lib/components/form-design/ResourceSchemaDetails.svelte';
	import SchemaFormFields from '$lib/components/form-design/SchemaFormFields.svelte';
	import { formDesignResources } from '$lib/form-design/catalog.js';
	import type {
		FormDesignFieldBindings,
		FormDesignFormRemote
	} from '$lib/form-design/remote-types.js';
	import { AgentCreateSchema, AgentUpdateSchema } from '$lib/generated/schemas/agents.js';
	import {
		createAgent,
		deleteAgent,
		getAgent,
		listAgents,
		updateAgent
	} from '$lib/generated/remotes/agents.remote.js';

	const resource = formDesignResources.find((entry) => entry.id === 'agents')!;

	const listEndpoint = resource.endpoints.find((e) => e.remoteExport === 'listAgents')!;
	const getEndpoint = resource.endpoints.find((e) => e.remoteExport === 'getAgent')!;
	const createEndpoint = resource.endpoints.find((e) => e.remoteExport === 'createAgent')!;
	const updateEndpoint = resource.endpoints.find((e) => e.remoteExport === 'updateAgent')!;
	const deleteEndpoint = resource.endpoints.find((e) => e.remoteExport === 'deleteAgent')!;
</script>

<section class="space-y-10">
	<ResourceHeader {resource} />
	<ResourceSchemaDetails {resource} />

	<ResourceFormDesigns {resource}>
		<EndpointQueryPanel
			resourceId={resource.id}
			endpoint={listEndpoint}
			title="List agents"
			description="GET collection — no path parameters."
			submitLabel="Load agents"
			onRun={async () => listAgents()}
		/>

		<EndpointQueryPanel
			resourceId={resource.id}
			endpoint={getEndpoint}
			title="Get agent"
			description="GET by id — "
			paramLabel="entity_id"
			paramPlaceholder="agent-uuid"
			submitLabel="Load agent"
			needsParam
			onRun={async (entityId) => getAgent(entityId!)}
		/>

		<EndpointFormPanel
			resourceId={resource.id}
			endpoint={createEndpoint}
			title="Create agent"
			form={createAgent as unknown as FormDesignFormRemote}
			submitLabel="Create agent"
		>
			<SchemaFormFields
				formFields={createAgent.fields as unknown as FormDesignFieldBindings}
				schema={AgentCreateSchema}
				legend="AgentCreateSchema"
			/>
		</EndpointFormPanel>

		<EndpointFormPanel
			resourceId={resource.id}
			endpoint={updateEndpoint}
			title="Update agent"
			form={updateAgent as unknown as FormDesignFormRemote}
			submitLabel="Update agent"
		>
			<SchemaFormFields
				formFields={updateAgent.fields as unknown as FormDesignFieldBindings}
				schema={AgentUpdateSchema}
				legend="AgentUpdateSchema"
				extra={[
					{
						name: 'entity_id',
						label: 'entity id',
						kind: 'text',
						required: true,
						description: 'path parameter · min 1'
					}
				]}
			/>
		</EndpointFormPanel>

		<EndpointQueryPanel
			resourceId={resource.id}
			endpoint={deleteEndpoint}
			title="Delete agent"
			description="DELETE — destructive command remote."
			paramLabel="entity_id"
			paramPlaceholder="agent-uuid"
			submitLabel="Delete agent"
			submitVariant="destructive"
			needsParam
			onRun={async (entityId) => deleteAgent(entityId!)}
		/>
	</ResourceFormDesigns>
</section>
