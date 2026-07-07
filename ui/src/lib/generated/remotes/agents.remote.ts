// @generated — do not edit
import { command, form, query } from '$app/server';
import * as v from 'valibot';

import { backendFetch } from '$lib/server/backend-fetch.js';
import { AgentCreateSchema, AgentSchema, AgentUpdateSchema } from '../schemas/agents.js';

export const listAgents = query(async () => {
	return backendFetch('/agents', { responseSchema: v.array(AgentSchema) });
});

export const getAgent = query(v.pipe(v.string(), v.nonEmpty()), async (entity_id) => {
	return backendFetch(`/agents/${entity_id}`, { responseSchema: AgentSchema });
});

export const deleteAgent = command(v.pipe(v.string(), v.nonEmpty()), async (entity_id) => {
	return backendFetch(`/agents/${entity_id}/delete`, { method: 'DELETE', responseSchema: AgentSchema });
});

export const updateAgent = form(v.object({
		"entity_id": v.pipe(v.string(), v.nonEmpty()),
		"compute_profile_id": v.optional(v.string()),
		"description": v.optional(v.string()),
		"max_tokens": v.optional(v.pipe(v.number(), v.integer(), v.minValue(256), v.maxValue(200000))),
		"model": v.optional(v.pipe(v.string(), v.minLength(1))),
		"name": v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
		"system_prompt": v.optional(v.string()),
		"tags": v.optional(v.array(v.string())),
		"temperature": v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
		"toolkit_id": v.optional(v.string())
	}), async (data) => {
	const { entity_id, ...payload } = data;
	return backendFetch(`/agents/${entity_id}/update`, { method: 'PATCH', body: payload, responseSchema: AgentSchema });
});

export const createAgent = form(AgentCreateSchema, async (data) => {
	return backendFetch('/agents/create', { method: 'POST', body: data, responseSchema: AgentSchema });
});

