import { error } from '@sveltejs/kit';

import AllStationsJSON from '$lib/data/stations.json';
import type { Board } from '$lib/types/index.js';

export const load = async ({ params, fetch, url }) => {
	const { crs } = params;

	const search = url.searchParams;
	const to = search.get('to') ?? null;
	const offset = parseInt(search.get('offset') ?? '0');

	async function getBoard(): Promise<Board> {
		const response = await fetch(`/api/board/${crs.toUpperCase()}/${to ?? 'null'}/${offset}`);
		const data = await response.json();
		if (!response.ok) {
			throw error(response.status, data.message);
		} else {
			return data;
		}
	}

	return {
		crs: crs.toUpperCase(),
		to: to?.toUpperCase() ?? null,
		board: getBoard(),
		offset,
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
