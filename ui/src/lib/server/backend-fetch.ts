import { API_BASE_URL } from '$app/env/private';
import type { ZodTypeAny, infer as InferOutput } from 'zod';

export class BackendError extends Error {
	status: number;
	detail: unknown;

	constructor(message: string, status: number, detail?: unknown) {
		super(message);
		this.name = 'BackendError';
		this.status = status;
		this.detail = detail;
	}
}

type BackendFetchOptions<TSchema extends ZodTypeAny | undefined = undefined> = {
	method?: string;
	body?: unknown;
	headers?: Record<string, string>;
	responseSchema?: TSchema;
};

function resolveApiBaseUrl(): string {
	const base =
		API_BASE_URL?.trim() || process.env.PUBLIC_API_URL?.trim() || 'http://localhost:8000';
	return base.replace(/\/$/, '');
}

function normalizeDetail(payload: unknown): { message: string; raw: unknown } {
	if (typeof payload === 'object' && payload !== null && 'detail' in payload) {
		const detail = (payload as { detail: unknown }).detail;

		if (typeof detail === 'string') {
			return { message: detail, raw: detail };
		}

		if (Array.isArray(detail)) {
			const message = detail
				.map((entry) => {
					if (typeof entry === 'object' && entry !== null && 'msg' in entry) {
						return String((entry as { msg: unknown }).msg);
					}
					return JSON.stringify(entry);
				})
				.join('; ');
			return { message: message || 'Validation error', raw: detail };
		}

		if (typeof detail === 'object' && detail !== null) {
			if ('message' in detail) {
				return { message: String((detail as { message: unknown }).message), raw: detail };
			}
			return { message: JSON.stringify(detail), raw: detail };
		}
	}

	if (typeof payload === 'string' && payload.length > 0) {
		return { message: payload, raw: payload };
	}

	return { message: 'Backend request failed', raw: payload };
}

export async function backendFetch<TSchema extends ZodTypeAny | undefined = undefined>(
	path: string,
	options: BackendFetchOptions<TSchema> = {}
): Promise<TSchema extends ZodTypeAny ? InferOutput<TSchema> : unknown> {
	const { method = 'GET', body, headers = {}, responseSchema } = options;
	const url = `${resolveApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

	const fetchHeaders: Record<string, string> = { ...headers };
	const init: RequestInit = { method, headers: fetchHeaders };

	if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
		fetchHeaders['Content-Type'] = 'application/json';
		init.body = JSON.stringify(body);
	}

	// Future: forward session/auth headers from getRequestEvent().

	const response = await fetch(url, init);
	const contentType = response.headers.get('content-type') ?? '';
	const payload: unknown = contentType.includes('application/json')
		? await response.json()
		: await response.text();

	if (!response.ok) {
		const { message, raw } = normalizeDetail(payload);
		throw new BackendError(message, response.status, raw);
	}

	if (responseSchema) {
		const result = responseSchema.safeParse(payload);
		if (!result.success) {
			throw new BackendError('Response validation failed', response.status, result.error.issues);
		}
		return result.data as TSchema extends ZodTypeAny ? InferOutput<TSchema> : unknown;
	}

	return payload as TSchema extends ZodTypeAny ? InferOutput<TSchema> : unknown;
}
