<script lang="ts">
	import type { FormDesignFieldBindings } from '$lib/form-design/remote-types.js';
	import { fieldsFromJsonSchema, schemaToJson } from '$lib/form-design/schema-introspect.js';
	import type { SchemaFieldConfig } from '$lib/form-design/types.js';
	import type { ZodType } from 'zod';

	import { formInputClass, formTextareaClass } from './styles.js';

	type Props = {
		formFields: FormDesignFieldBindings;
		schema: ZodType;
		legend: string;
		exclude?: string[];
		extra?: SchemaFieldConfig[];
	};

	let { formFields, schema, legend, exclude = [], extra = [] }: Props = $props();

	const fields = $derived([
		...extra,
		...fieldsFromJsonSchema(schemaToJson(schema)).filter(
			(field) => !exclude.includes(field.name) && field.name !== 'tags'
		)
	]);
</script>

<fieldset class="space-y-4 rounded-md border border-border/60 p-4">
	<legend class="px-1 text-sm font-medium capitalize">{legend}</legend>

	<div class="grid gap-4 sm:grid-cols-2">
		{#each fields as field (field.name)}
			<label class="space-y-2 text-sm {field.kind === 'textarea' ? 'sm:col-span-2' : ''}">
				<span class="font-medium capitalize">
					{field.label}
					{#if field.required}
						<span class="text-destructive">*</span>
					{/if}
				</span>
				{#if field.description}
					<span class="block text-xs text-muted-foreground">{field.description}</span>
				{/if}
				{#if field.kind === 'textarea'}
					<textarea
						{...formFields[field.name].as('text', field.defaultValue)}
						class={formTextareaClass}></textarea>
				{:else if field.kind === 'number'}
					<input
						type="number"
						{...formFields[field.name].as('number', field.defaultValue)}
						class={formInputClass}
					/>
				{:else}
					<input
						{...formFields[field.name].as('text', field.defaultValue)}
						class={formInputClass}
					/>
				{/if}
			</label>
		{/each}
	</div>

	<p class="text-xs text-muted-foreground">
		Array fields such as <code>tags</code> are omitted here — bind them manually or use a JSON Schema
		form widget.
	</p>
</fieldset>
