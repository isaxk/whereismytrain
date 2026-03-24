import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { REFERENCE_DATA_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
	const response = await fetch(
		`https://api1.raildata.org.uk/1010-reference-data1_0/LDBSVWS/api/ref/20211101/GetStationList/1`,
		{
			headers: {
				'x-apikey': REFERENCE_DATA_KEY
			}
		}
	);
	const data = await response.json();
	if (response.ok) {
		return json(data.StationList);
	} else {
		return error(response.status, data);
	}
};
