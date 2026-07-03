/** Runtime release versions for /status — injected via Docker, compose, or `ui/.env`. */
export const variables = {
	UI_VERSION: {
		description: 'UI release segment (tag ui-X.Y.Z → X.Y.Z)'
	},
	API_VERSION: {
		description: 'API release segment (tag api-X.Y.Z → X.Y.Z)'
	}
};
