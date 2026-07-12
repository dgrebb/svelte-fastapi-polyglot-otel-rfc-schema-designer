// @generated — do not edit
import { command, form, query } from '$app/server';
import { z } from 'zod';

import { backendFetch } from '$lib/server/backend-fetch.js';
import { AgentCreateSchema, AgentSchema, AgentUpdateSchema } from '../schemas/agents.js';

export const listAgents = query(async () => {
	return backendFetch('/agents', { responseSchema: z.array(AgentSchema) });
});

export const getAgent = query(z.string().min(1), async (entity_id) => {
	return backendFetch(`/agents/${entity_id}`, { responseSchema: AgentSchema });
});

export const deleteAgent = command(z.string().min(1), async (entity_id) => {
	return backendFetch(`/agents/${entity_id}/delete`, { method: 'DELETE', responseSchema: AgentSchema });
});

export const updateAgent = form(z.object({
		"entity_id": z.string().min(1),
		"compute_profile_id": z.string().optional(),
		"description": z.string().optional(),
		"max_tokens": z.number().int().min(256).max(200000).optional(),
		"model": z.string().min(1).optional(),
		"name": z.string().min(1).max(120).optional(),
		"system_prompt": z.string().optional(),
		"tags": z.array(z.string()).optional(),
		"temperature": z.number().min(0).max(2).optional(),
		"toolkit_id": z.string().optional()
	}), async (data) => {
	const { entity_id, ...payload } = data;
	return backendFetch(`/agents/${entity_id}/update`, { method: 'PATCH', body: payload, responseSchema: AgentSchema });
});

export const createAgent = form(AgentCreateSchema, async (data) => {
	return backendFetch('/agents/create', { method: 'POST', body: data, responseSchema: AgentSchema });
});

