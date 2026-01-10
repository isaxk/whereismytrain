import { error } from '@sveltejs/kit';

import AllStationsJSON from '$lib/data/stations.json';
import type { Board } from '$lib/types';

import { API_COMPATIBLE_VERSION } from '../../../api/_shared/index.js';

export const load = async ({ params, fetch, url }) => {
	const { crs } = params;

	const search = url.searchParams;
	const to = search.get('to') ?? null;
	const time = search.get('time');
	const tomorrow = search.get('tomorrow') == 'true';

	async function getBoard(): Promise<Board> {
		const response = await fetch(
			`/api/board/${crs.toUpperCase()}/${to ?? 'null'}/${time ?? 'null'}/${tomorrow ? 'true' : 'false'}`,
			{
				headers: {
					'api-version': API_COMPATIBLE_VERSION
				}
			}
		);

		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.message);
		} else {
			const data = await response.json();
			return data;
		}
	}

	return {
		crs: crs.toUpperCase(),
		to: to?.toUpperCase() ?? null,
		board: getBoard(),
		time,
		tomorrow,
		map: (async () => ({
			type: 'board',
			from: [
				AllStationsJSON.find((s) => s.crsCode === crs)?.long,
				AllStationsJSON.find((s) => s.crsCode === crs)?.lat
			],
			to: to
				? [
						AllStationsJSON.find((s) => s.crsCode === to)?.long,
						AllStationsJSON.find((s) => s.crsCode === to)?.lat
					]
				: null
		}))()
	};
};
