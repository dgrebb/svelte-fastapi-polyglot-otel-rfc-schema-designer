<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date';
	import { tick } from 'svelte';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import CollapsibleSection from '$lib/components/form-design/CollapsibleSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Command from '$lib/components/ui/command';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import * as Select from '$lib/components/ui/select';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatJson } from '$lib/form-design/schema-introspect.js';
	import { cn } from '$lib/utils.js';

	import {
		modelOptions,
		shadcnPlaygroundSchema,
		tierOptions,
		toolkitOptions,
		type ShadcnPlaygroundSchema
	} from '$lib/form-design/shadcn/schema.js';

	type Props = {
		data: SuperValidated<Infer<ShadcnPlaygroundSchema>>;
	};

	let { data }: Props = $props();

	const form = superForm(data, {
		validators: zod4Client(shadcnPlaygroundSchema)
	});

	const { form: formData, enhance, message } = form;

	const modelLabel = $derived(
		modelOptions.find((option) => option.value === $formData.model)?.label ?? 'Select model'
	);

	let toolkitOpen = $state(false);
	let toolkitTriggerRef = $state<HTMLButtonElement | null>(null);
	const toolkitLabel = $derived(
		toolkitOptions.find((option) => option.value === $formData.toolkit_id)?.label ??
			'Select toolkit'
	);

	let dateOpen = $state(false);
	let scheduledDate = $state<DateValue | undefined>(
		$formData.scheduled_date ? parseDate($formData.scheduled_date) : undefined
	);

	let rangeValue = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({
		start: $formData.availability_start ? parseDate($formData.availability_start) : undefined,
		end: $formData.availability_end ? parseDate($formData.availability_end) : undefined
	});

	let temperatureSlider = $state(0.7);

	$effect(() => {
		$formData.temperature = temperatureSlider;
	});

	$effect(() => {
		$formData.scheduled_date = scheduledDate?.toString();
	});

	$effect(() => {
		$formData.availability_start = rangeValue.start?.toString();
		$formData.availability_end = rangeValue.end?.toString();
	});

	async function closeToolkitAndFocus() {
		toolkitOpen = false;
		await tick();
		toolkitTriggerRef?.focus();
	}
</script>

<form method="POST" use:enhance class="space-y-6">
	<CollapsibleSection
		id="shadcn-text"
		title="Input &amp; textarea"
		subtitle="Form.Field · Form.Control · Form.Label · Form.Description · Form.FieldErrors"
		defaultOpen
	>
		<div class="grid gap-4 sm:grid-cols-2">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input {...props} bind:value={$formData.name} placeholder="Research Assistant" />
					{/snippet}
				</Form.Control>
				<Form.Description>AgentCreateSchema.name — required, max 120 chars.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="max_tokens">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Max tokens</Form.Label>
						<Input {...props} type="number" bind:value={$formData.max_tokens} />
					{/snippet}
				</Form.Control>
				<Form.Description>Integer input alongside slider controls below.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description</Form.Label>
					<Textarea {...props} bind:value={$formData.description} class="min-h-20" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="system_prompt">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>System prompt</Form.Label>
					<Textarea {...props} bind:value={$formData.system_prompt} class="min-h-28" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-select"
		title="Select"
		subtitle="Single-select dropdown — maps well to enum fields in generated schemas."
	>
		<Form.Field {form} name="model">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Model</Form.Label>
					<Select.Root type="single" name={props.name} bind:value={$formData.model}>
						<Select.Trigger class="w-full max-w-sm">
							{modelLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Models</Select.Label>
								{#each modelOptions as option (option.value)}
									<Select.Item value={option.value} label={option.label}>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-radio"
		title="Radio group"
		subtitle="Mutually exclusive choices with keyboard navigation."
	>
		<Form.Field {form} name="tier">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Billing tier</Form.Label>
					<RadioGroup.Root bind:value={$formData.tier} {...props} class="grid gap-2">
						{#each tierOptions as option (option.value)}
							<div class="flex items-center gap-2">
								<RadioGroup.Item value={option.value} id={`tier-${option.value}`} />
								<label for={`tier-${option.value}`} class="text-sm">{option.label}</label>
							</div>
						{/each}
					</RadioGroup.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-switch-checkbox"
		title="Switch &amp; checkbox"
		subtitle="Form.ElementField for controls that are not native inputs."
	>
		<div class="space-y-4">
			<Form.ElementField {form} name="active">
				<div class="flex items-center justify-between rounded-md border border-border/60 p-4">
					<div class="space-y-1">
						<Form.Label>Active</Form.Label>
						<Form.Description>Agent is available for task assignment.</Form.Description>
					</div>
					<Switch bind:checked={$formData.active} />
				</div>
				<Form.FieldErrors />
			</Form.ElementField>

			<Form.ElementField {form} name="send_notifications">
				<div class="flex items-center justify-between rounded-md border border-border/60 p-4">
					<div class="space-y-1">
						<Form.Label>Send notifications</Form.Label>
						<Form.Description>Email on task completion.</Form.Description>
					</div>
					<Switch bind:checked={$formData.send_notifications} />
				</div>
				<Form.FieldErrors />
			</Form.ElementField>

			<Form.ElementField {form} name="accept_terms">
				<div class="flex items-start gap-3 rounded-md border border-border/60 p-4">
					<Checkbox bind:checked={$formData.accept_terms} id="accept-terms" />
					<div class="space-y-1">
						<Form.Label for="accept-terms">Accept terms</Form.Label>
						<Form.Description
							>Required literal true — demonstrates server validation.</Form.Description
						>
						<Form.FieldErrors />
					</div>
				</div>
			</Form.ElementField>
		</div>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-slider"
		title="Slider"
		subtitle="Range control for numeric schema fields like temperature."
	>
		<Form.ElementField {form} name="temperature">
			<Form.Label>Temperature ({$formData.temperature?.toFixed(2) ?? '0.70'})</Form.Label>
			<Slider type="single" bind:value={temperatureSlider} min={0} max={2} step={0.1} />
			<Form.Description>AgentCreateSchema.temperature — min 0, max 2.</Form.Description>
			<Form.FieldErrors />
		</Form.ElementField>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-combobox"
		title="Combobox"
		subtitle="Popover + Command composition — no registry item; built from installed primitives."
	>
		<Form.ElementField {form} name="toolkit_id">
			<Form.Label>Toolkit</Form.Label>
			<Popover.Root bind:open={toolkitOpen}>
				<Popover.Trigger bind:ref={toolkitTriggerRef}>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							role="combobox"
							aria-expanded={toolkitOpen}
							class="w-full max-w-sm justify-between font-normal"
						>
							{toolkitLabel}
							<ChevronsUpDownIcon class="size-4 opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0" align="start">
					<Command.Root>
						<Command.Input placeholder="Search toolkits…" />
						<Command.List>
							<Command.Empty>No toolkit found.</Command.Empty>
							<Command.Group>
								{#each toolkitOptions as option (option.value)}
									<Command.Item
										value={option.value}
										onSelect={() => {
											$formData.toolkit_id = option.value;
											closeToolkitAndFocus();
										}}
									>
										<CheckIcon
											class={cn(
												'me-2 size-4',
												$formData.toolkit_id !== option.value && 'text-transparent'
											)}
										/>
										{option.label}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
			<Form.FieldErrors />
		</Form.ElementField>
	</CollapsibleSection>

	<CollapsibleSection
		id="shadcn-date"
		title="Date picker &amp; calendars"
		subtitle="Calendar + Popover date picker; RangeCalendar for availability windows."
	>
		<div class="grid gap-6 lg:grid-cols-2">
			<Form.ElementField {form} name="scheduled_date">
				<Form.Label>Scheduled date</Form.Label>
				<Popover.Root bind:open={dateOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full justify-between font-normal">
								{scheduledDate
									? scheduledDate.toDate(getLocalTimeZone()).toLocaleDateString()
									: 'Select date'}
								<ChevronDownIcon class="size-4 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<Calendar
							type="single"
							bind:value={scheduledDate}
							captionLayout="dropdown"
							onValueChange={() => {
								dateOpen = false;
							}}
						/>
					</Popover.Content>
				</Popover.Root>
				<Form.FieldErrors />
			</Form.ElementField>

			<div class="space-y-2">
				<p class="text-sm font-medium">Availability range</p>
				<p class="text-xs text-muted-foreground">
					RangeCalendar bound to availability_start / availability_end on the form model.
				</p>
				<RangeCalendar bind:value={rangeValue} class="rounded-md border" />
			</div>
		</div>
	</CollapsibleSection>

	<Form.Button>Submit playground form</Form.Button>

	{#if $message}
		<div class="rounded-md border border-border/60 bg-muted/30 p-4 text-sm">
			<p class="font-medium">Submitted values</p>
			<pre class="mt-2 overflow-x-auto font-mono text-xs">{formatJson($formData)}</pre>
		</div>
	{/if}
</form>
