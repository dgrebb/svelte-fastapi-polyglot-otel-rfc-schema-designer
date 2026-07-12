import { endpoints } from '$lib/generated/metadata/endpoints.js';
import {
	AgentCreateSchema,
	AgentSchema,
	AgentUpdateSchema
} from '$lib/generated/schemas/agents.js';

import type { FormDesignResource } from './types.js';

const agentsEndpoints = endpoints.filter((endpoint) => endpoint.path.startsWith('/agents'));

export const formDesignResources: FormDesignResource[] = [
	{
		id: 'agents',
		path: '/agents',
		title: 'Agents',
		description:
			'LLM agents with model config, prompts, and attached toolkits. Generated from OpenAPI + Zod.',
		endpoints: agentsEndpoints,
		schemas: [
			{ name: 'AgentSchema', typeName: 'Agent', schema: AgentSchema },
			{ name: 'AgentCreateSchema', typeName: 'AgentCreate', schema: AgentCreateSchema },
			{ name: 'AgentUpdateSchema', typeName: 'AgentUpdate', schema: AgentUpdateSchema }
		]
	}
];
