import { z } from 'zod';

export const shadcnPlaygroundSchema = z.object({
	name: z.string().min(1, 'Name is required').max(120),
	model: z.enum(['claude-sonnet-4', 'gpt-4o', 'gemini-pro'], {
		error: 'Select a model'
	}),
	description: z.string().max(500).optional(),
	system_prompt: z.string().optional(),
	tier: z.enum(['starter', 'pro', 'enterprise']),
	active: z.boolean().default(true),
	send_notifications: z.boolean().default(false),
	accept_terms: z
		.boolean()
		.refine((value) => value === true, { message: 'You must accept the terms' }),
	temperature: z.number().min(0).max(2).default(0.7),
	max_tokens: z.number().int().min(256).max(200000).default(4096),
	toolkit_id: z.string().optional(),
	scheduled_date: z.string().optional(),
	availability_start: z.string().optional(),
	availability_end: z.string().optional()
});

export type ShadcnPlaygroundSchema = typeof shadcnPlaygroundSchema;

export const modelOptions = [
	{ value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
	{ value: 'gpt-4o', label: 'GPT-4o' },
	{ value: 'gemini-pro', label: 'Gemini Pro' }
] as const;

export const tierOptions = [
	{ value: 'starter', label: 'Starter' },
	{ value: 'pro', label: 'Pro' },
	{ value: 'enterprise', label: 'Enterprise' }
] as const;

export const toolkitOptions = [
	{ value: 'web-search', label: 'Web search' },
	{ value: 'code-exec', label: 'Code execution' },
	{ value: 'file-browser', label: 'File browser' },
	{ value: 'sql-query', label: 'SQL query' }
] as const;
