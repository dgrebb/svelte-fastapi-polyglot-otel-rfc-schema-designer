import * as v from 'valibot';

/** Runtime release versions for /status — injected via Docker, compose, or `ui/.env`. */
export const variables = {
	UI_VERSION: {
		description: 'UI release segment (tag ui-X.Y.Z → X.Y.Z)',
		schema: v.optional(v.string(), '')
	},
	API_VERSION: {
		description: 'API release segment (tag api-X.Y.Z → X.Y.Z)',
		schema: v.optional(v.string(), '')
	},
	API_BASE_URL: {
		description: 'FastAPI base URL for server-side backendFetch (falls back to PUBLIC_API_URL)',
		schema: v.optional(v.string(), '')
	}
};
