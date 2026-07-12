import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { shadcnPlaygroundSchema } from '$lib/form-design/shadcn/schema.js';

import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(shadcnPlaygroundSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(shadcnPlaygroundSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		return { form };
	}
};
