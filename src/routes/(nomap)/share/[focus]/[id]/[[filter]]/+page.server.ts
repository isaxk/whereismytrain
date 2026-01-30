import type { TrainService } from '$lib/types/index.js';
import { API_COMPATIBLE_VERSION } from '../../../../../api/_shared/index.js';

export const ssr = true;

export const load = async ({ params, fetch }) => {
	const { id, focus, filter } = params;

	const response = await fetch(`/api/service/${id}/${focus}${filter ? `/${filter}` : ''}`, {
		headers: {
			'api-version': API_COMPATIBLE_VERSION
		}
	});
	const data: TrainService = await response.json();

	return { id, service: data, focus, filter };
};
