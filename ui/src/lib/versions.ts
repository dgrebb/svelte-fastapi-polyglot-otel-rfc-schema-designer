export type PackageVersions = {
	api: string;
	ui: string;
};

/** Display label aligned with release tags (`api-0.1.0`, `ui-0.0.1`) but using `@` for readability. */
export function formatPackageVersions(versions: PackageVersions): string {
	return `api@${versions.api} | ui@${versions.ui}`;
}
