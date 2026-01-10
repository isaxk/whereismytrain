import type { TrainService } from '$lib/types/index.js';

export const ssr = true;

export const load = async ({ params, fetch }) => {
	const { id, focus, filter } = params;

	const response = await fetch(`/api/service/${id}/${focus}${filter ? `/${filter}` : ''}`);
	const data: TrainService = await response.json();

	return { id, service: data, focus, filter };
};
