// @generated — do not edit
export type RemoteKind = 'query' | 'form' | 'command';

export type GeneratedEndpoint = {
	operationId: string;
	method: string;
	path: string;
	remoteImportPath: string;
	remoteExport: string;
	remoteKind: RemoteKind;
	requestSchemaName: string | null;
	responseSchemaName: string | null;
};

export const endpoints: GeneratedEndpoint[] = [
	{
		"operationId": "list_agents_agents_get",
		"method": "GET",
		"path": "/agents",
		"remoteExport": "listAgents",
		"remoteKind": "query",
		"remoteImportPath": "$lib/generated/remotes/agents.remote.js",
		"requestSchemaName": null,
		"responseSchemaName": "v.array(AgentSchema)"
	},
	{
		"operationId": "get_agent_agents__entity_id__get",
		"method": "GET",
		"path": "/agents/{entity_id}",
		"remoteExport": "getAgent",
		"remoteKind": "query",
		"remoteImportPath": "$lib/generated/remotes/agents.remote.js",
		"requestSchemaName": null,
		"responseSchemaName": "AgentSchema"
	},
	{
		"operationId": "delete_agent_agents__entity_id__delete_delete",
		"method": "DELETE",
		"path": "/agents/{entity_id}/delete",
		"remoteExport": "deleteAgent",
		"remoteKind": "command",
		"remoteImportPath": "$lib/generated/remotes/agents.remote.js",
		"requestSchemaName": null,
		"responseSchemaName": "AgentSchema"
	},
	{
		"operationId": "update_agent_agents__entity_id__update_patch",
		"method": "PATCH",
		"path": "/agents/{entity_id}/update",
		"remoteExport": "updateAgent",
		"remoteKind": "form",
		"remoteImportPath": "$lib/generated/remotes/agents.remote.js",
		"requestSchemaName": "AgentUpdateSchema",
		"responseSchemaName": "AgentSchema"
	},
	{
		"operationId": "create_agent_agents_create_post",
		"method": "POST",
		"path": "/agents/create",
		"remoteExport": "createAgent",
		"remoteKind": "form",
		"remoteImportPath": "$lib/generated/remotes/agents.remote.js",
		"requestSchemaName": "AgentCreateSchema",
		"responseSchemaName": "AgentSchema"
	}
];
