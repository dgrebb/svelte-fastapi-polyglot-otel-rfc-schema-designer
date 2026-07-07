#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(uiRoot, '..');
const generatedRoot = path.join(uiRoot, 'src/lib/generated');
const banner = '// @generated — do not edit\n';

const defaultOpenApiPath = path.join(repoRoot, 'api/openapi.json');
const fixtureOpenApiPath = path.join(__dirname, 'fixtures/openapi-agents.json');
const pathPrefixes = ['/agents'];

/** @typedef {'query' | 'form' | 'command'} RemoteKind */

/** @typedef {{
 *   operationId: string;
 *   method: string;
 *   path: string;
 *   remoteExport: string;
 *   remoteKind: RemoteKind;
 *   remoteImportPath: string;
 *   requestSchemaName: string | null;
 *   responseSchemaName: string | null;
 *   pathParams: string[];
 * }} EndpointMeta */

/**
 * @param {string} name
 */
function toCamelCase(name) {
	return name
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
		.replace(/^./, (char) => char.toLowerCase());
}

/**
 * @param {string} name
 */
function toSchemaName(name) {
	return `${name.replace(/[^a-zA-Z0-9]/g, '')}Schema`;
}

/**
 * @param {string} operationId
 * @param {string} method
 * @param {string} routePath
 */
function toRemoteExportName(operationId, method, routePath) {
	const normalizedMethod = method.toLowerCase();
	const segments = routePath.split('/').filter(Boolean);
	const last = segments.at(-1) ?? 'resource';

	if (routePath === '/agents' && normalizedMethod === 'get') return 'listAgents';
	if (routePath === '/agents/properties' && normalizedMethod === 'get') return 'getAgentProperties';
	if (segments.length === 2 && segments[0] === 'agents' && normalizedMethod === 'get') return 'getAgent';
	if (last === 'create' && normalizedMethod === 'post') return 'createAgent';
	if (last === 'update' && normalizedMethod === 'patch') return 'updateAgent';
	if (last === 'delete' && normalizedMethod === 'delete') return 'deleteAgent';

	if (operationId) {
		return toCamelCase(operationId.replace(/_(get|post|patch|put|delete)$/i, ''));
	}

	return toCamelCase(`${normalizedMethod}_${segments.join('_')}`);
}

/**
 * @param {string} ref
 */
function refName(ref) {
	return ref.split('/').pop() ?? ref;
}

/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 */
function resolveSchema(schema, components) {
	if (!schema || typeof schema !== 'object') {
		return schema;
	}

	if ('$ref' in schema && typeof schema.$ref === 'string') {
		const name = refName(schema.$ref);
		const resolved = components[name];
		if (!resolved) {
			throw new Error(`Unresolved schema reference: ${schema.$ref}`);
		}
		return resolveSchema(resolved, components);
	}

	if ('allOf' in schema && Array.isArray(schema.allOf)) {
		const merged = { type: 'object', properties: {}, required: [] };
		for (const part of schema.allOf) {
			const resolved = resolveSchema(part, components);
			if (resolved && typeof resolved === 'object') {
				Object.assign(merged.properties, resolved.properties ?? {});
				if (Array.isArray(resolved.required)) {
					merged.required.push(...resolved.required);
				}
			}
		}
		merged.required = [...new Set(merged.required)];
		return merged;
	}

	return schema;
}

/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 * @param {Set<string>} emitted
 */
function collectSchemaRefs(schema, components, emitted) {
	if (!schema || typeof schema !== 'object') {
		return;
	}

	if ('$ref' in schema && typeof schema.$ref === 'string') {
		const name = refName(schema.$ref);
		if (!emitted.has(name) && components[name]) {
			emitted.add(name);
			collectSchemaRefs(components[name], components, emitted);
		}
		return;
	}

	if ('allOf' in schema && Array.isArray(schema.allOf)) {
		for (const part of schema.allOf) {
			collectSchemaRefs(part, components, emitted);
		}
	}

	if ('items' in schema) {
		collectSchemaRefs(schema.items, components, emitted);
	}

	if ('properties' in schema && schema.properties && typeof schema.properties === 'object') {
		for (const value of Object.values(schema.properties)) {
			collectSchemaRefs(value, components, emitted);
		}
	}
}

/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 */
/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 * @param {{ forForm?: boolean }} [options]
 */
function schemaExpression(schema, components, options = {}) {
	const { forForm = false } = options;
	const resolved = resolveSchema(schema, components);

	if (!resolved || typeof resolved !== 'object') {
		return 'v.unknown()';
	}

	if ('anyOf' in schema && Array.isArray(schema.anyOf)) {
		const nullable = schema.anyOf.some(
			(entry) => entry && typeof entry === 'object' && entry.type === 'null'
		);
		const primary = schema.anyOf.find(
			(entry) => entry && typeof entry === 'object' && entry.type !== 'null'
		);
		if (primary) {
			const expression = schemaExpression(primary, components, options);
			if (nullable && forForm) {
				return expression;
			}
			return nullable ? `v.nullable(${expression})` : expression;
		}
	}

	if (Array.isArray(resolved.type)) {
		const types = resolved.type.filter((type) => type !== 'null');
		const nullable = resolved.type.includes('null');
		const primary = types[0] ?? 'string';
		const expression = schemaExpression({ ...resolved, type: primary }, components, options);
		return nullable ? `v.nullable(${expression})` : expression;
	}

	if (resolved.type === 'string') {
		if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
			const values = resolved.enum.map((value) => JSON.stringify(value)).join(', ');
			return `v.picklist([${values}])`;
		}

		let expression = 'v.string()';
		const checks = [];
		if (typeof resolved.minLength === 'number') {
			checks.push(`v.minLength(${resolved.minLength})`);
		}
		if (typeof resolved.maxLength === 'number') {
			checks.push(`v.maxLength(${resolved.maxLength})`);
		}
		if (checks.length > 0) {
			expression = `v.pipe(${expression}, ${checks.join(', ')})`;
		}
		return expression;
	}

	if (resolved.type === 'integer' || resolved.type === 'number') {
		const checks = [];
		if (resolved.type === 'integer') {
			checks.push('v.integer()');
		}
		if (typeof resolved.minimum === 'number') {
			checks.push(`v.minValue(${resolved.minimum})`);
		}
		if (typeof resolved.maximum === 'number') {
			checks.push(`v.maxValue(${resolved.maximum})`);
		}
		if (checks.length > 0) {
			return `v.pipe(v.number(), ${checks.join(', ')})`;
		}
		return 'v.number()';
	}

	if (resolved.type === 'boolean') {
		return 'v.boolean()';
	}

	if (resolved.type === 'array') {
		const items = schemaExpression(resolved.items ?? { type: 'string' }, components, options);
		return `v.array(${items})`;
	}

	if (resolved.type === 'object' || resolved.properties) {
		const properties = resolved.properties ?? {};
		const required = new Set(resolved.required ?? []);
		const entries = Object.entries(properties).map(([key, value]) => {
			let expression = schemaExpression(value, components, options);
			const hasDefault = value && typeof value === 'object' && 'default' in value;
			if (!required.has(key) || hasDefault) {
				const defaultValue =
					hasDefault && value && typeof value === 'object'
						? JSON.stringify(value.default)
						: undefined;
				expression =
					defaultValue !== undefined
						? `v.optional(${expression}, ${defaultValue})`
						: `v.optional(${expression})`;
			}
			return `\t\t${JSON.stringify(key)}: ${expression}`;
		});

		if (resolved.additionalProperties === true) {
			entries.push('\t\t[v.string()]: v.unknown()');
		}

		return `v.object({\n${entries.join(',\n')}\n\t})`;
	}

	return 'v.unknown()';
}

/**
 * @param {string} componentName
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 * @param {{ forForm?: boolean }} [options]
 */
function emitComponentSchema(componentName, schema, components, options = {}) {
	const exportName = toSchemaName(componentName);
	const expression = schemaExpression(schema, components, options);
	return `export const ${exportName} = ${expression};\n`;
}

/**
 * @param {string} method
 * @param {Record<string, unknown>} operation
 */
function getRemoteKind(method, operation) {
	const normalized = method.toLowerCase();
	if (normalized === 'get') return 'query';
	if (normalized === 'delete') return 'command';
	if (normalized === 'post' || normalized === 'patch' || normalized === 'put') {
		return operation.requestBody ? 'form' : 'command';
	}
	return 'query';
}

/**
 * @param {string} routePath
 * @param {Record<string, unknown>} operation
 */
function getPathParams(routePath, operation) {
	const inline = [...routePath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
	const parameterNames = Array.isArray(operation.parameters)
		? operation.parameters
				.filter(
					(param) =>
						param &&
						typeof param === 'object' &&
						param.in === 'path' &&
						typeof param.name === 'string'
				)
				.map((param) => param.name)
		: [];
	return [...new Set([...inline, ...parameterNames])];
}

/**
 * @param {Record<string, unknown>} operation
 * @param {Record<string, unknown>} components
 */
function getRequestSchemaName(operation, components) {
	const requestBody = operation.requestBody;
	if (!requestBody || typeof requestBody !== 'object') {
		return null;
	}

	const content = requestBody.content;
	if (!content || typeof content !== 'object') {
		return null;
	}

	const json = content['application/json'];
	if (!json || typeof json !== 'object' || !json.schema) {
		return null;
	}

	if (typeof json.schema === 'object' && '$ref' in json.schema && typeof json.schema.$ref === 'string') {
		return toSchemaName(refName(json.schema.$ref));
	}

	return 'RequestBodySchema';
}

/**
 * @param {Record<string, unknown>} operation
 * @param {Record<string, unknown>} components
 */
function getResponseSchemaName(operation, components) {
	const responses = operation.responses;
	if (!responses || typeof responses !== 'object') {
		return null;
	}

	for (const status of ['200', '201', '204']) {
		const response = responses[status];
		if (!response || typeof response !== 'object') continue;
		const content = response.content;
		if (!content || typeof content !== 'object') continue;
		const json = content['application/json'];
		if (!json || typeof json !== 'object' || !json.schema) continue;

		const schema = json.schema;
		if (typeof schema === 'object' && '$ref' in schema && typeof schema.$ref === 'string') {
			return toSchemaName(refName(schema.$ref));
		}

		if (typeof schema === 'object' && schema.type === 'array' && schema.items) {
			if (
				typeof schema.items === 'object' &&
				'$ref' in schema.items &&
				typeof schema.items.$ref === 'string'
			) {
				return `v.array(${toSchemaName(refName(schema.items.$ref))})`;
			}
		}
	}

	return null;
}

/**
 * @param {string[]} pathParams
 * @param {string | null} requestSchemaName
 * @param {Record<string, unknown>} components
 * @param {Record<string, unknown> | null} requestSchema
 */
function buildInputSchema(pathParams, requestSchemaName, components, requestSchema) {
	if (pathParams.length === 0) {
		return requestSchemaName;
	}

	const pathFields = pathParams.map((param) => {
		return `\t\t${JSON.stringify(param)}: v.pipe(v.string(), v.nonEmpty())`;
	});

	if (!requestSchemaName || !requestSchema) {
		if (pathParams.length === 1) {
			return 'v.pipe(v.string(), v.nonEmpty())';
		}
		return `v.object({\n${pathFields.join(',\n')}\n\t})`;
	}

	const resolved = resolveSchema(requestSchema, components);
	const properties = resolved.properties ?? {};
	const required = new Set(resolved.required ?? []);
	const bodyFields = Object.entries(properties).map(([key, value]) => {
		let expression = schemaExpression(value, components, { forForm: true });
		const hasDefault = value && typeof value === 'object' && 'default' in value;
		if (!required.has(key) || hasDefault) {
			const defaultValue =
				hasDefault && value && typeof value === 'object'
					? JSON.stringify(value.default)
					: undefined;
			expression =
				defaultValue !== undefined
					? `v.optional(${expression}, ${defaultValue})`
					: `v.optional(${expression})`;
		}
		return `\t\t${JSON.stringify(key)}: ${expression}`;
	});

	return `v.object({\n${pathFields.join(',\n')}${bodyFields.length ? `,\n${bodyFields.join(',\n')}` : ''}\n\t})`;
}

/**
 * @param {string} routePath
 * @param {string[]} pathParams
 */
function buildFetchPath(routePath, pathParams) {
	if (pathParams.length === 0) {
		return `'${routePath}'`;
	}

	let expression = routePath;
	for (const param of pathParams) {
		expression = expression.replace(`{${param}}`, `\${${param}}`);
	}
	return `\`${expression}\``;
}

/**
 * @param {{ method?: string; body?: string; responseSchema?: string | null }} options
 */
function formatFetchOptions(options = {}) {
	const parts = [];
	if (options.method) parts.push(`method: '${options.method}'`);
	if (options.body) parts.push(`body: ${options.body}`);
	if (options.responseSchema) parts.push(`responseSchema: ${options.responseSchema}`);
	return parts.length > 0 ? `, { ${parts.join(', ')} }` : '';
}

/**
 * @param {EndpointMeta} endpoint
 * @param {Record<string, unknown>} operation
 * @param {Record<string, unknown>} components
 */
function emitRemote(endpoint, operation, components) {
	const { remoteExport, remoteKind, path: routePath, pathParams, requestSchemaName, responseSchemaName } =
		endpoint;

	const requestComponentName = requestSchemaName?.replace(/Schema$/, '') ?? null;
	const requestSchema = requestComponentName ? components[requestComponentName] : null;

	const inputSchema = buildInputSchema(
		pathParams,
		requestSchemaName,
		components,
		/** @type {Record<string, unknown> | null} */ (requestSchema)
	);

	const fetchPath = buildFetchPath(routePath, pathParams);
	const method = endpoint.method.toUpperCase();
	const responseSchema =
		typeof responseSchemaName === 'string' && responseSchemaName.startsWith('v.array(')
			? responseSchemaName
			: responseSchemaName ?? null;

	if (remoteKind === 'query' && pathParams.length === 0) {
		return `export const ${remoteExport} = query(async () => {
	return backendFetch(${fetchPath}${formatFetchOptions({ responseSchema })});
});\n`;
	}

	if (remoteKind === 'query' && pathParams.length === 1) {
		const param = pathParams[0];
		return `export const ${remoteExport} = query(v.pipe(v.string(), v.nonEmpty()), async (${param}) => {
	return backendFetch(${fetchPath}${formatFetchOptions({ responseSchema })});
});\n`;
	}

	if (remoteKind === 'query') {
		return `export const ${remoteExport} = query(${inputSchema}, async (data) => {
	const { ${pathParams.join(', ')} } = data;
	return backendFetch(${fetchPath}${formatFetchOptions({ responseSchema })});
});\n`;
	}

	if (remoteKind === 'form' && pathParams.length === 0) {
		return `export const ${remoteExport} = form(${requestSchemaName}, async (data) => {
	return backendFetch(${fetchPath}${formatFetchOptions({ method, body: 'data', responseSchema })});
});\n`;
	}

	if (remoteKind === 'form' && pathParams.length > 0) {
		return `export const ${remoteExport} = form(${inputSchema}, async (data) => {
	const { ${pathParams.join(', ')}, ...payload } = data;
	return backendFetch(${fetchPath}${formatFetchOptions({ method, body: 'payload', responseSchema })});
});\n`;
	}

	if (remoteKind === 'command' && pathParams.length === 1) {
		const param = pathParams[0];
		return `export const ${remoteExport} = command(v.pipe(v.string(), v.nonEmpty()), async (${param}) => {
	return backendFetch(${fetchPath}${formatFetchOptions({ method, responseSchema })});
});\n`;
	}

	return `export const ${remoteExport} = command(${inputSchema}, async (data) => {
	const { ${pathParams.join(', ')} } = data;
	return backendFetch(${fetchPath}${formatFetchOptions({ method, responseSchema })});
});\n`;
}

function resolveOpenApiPath() {
	if (process.env.OPENAPI_PATH) {
		return path.resolve(process.env.OPENAPI_PATH);
	}

	if (fs.existsSync(defaultOpenApiPath)) {
		return defaultOpenApiPath;
	}

	if (fs.existsSync(fixtureOpenApiPath)) {
		console.warn(
			`warning: ${defaultOpenApiPath} not found — using POC fixture at ${fixtureOpenApiPath}\n` +
				'         Run `make export-openapi` in api/ (or commit api/openapi.json) for production generation.'
		);
		return fixtureOpenApiPath;
	}

	console.error(
		`error: OpenAPI document not found at ${defaultOpenApiPath}\n` +
			'       Export it from FastAPI (api/scripts/export_openapi.py) or set OPENAPI_PATH.'
	);
	process.exit(1);
}

function main() {
	const openApiPath = resolveOpenApiPath();
	const document = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
	const components = document.components?.schemas ?? {};
	/** @type {EndpointMeta[]} */
	const endpoints = [];

	for (const [routePath, methods] of Object.entries(document.paths ?? {})) {
		if (!pathPrefixes.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`))) {
			continue;
		}

		for (const [method, operation] of Object.entries(methods)) {
			if (!operation || typeof operation !== 'object') continue;

			const remoteKind = getRemoteKind(method, operation);
			const operationId =
				typeof operation.operationId === 'string' ? operation.operationId : `${method}_${routePath}`;
			const remoteExport = toRemoteExportName(operationId, method, routePath);
			const pathParams = getPathParams(routePath, operation);
			const requestSchemaRef = getRequestSchemaName(operation, components);
			const responseSchemaName = getResponseSchemaName(operation, components);

			endpoints.push({
				operationId,
				method: method.toUpperCase(),
				path: routePath,
				remoteExport,
				remoteKind,
				remoteImportPath: '$lib/generated/remotes/agents.remote.js',
				requestSchemaName: requestSchemaRef,
				responseSchemaName:
					typeof responseSchemaName === 'string' ? responseSchemaName : null,
				pathParams
			});
		}
	}

	endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

	const schemaNames = new Set();
	for (const endpoint of endpoints) {
		const operation = Object.entries(document.paths[endpoint.path] ?? {}).find(
			([method]) => method.toLowerCase() === endpoint.method.toLowerCase()
		)?.[1];
		if (!operation) continue;

		if (endpoint.requestSchemaName) {
			const componentName = endpoint.requestSchemaName.replace(/Schema$/, '');
			schemaNames.add(componentName);
			collectSchemaRefs(components[componentName], components, schemaNames);
		}

		const response = getResponseSchemaName(operation, components);
		if (typeof response === 'string' && !response.startsWith('v.array(')) {
			schemaNames.add(response.replace(/Schema$/, ''));
		} else if (typeof response === 'string' && response.startsWith('v.array(')) {
			const match = response.match(/v\.array\((\w+)\)/);
			if (match) {
				schemaNames.add(match[1].replace(/Schema$/, ''));
			}
		}
	}

	const schemaOrder = [...schemaNames].sort((a, b) => {
		const priority = ['AgentCreate', 'AgentUpdate', 'Timestamped', 'Agent', 'AgentProperties'];
		return priority.indexOf(a) - priority.indexOf(b) || a.localeCompare(b);
	});

	let schemasSource = `${banner}import * as v from 'valibot';\n\n`;
	for (const name of schemaOrder) {
		if (components[name]) {
			const forForm = name === 'AgentCreate' || name === 'AgentUpdate';
			schemasSource += emitComponentSchema(name, components[name], components, { forForm });
			schemasSource += '\n';
		}
	}

	let typesSource = `${banner}import type * as v from 'valibot';\n\n`;
	typesSource += `import {\n\t${schemaOrder.map((name) => toSchemaName(name)).join(',\n\t')}\n} from '../schemas/agents.js';\n\n`;
	for (const name of schemaOrder) {
		const schemaName = toSchemaName(name);
		const typeName = name;
		typesSource += `export type ${typeName} = v.InferOutput<typeof ${schemaName}>;\n`;
	}

	const schemaImports = new Set();
	for (const endpoint of endpoints) {
		if (endpoint.requestSchemaName) schemaImports.add(endpoint.requestSchemaName);
		if (endpoint.responseSchemaName && !endpoint.responseSchemaName.startsWith('v.array(')) {
			schemaImports.add(endpoint.responseSchemaName);
		}
		if (endpoint.responseSchemaName?.startsWith('v.array(')) {
			const match = endpoint.responseSchemaName.match(/v\.array\((\w+)\)/);
			if (match) schemaImports.add(match[1]);
		}
	}

	let remotesSource = `${banner}import { command, form, query } from '$app/server';\nimport * as v from 'valibot';\n\n`;
	remotesSource += `import { backendFetch } from '$lib/server/backend-fetch.js';\n`;
	remotesSource += `import { ${[...schemaImports].sort().join(', ')} } from '../schemas/agents.js';\n\n`;

	for (const endpoint of endpoints) {
		const operation = Object.entries(document.paths[endpoint.path] ?? {}).find(
			([method]) => method.toLowerCase() === endpoint.method.toLowerCase()
		)?.[1];
		if (!operation) continue;
		remotesSource += emitRemote(endpoint, operation, components);
		remotesSource += '\n';
	}

	let metadataSource = `${banner}export type RemoteKind = 'query' | 'form' | 'command';\n\n`;
	metadataSource += `export type GeneratedEndpoint = {\n`;
	metadataSource += `\toperationId: string;\n`;
	metadataSource += `\tmethod: string;\n`;
	metadataSource += `\tpath: string;\n`;
	metadataSource += `\tremoteImportPath: string;\n`;
	metadataSource += `\tremoteExport: string;\n`;
	metadataSource += `\tremoteKind: RemoteKind;\n`;
	metadataSource += `\trequestSchemaName: string | null;\n`;
	metadataSource += `\tresponseSchemaName: string | null;\n`;
	metadataSource += `};\n\n`;
	metadataSource += `export const endpoints: GeneratedEndpoint[] = ${JSON.stringify(
		endpoints.map(({ pathParams, ...rest }) => rest),
		null,
		'\t'
	)};\n`;

	fs.mkdirSync(path.join(generatedRoot, 'schemas'), { recursive: true });
	fs.mkdirSync(path.join(generatedRoot, 'types'), { recursive: true });
	fs.mkdirSync(path.join(generatedRoot, 'remotes'), { recursive: true });
	fs.mkdirSync(path.join(generatedRoot, 'metadata'), { recursive: true });

	fs.writeFileSync(path.join(generatedRoot, 'schemas/agents.ts'), schemasSource);
	fs.writeFileSync(path.join(generatedRoot, 'types/agents.ts'), typesSource);
	fs.writeFileSync(path.join(generatedRoot, 'remotes/agents.remote.ts'), remotesSource);
	fs.writeFileSync(path.join(generatedRoot, 'metadata/endpoints.ts'), metadataSource);

	console.log(`Generated ${endpoints.length} agents endpoints in ${generatedRoot}`);
}

main();
