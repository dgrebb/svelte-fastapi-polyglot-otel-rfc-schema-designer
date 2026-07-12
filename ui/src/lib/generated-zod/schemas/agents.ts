// @generated — do not edit
import { z } from 'zod';

export const AgentSchema = z.object({
		"compute_profile_id": z.string().nullable().optional(),
		"created_at": z.string().nullable().optional(),
		"description": z.string().default("").optional(),
		"id": z.string().optional(),
		"max_tokens": z.number().int().min(256).max(200000).default(4096).optional(),
		"model": z.string().min(1).default("claude-sonnet-4").optional(),
		"name": z.string().min(1).max(120),
		"system_prompt": z.string().default("You are a helpful AI agent.").optional(),
		"tags": z.array(z.string()).optional(),
		"temperature": z.number().min(0).max(2).default(0.7).optional(),
		"toolkit_id": z.string().nullable().optional(),
		"updated_at": z.string().nullable().optional()
	});

export const AgentCreateSchema = z.object({
		"compute_profile_id": z.string().optional(),
		"description": z.string().default("").optional(),
		"max_tokens": z.number().int().min(256).max(200000).default(4096).optional(),
		"model": z.string().min(1).default("claude-sonnet-4").optional(),
		"name": z.string().min(1).max(120),
		"system_prompt": z.string().default("You are a helpful AI agent.").optional(),
		"tags": z.array(z.string()).optional(),
		"temperature": z.number().min(0).max(2).default(0.7).optional(),
		"toolkit_id": z.string().optional()
	});

export const AgentUpdateSchema = z.object({
		"compute_profile_id": z.string().optional(),
		"description": z.string().optional(),
		"max_tokens": z.number().int().min(256).max(200000).optional(),
		"model": z.string().min(1).optional(),
		"name": z.string().min(1).max(120).optional(),
		"system_prompt": z.string().optional(),
		"tags": z.array(z.string()).optional(),
		"temperature": z.number().min(0).max(2).optional(),
		"toolkit_id": z.string().optional()
	});

