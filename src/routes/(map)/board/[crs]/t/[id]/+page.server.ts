import type { TrainService } from '$lib/types/index.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch, url }) => {
	const { id, crs } = params;

	const to = url.searchParams.get('to') ?? undefined;
	const backTo = url.searchParams.get('backTo') ?? null;

	async function getService(): Promise<TrainService> {
		const response = await fetch(`/api/service/${id}/${crs}${to ? `/${to}` : ''}`);

		const data = await response.json();

		if (!response.ok) {
			throw error(500, data.message);
		}

		return data;
	}

	return { id, service: getService(), backTo };
};
