import { API_VERSION, UI_VERSION } from '$app/env/private';

import type { PackageVersions } from '$lib/versions';

const UNKNOWN = 'unknown';

/** UI release segment (tag `ui-X.Y.Z` → `X.Y.Z`). Injected via `UI_VERSION` at runtime. */
export function getUiVersion(): string {
	return UI_VERSION?.trim() || UNKNOWN;
}

/** API release segment (tag `api-X.Y.Z` → `X.Y.Z`). Injected via `API_VERSION` at runtime. */
export function getApiVersion(): string {
	return API_VERSION?.trim() || UNKNOWN;
}

export function getPackageVersions(): PackageVersions {
	return {
		api: getApiVersion(),
		ui: getUiVersion()
	};
}

export type { PackageVersions };
