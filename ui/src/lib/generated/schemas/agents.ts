// @generated — do not edit
import * as v from 'valibot';

export const AgentCreateSchema = v.object({
		"compute_profile_id": v.optional(v.string()),
		"description": v.optional(v.string(), ""),
		"max_tokens": v.optional(v.pipe(v.number(), v.integer(), v.minValue(256), v.maxValue(200000)), 4096),
		"model": v.optional(v.pipe(v.string(), v.minLength(1)), "claude-sonnet-4"),
		"name": v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
		"system_prompt": v.optional(v.string(), "You are a helpful AI agent."),
		"tags": v.optional(v.array(v.string())),
		"temperature": v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2)), 0.7),
		"toolkit_id": v.optional(v.string())
	});

export const AgentUpdateSchema = v.object({
		"compute_profile_id": v.optional(v.string()),
		"description": v.optional(v.string()),
		"max_tokens": v.optional(v.pipe(v.number(), v.integer(), v.minValue(256), v.maxValue(200000))),
		"model": v.optional(v.pipe(v.string(), v.minLength(1))),
		"name": v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(120))),
		"system_prompt": v.optional(v.string()),
		"tags": v.optional(v.array(v.string())),
		"temperature": v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
		"toolkit_id": v.optional(v.string())
	});

export const AgentSchema = v.object({
		"compute_profile_id": v.optional(v.nullable(v.string())),
		"created_at": v.optional(v.nullable(v.string())),
		"description": v.optional(v.string(), ""),
		"id": v.optional(v.string()),
		"max_tokens": v.optional(v.pipe(v.number(), v.integer(), v.minValue(256), v.maxValue(200000)), 4096),
		"model": v.optional(v.pipe(v.string(), v.minLength(1)), "claude-sonnet-4"),
		"name": v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
		"system_prompt": v.optional(v.string(), "You are a helpful AI agent."),
		"tags": v.optional(v.array(v.string())),
		"temperature": v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2)), 0.7),
		"toolkit_id": v.optional(v.nullable(v.string())),
		"updated_at": v.optional(v.nullable(v.string()))
	});

