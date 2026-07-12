import type { GeneratedEndpoint } from '$lib/generated/metadata/endpoints.js';
import type { ZodType } from 'zod';

export type FormDesignSchemaRef = {
	/** Display name, e.g. AgentCreateSchema */
	name: string;
	/** Inferred TS type export, e.g. AgentCreate */
	typeName: string;
	schema: ZodType;
};

export type FormDesignResource = {
	/** Stable DOM id and anchor slug, e.g. `agents` */
	id: string;
	/** API path prefix shown in nav, e.g. `/agents` */
	path: string;
	/** Human label, e.g. Agents */
	title: string;
	description: string;
	endpoints: GeneratedEndpoint[];
	schemas: FormDesignSchemaRef[];
};

export type SchemaFieldKind = 'text' | 'textarea' | 'number';

export type SchemaFieldConfig = {
	name: string;
	label: string;
	kind: SchemaFieldKind;
	required: boolean;
	defaultValue?: string | number;
	description?: string;
};
