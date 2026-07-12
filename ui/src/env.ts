import { z } from 'zod';

/** Runtime release versions for /status — injected via Docker, compose, or `ui/.env`. */
export const variables = {
	UI_VERSION: {
		description: 'UI release segment (tag ui-X.Y.Z → X.Y.Z)',
		schema: z.string().optional().default('')
	},
	API_VERSION: {
		description: 'API release segment (tag api-X.Y.Z → X.Y.Z)',
		schema: z.string().optional().default('')
	},
	API_BASE_URL: {
		description: 'FastAPI base URL for server-side backendFetch (falls back to PUBLIC_API_URL)',
		schema: z.string().optional().default('')
	}
};
