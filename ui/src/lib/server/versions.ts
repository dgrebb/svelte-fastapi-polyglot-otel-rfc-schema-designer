import fs from 'node:fs';
import path from 'node:path';

import packageJson from '../../../package.json' with { type: 'json' };

export type PackageVersions = {
	api: string;
	ui: string;
};

function readApiVersionFromPyproject(): string | null {
	try {
		const pyprojectPath = path.resolve(import.meta.dirname, '../../../../api/pyproject.toml');
		const content = fs.readFileSync(pyprojectPath, 'utf8');
		const projectSection = content.match(/\[project\][\s\S]*?(?=\n\[|$)/)?.[0];
		const match = projectSection?.match(/^version\s*=\s*"([^"]+)"/m);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

/** UI release version — `UI_VERSION` overrides `package.json` (e.g. Docker build/runtime). */
export function getUiVersion(): string {
	return process.env.UI_VERSION ?? packageJson.version;
}

/** API release version — `API_VERSION` overrides monorepo `api/pyproject.toml` when present. */
export function getApiVersion(): string {
	return process.env.API_VERSION ?? readApiVersionFromPyproject() ?? 'unknown';
}

export function getPackageVersions(): PackageVersions {
	return {
		api: getApiVersion(),
		ui: getUiVersion()
	};
}

/** Display label aligned with release tags (`api-0.1.0`, `ui-0.0.1`) but using `@` for readability. */
export function formatPackageVersions(versions: PackageVersions = getPackageVersions()): string {
	return `api@${versions.api} | ui@${versions.ui}`;
}
