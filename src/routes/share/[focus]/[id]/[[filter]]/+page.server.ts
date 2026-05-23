import type { TrainService } from '$lib/types/index.js';
import dayjs from 'dayjs';

import { API_COMPATIBLE_VERSION } from '../../../../api/_shared/index.js';

export const ssr = true;

export const load = async ({ params, fetch }) => {
	const { id, focus, filter } = params;

	const response = await fetch(`/api/service/${id}/${focus}${filter ? `/${filter}` : ''}`, {
		headers: {
			'api-version': API_COMPATIBLE_VERSION
		}
	});
	const data: TrainService = await response.json();

	if (!data.focus || !data.filter) return;

	let title = `${data.focus.name} to ${data.filter.name} on the ${dayjs(data.focus.times.plan.dep).format('HH:mm')} towards ${data.destination.map((d) => d.name).join(', ')}`;

	if (data.destination.some((d) => d.name === data.filter.name)) {
		title = `${dayjs(data.focus.times.plan.dep).format('HH:mm')} ${data.focus.name} to ${data.destination.map((d) => d.name).join(', ')}`;
	}

	const description = `Follow this ${data.operator.name} service live, on WhereIsMyTrain?`;

	return { id, service: data, focus, filter, title, description };
};
