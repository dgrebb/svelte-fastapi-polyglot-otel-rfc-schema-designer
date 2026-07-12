#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(uiRoot, '..');
const banner = '// @generated — do not edit\n';

const defaultOpenApiPath = path.join(repoRoot, 'api/openapi.json');
const fixtureOpenApiPath = path.join(__dirname, 'fixtures/openapi-agents.json');
const pathPrefixes = ['/agents'];

/** @typedef {'query' | 'form' | 'command'} RemoteKind */

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
	if (segments.length === 2 && segments[0] === 'agents' && normalizedMethod === 'get')
		return 'getAgent';
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
	if (!schema || typeof schema !== 'object') return schema;

	if ('$ref' in schema && typeof schema.$ref === 'string') {
		const name = refName(schema.$ref);
		const resolved = components[name];
		if (!resolved) throw new Error(`Unresolved schema reference: ${schema.$ref}`);
		return resolveSchema(resolved, components);
	}

	if ('allOf' in schema && Array.isArray(schema.allOf)) {
		const merged = { type: 'object', properties: {}, required: [] };
		for (const part of schema.allOf) {
			const resolved = resolveSchema(part, components);
			if (resolved && typeof resolved === 'object') {
				Object.assign(merged.properties, resolved.properties ?? {});
				if (Array.isArray(resolved.required)) merged.required.push(...resolved.required);
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
	if (!schema || typeof schema !== 'object') return;

	if ('$ref' in schema && typeof schema.$ref === 'string') {
		const name = refName(schema.$ref);
		if (!emitted.has(name) && components[name]) {
			emitted.add(name);
			collectSchemaRefs(components[name], components, emitted);
		}
		return;
	}

	if ('allOf' in schema && Array.isArray(schema.allOf)) {
		for (const part of schema.allOf) collectSchemaRefs(part, components, emitted);
	}

	if ('items' in schema) collectSchemaRefs(schema.items, components, emitted);

	if ('properties' in schema && schema.properties && typeof schema.properties === 'object') {
		for (const value of Object.values(schema.properties)) {
			collectSchemaRefs(value, components, emitted);
		}
	}
}

/**
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 * @param {{ forForm?: boolean, ctx?: string }} [options]
 */
function schemaExpression(schema, components, options = {}) {
	const { forForm = false, ctx = 'schema' } = options;
	const resolved = resolveSchema(schema, components);

	if (!resolved || typeof resolved !== 'object') return 'z.unknown()';

	if ('oneOf' in resolved || 'anyOf' in resolved) {
		const variants = Array.isArray(resolved.oneOf) ? resolved.oneOf : resolved.anyOf;
		if (!Array.isArray(variants) || variants.length === 0) {
			throw new Error(`Unsupported empty oneOf/anyOf at ${ctx}`);
		}
		const nullable = variants.some(
			(entry) => entry && typeof entry === 'object' && entry.type === 'null'
		);
		const nonNull = variants.filter(
			(entry) => entry && typeof entry === 'object' && entry.type !== 'null'
		);
		if (nonNull.length !== 1) {
			throw new Error(
				`Unsupported oneOf/anyOf union at ${ctx}; only nullable unions are supported`
			);
		}
		const expression = schemaExpression(nonNull[0], components, options);
		if (nullable && forForm) return expression;
		return nullable ? `${expression}.nullable()` : expression;
	}

	if (Array.isArray(resolved.type)) {
		const types = resolved.type.filter((type) => type !== 'null');
		const nullable = resolved.type.includes('null');
		if (types.length !== 1) {
			throw new Error(`Unsupported multi-type union at ${ctx}: ${resolved.type.join(', ')}`);
		}
		const expression = schemaExpression({ ...resolved, type: types[0] }, components, options);
		return nullable ? `${expression}.nullable()` : expression;
	}

	if (resolved.type === 'string') {
		if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
			const values = resolved.enum.map((value) => JSON.stringify(value)).join(', ');
			return `z.enum([${values}])`;
		}
		let expression = 'z.string()';
		if (typeof resolved.minLength === 'number') expression += `.min(${resolved.minLength})`;
		if (typeof resolved.maxLength === 'number') expression += `.max(${resolved.maxLength})`;
		return expression;
	}

	if (resolved.type === 'integer' || resolved.type === 'number') {
		let expression = 'z.number()';
		if (resolved.type === 'integer') expression += '.int()';
		if (typeof resolved.minimum === 'number') expression += `.min(${resolved.minimum})`;
		if (typeof resolved.maximum === 'number') expression += `.max(${resolved.maximum})`;
		return expression;
	}

	if (resolved.type === 'boolean') return 'z.boolean()';

	if (resolved.type === 'array') {
		const items = schemaExpression(resolved.items ?? { type: 'string' }, components, {
			...options,
			ctx: `${ctx}.items`
		});
		return `z.array(${items})`;
	}

	if (resolved.type === 'object' || resolved.properties) {
		const properties = resolved.properties ?? {};
		const required = new Set(resolved.required ?? []);
		const entries = Object.entries(properties).map(([key, value]) => {
			const keyCtx = `${ctx}.${key}`;
			let expression = schemaExpression(value, components, { ...options, ctx: keyCtx });
			const hasDefault = value && typeof value === 'object' && 'default' in value;
			if (hasDefault && value && typeof value === 'object') {
				expression += `.default(${JSON.stringify(value.default)})`;
			}
			if (!required.has(key)) expression += '.optional()';
			return `\t\t${JSON.stringify(key)}: ${expression}`;
		});
		return `z.object({\n${entries.join(',\n')}\n\t})`;
	}

	throw new Error(
		`Unsupported schema type at ${ctx}: ${JSON.stringify(resolved.type ?? 'unknown')}`
	);
}

/**
 * @param {string} componentName
 * @param {unknown} schema
 * @param {Record<string, unknown>} components
 * @param {{ forForm?: boolean }} [options]
 */
function emitComponentSchema(componentName, schema, components, options = {}) {
	const exportName = toSchemaName(componentName);
	const expression = schemaExpression(schema, components, {
		...options,
		ctx: `components.${componentName}`
	});
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
				.filter((param) => param && typeof param === 'object' && param.in === 'path')
				.map((param) => param.name)
		: [];
	return [...new Set([...inline, ...parameterNames])];
}

/**
 * @param {Record<string, unknown>} operation
 */
function getRequestSchemaName(operation) {
	const json = operation.requestBody?.content?.['application/json'];
	const schema = json?.schema;
	if (!schema || typeof schema !== 'object') return null;
	if ('$ref' in schema && typeof schema.$ref === 'string')
		return toSchemaName(refName(schema.$ref));
	return 'RequestBodySchema';
}

/**
 * @param {Record<string, unknown>} operation
 */
function getResponseSchemaName(operation) {
	for (const status of ['200', '201', '204']) {
		const schema = operation.responses?.[status]?.content?.['application/json']?.schema;
		if (!schema || typeof schema !== 'object') continue;
		if ('$ref' in schema && typeof schema.$ref === 'string')
			return toSchemaName(refName(schema.$ref));
		if (schema.type === 'array' && schema.items && typeof schema.items === 'object') {
			if ('$ref' in schema.items && typeof schema.items.$ref === 'string') {
				return `z.array(${toSchemaName(refName(schema.items.$ref))})`;
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
	if (pathParams.length === 0) return requestSchemaName;

	const pathFields = pathParams.map((param) => `\t\t${JSON.stringify(param)}: z.string().min(1)`);

	if (!requestSchemaName || !requestSchema) {
		if (pathParams.length === 1) return 'z.string().min(1)';
		return `z.object({\n${pathFields.join(',\n')}\n\t})`;
	}

	const resolved = resolveSchema(requestSchema, components);
	const properties = resolved.properties ?? {};
	const required = new Set(resolved.required ?? []);
	const bodyFields = Object.entries(properties).map(([key, value]) => {
		let expression = schemaExpression(value, components, {
			forForm: true,
			ctx: `requestBody.${key}`
		});
		const hasDefault = value && typeof value === 'object' && 'default' in value;
		if (hasDefault && value && typeof value === 'object') {
			expression += `.default(${JSON.stringify(value.default)})`;
		}
		if (!required.has(key)) expression += '.optional()';
		return `\t\t${JSON.stringify(key)}: ${expression}`;
	});

	return `z.object({\n${pathFields.join(',\n')}${bodyFields.length ? `,\n${bodyFields.join(',\n')}` : ''}\n\t})`;
}

/**
 * @param {string} routePath
 * @param {string[]} pathParams
 */
function buildFetchPath(routePath, pathParams) {
	if (pathParams.length === 0) return `'${routePath}'`;
	let expression = routePath;
	for (const param of pathParams) expression = expression.replace(`{${param}}`, `\${${param}}`);
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
 * @param {any} endpoint
 * @param {Record<string, unknown>} operation
 * @param {Record<string, unknown>} components
 */
function emitRemote(endpoint, operation, components) {
	const {
		remoteExport,
		remoteKind,
		path: routePath,
		pathParams,
		requestSchemaName,
		responseSchemaName
	} = endpoint;
	const requestComponentName = requestSchemaName?.replace(/Schema$/, '') ?? null;
	const requestSchema = requestComponentName ? components[requestComponentName] : null;

	const inputSchema = buildInputSchema(pathParams, requestSchemaName, components, requestSchema);
	const fetchPath = buildFetchPath(routePath, pathParams);
	const method = endpoint.method.toUpperCase();
	const responseSchema =
		typeof responseSchemaName === 'string' && responseSchemaName.startsWith('z.array(')
			? responseSchemaName
			: (responseSchemaName ?? null);

	if (remoteKind === 'query' && pathParams.length === 0) {
		return `export const ${remoteExport} = query(async () => {
	return backendFetch(${fetchPath}${formatFetchOptions({ responseSchema })});
});\n`;
	}
	if (remoteKind === 'query' && pathParams.length === 1) {
		const param = pathParams[0];
		return `export const ${remoteExport} = query(z.string().min(1), async (${param}) => {
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
		return `export const ${remoteExport} = command(z.string().min(1), async (${param}) => {
	return backendFetch(${fetchPath}${formatFetchOptions({ method, responseSchema })});
});\n`;
	}
	return `export const ${remoteExport} = command(${inputSchema}, async (data) => {
	const { ${pathParams.join(', ')} } = data;
	return backendFetch(${fetchPath}${formatFetchOptions({ method, responseSchema })});
});\n`;
}

function parseArgs() {
	const args = process.argv.slice(2);
	const byFlag = new Map();
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg.startsWith('--')) {
			byFlag.set(arg, args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true');
		}
	}
	return byFlag;
}

function resolveOpenApiPath(flags) {
	const candidate = flags.get('--input') || process.env.OPENAPI_PATH;
	if (candidate) return path.resolve(candidate);
	if (fs.existsSync(defaultOpenApiPath)) return defaultOpenApiPath;
	if (fs.existsSync(fixtureOpenApiPath)) {
		console.warn(
			`warning: ${defaultOpenApiPath} not found — using fixture at ${fixtureOpenApiPath}`
		);
		return fixtureOpenApiPath;
	}
	console.error(`error: OpenAPI document not found at ${defaultOpenApiPath}`);
	process.exit(1);
}

function resolveOutputRoot(flags) {
	const customOut = flags.get('--out');
	if (customOut) return path.resolve(customOut);
	return path.join(uiRoot, 'src/lib/generated-zod');
}

function main() {
	const flags = parseArgs();
	const openApiPath = resolveOpenApiPath(flags);
	const generatedRoot = resolveOutputRoot(flags);
	const document = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
	const components = document.components?.schemas ?? {};
	const endpoints = [];

	for (const [routePath, methods] of Object.entries(document.paths ?? {})) {
		if (!pathPrefixes.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`)))
			continue;
		for (const [method, operation] of Object.entries(methods)) {
			if (!operation || typeof operation !== 'object') continue;
			const remoteKind = getRemoteKind(method, operation);
			const operationId =
				typeof operation.operationId === 'string'
					? operation.operationId
					: `${method}_${routePath}`;
			const remoteExport = toRemoteExportName(operationId, method, routePath);
			const pathParams = getPathParams(routePath, operation);
			endpoints.push({
				operationId,
				method: method.toUpperCase(),
				path: routePath,
				remoteExport,
				remoteKind,
				remoteImportPath: '$lib/generated/remotes/agents.remote.js',
				requestSchemaName: getRequestSchemaName(operation),
				responseSchemaName: getResponseSchemaName(operation),
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
			const n = endpoint.requestSchemaName.replace(/Schema$/, '');
			schemaNames.add(n);
			collectSchemaRefs(components[n], components, schemaNames);
		}
		const response = getResponseSchemaName(operation);
		if (typeof response === 'string' && !response.startsWith('z.array(')) {
			schemaNames.add(response.replace(/Schema$/, ''));
		} else if (typeof response === 'string' && response.startsWith('z.array(')) {
			const match = response.match(/z\.array\((\w+)\)/);
			if (match) schemaNames.add(match[1].replace(/Schema$/, ''));
		}
	}

	const schemaOrder = [...schemaNames].sort((a, b) => a.localeCompare(b));
	const schemaImports = new Set();
	for (const endpoint of endpoints) {
		if (endpoint.requestSchemaName) schemaImports.add(endpoint.requestSchemaName);
		if (endpoint.responseSchemaName && !endpoint.responseSchemaName.startsWith('z.array(')) {
			schemaImports.add(endpoint.responseSchemaName);
		}
		if (endpoint.responseSchemaName?.startsWith('z.array(')) {
			const match = endpoint.responseSchemaName.match(/z\.array\((\w+)\)/);
			if (match) schemaImports.add(match[1]);
		}
	}

	let schemasSource = `${banner}import { z } from 'zod';\n\n`;
	for (const name of schemaOrder) {
		if (components[name]) {
			const forForm = name === 'AgentCreate' || name === 'AgentUpdate';
			schemasSource += emitComponentSchema(name, components[name], components, { forForm });
			schemasSource += '\n';
		}
	}

	let typesSource = `${banner}import { z } from 'zod';\n\n`;
	typesSource += `import {\n\t${schemaOrder.map((name) => toSchemaName(name)).join(',\n\t')}\n} from '../schemas/agents.js';\n\n`;
	for (const name of schemaOrder) {
		typesSource += `export type ${name} = z.infer<typeof ${toSchemaName(name)}>;\n`;
	}

	let remotesSource = `${banner}import { command, form, query } from '$app/server';\nimport { z } from 'zod';\n\n`;
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
	metadataSource += `\toperationId: string;\n\tmethod: string;\n\tpath: string;\n\tremoteImportPath: string;\n\tremoteExport: string;\n\tremoteKind: RemoteKind;\n\trequestSchemaName: string | null;\n\tresponseSchemaName: string | null;\n};\n\n`;
	metadataSource += `export const endpoints: GeneratedEndpoint[] = ${JSON.stringify(
		endpoints.map(({ pathParams, ...rest }) => rest),
		null,
		'\t'
	)};\n`;

	for (const folder of ['schemas', 'types', 'remotes', 'metadata']) {
		fs.mkdirSync(path.join(generatedRoot, folder), { recursive: true });
	}
	fs.writeFileSync(path.join(generatedRoot, 'schemas/agents.ts'), schemasSource);
	fs.writeFileSync(path.join(generatedRoot, 'types/agents.ts'), typesSource);
	fs.writeFileSync(path.join(generatedRoot, 'remotes/agents.remote.ts'), remotesSource);
	fs.writeFileSync(path.join(generatedRoot, 'metadata/endpoints.ts'), metadataSource);

	console.log(`Generated ${endpoints.length} agents endpoints in ${generatedRoot}`);
}

try {
	main();
} catch (error) {
	console.error(`generation failed: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
}
