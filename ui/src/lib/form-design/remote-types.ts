export type FormDesignFormRemote = {
	enhance: (
		handler: (form: { submit: () => Promise<boolean> }) => Promise<void>
	) => Record<string, unknown>;
	fields?: Record<
		string,
		{ as: (kind: string, defaultValue?: string | number) => Record<string, unknown> }
	> & {
		allIssues?: () => Array<{ message: string }> | undefined;
	};
	result?: unknown;
};

export type FormDesignFieldBindings = Record<
	string,
	{ as: (kind: string, defaultValue?: string | number) => Record<string, unknown> }
>;
