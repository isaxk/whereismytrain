import type { TrainService } from '$lib/types/index.js';

export const load = async ({ params, fetch, url }) => {
	const { id, crs } = params;

	const to = url.searchParams.get('to') ?? undefined;
	const returnToHome = url.searchParams.get('returnToHome') === '1';

	async function getService(): Promise<TrainService> {
		const response = await fetch(`/api/service/${id}/${crs}${to ? `/${to}` : ''}`);
		const data = await response.json();
		return data;
	}

	return { id, service: getService(), returnToHome };
};
