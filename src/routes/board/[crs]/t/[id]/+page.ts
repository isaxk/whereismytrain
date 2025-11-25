import type { TrainService } from '$lib/types/index.js';

export const load = async ({ params, fetch, url }) => {
	const { id, crs } = params;



	async function getService(): Promise<TrainService> {
		const response = await fetch(`/api/service/${id}/${crs}`);
		const data = await response.json();
		return data;
	}

	return { id, service: getService() };
};
