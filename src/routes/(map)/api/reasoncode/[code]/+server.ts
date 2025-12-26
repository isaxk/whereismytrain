import { REFERENCE_DATA_KEY } from '$env/static/private';
import { type RequestHandler, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const { code } = params;
	let url = `https://api1.raildata.org.uk/1010-reference-data1_0/LDBSVWS/api/ref/20211101/GetReasonCode/${code}`;
	const response = await fetch(url, {
		headers: {
			'x-apikey': REFERENCE_DATA_KEY
		}
	});
	const data = await response.json();

	return json(data);
};
