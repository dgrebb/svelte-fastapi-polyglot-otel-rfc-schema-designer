import { z } from 'zod';

import type { SchemaFieldConfig, SchemaFieldKind } from './types.js';

export function schemaToJson(schema: z.ZodType): Record<string, unknown> {
	return z.toJSONSchema(schema) as Record<string, unknown>;
}

export function formatJson(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function fieldKind(name: string, property: Record<string, unknown>): SchemaFieldKind {
	if (property.type === 'integer' || property.type === 'number') return 'number';
	if (name === 'system_prompt' || name === 'description') return 'textarea';
	return 'text';
}

export function fieldsFromJsonSchema(jsonSchema: Record<string, unknown>): SchemaFieldConfig[] {
	const properties = (jsonSchema.properties ?? {}) as Record<string, Record<string, unknown>>;
	const required = new Set((jsonSchema.required as string[] | undefined) ?? []);

	return Object.entries(properties).map(([name, property]) => ({
		name,
		label: name.replace(/_/g, ' '),
		kind: fieldKind(name, property),
		required: required.has(name),
		defaultValue:
			property.default !== undefined ? (property.default as string | number) : undefined,
		description: describeProperty(property)
	}));
}

function describeProperty(property: Record<string, unknown>): string | undefined {
	const parts: string[] = [];
	if (property.type) parts.push(String(property.type));
	if (typeof property.minLength === 'number') parts.push(`min ${property.minLength}`);
	if (typeof property.maxLength === 'number') parts.push(`max ${property.maxLength}`);
	if (typeof property.minimum === 'number') parts.push(`min ${property.minimum}`);
	if (typeof property.maximum === 'number') parts.push(`max ${property.maximum}`);
	if (property.default !== undefined) parts.push(`default ${JSON.stringify(property.default)}`);
	return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function methodVariant(method: string): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (method) {
		case 'GET':
			return 'secondary';
		case 'POST':
			return 'default';
		case 'PATCH':
			return 'outline';
		case 'DELETE':
			return 'destructive';
		default:
			return 'outline';
	}
}
