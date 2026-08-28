import { PUBLIC_MAP_ENABLED } from '$env/static/public';
import AllStationsJSON from '$lib/data/stations.json';
import type { Board } from '$lib/types';

import { API_COMPATIBLE_VERSION } from '../../../api/_shared/index.js';

export const load = async ({ params, fetch, url }) => {
	const { crs } = params;

	const search = url.searchParams;
	const to = search.get('to') ?? null;
	const time = search.get('time');
	const tomorrow = search.get('tomorrow') == 'true';

	const board = fetch(
		`/api/search/${crs.toUpperCase()}/${to ?? 'null'}/${time ?? 'null'}`,
		{
			headers: {
				'api-version': API_COMPATIBLE_VERSION
			}
		}
	).then(async (response) => {
		if (!response.ok) {
			const data = await response.json();
			throw new Error(JSON.stringify(data));
		} else {
			const data = await response.json();
			return data;
		}
	});

	async function mapData() {
		const data: Board = await board;

		const station = AllStationsJSON.find((s) => s.crsCode === data.details.crs);

		return station
			? {
					type: 'board',
					from: [station?.long, station?.lat],
					to: to
						? [
								AllStationsJSON.find((s) => s.crsCode === to)?.long,
								AllStationsJSON.find((s) => s.crsCode === to)?.lat
							]
						: null
				}
			: null;
	}

	return {
		crs: crs.toUpperCase(),
		to: to?.toUpperCase() ?? null,
		board,
		time: time == 'null' ? null : time,
		tomorrow,
		map: PUBLIC_MAP_ENABLED == 'true' ? mapData() : null
	};
};
