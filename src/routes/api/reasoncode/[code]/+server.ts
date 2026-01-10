import { type RequestHandler, json } from '@sveltejs/kit';

import { REFERENCE_DATA_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ params }) => {
	const { code } = params;
	const url = `https://api1.raildata.org.uk/1010-reference-data1_0/LDBSVWS/api/ref/20211101/GetReasonCode/${code}`;
	const response = await fetch(url, {
		headers: {
			'x-apikey': REFERENCE_DATA_KEY
		}
	});
	const data = await response.json();

	return json(data);
};
