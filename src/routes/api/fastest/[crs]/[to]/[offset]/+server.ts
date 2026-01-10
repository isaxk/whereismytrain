import { type RequestHandler, json } from '@sveltejs/kit';
import dayjs from 'dayjs';

import { parseBoardItem } from '../../../../_shared';

import { ACCESS_TOKEN, FASTEST_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ params }) => {
	const { crs, to, offset } = params;
	let shouldUseRailData = false;
	if (Math.abs(parseInt(offset || '0')) > 119) {
		shouldUseRailData = true;
	}

	const time = dayjs()
		.tz('Europe/London')
		.add(parseInt(offset || '0'), 'minute');

	let url = `https://huxley2.azurewebsites.net/stafffastest/${crs}?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
	if (shouldUseRailData) {
		const urlObj = new URL(
			`https://api1.raildata.org.uk/1010-live-fastest-departures---staff-version1_2/LDBSVWS/api/20220120/GetFastestDepartures/${crs}/${to}/${time.format('YYYYMMDDTHHmmss')}`
		);
		url = urlObj.toString();
	} else {
		if (to != 'null') {
			url = `https://huxley2.azurewebsites.net/stafffastest/${crs}/to/${to}?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
		}
	}

	const response = await fetch(url, {
		headers: shouldUseRailData
			? {
					'x-apikey': FASTEST_KEY
				}
			: {}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch station board');
	}

	const data = await response.json();

	if (data.departures?.[0]?.service?.rid) {
		const parsed = parseBoardItem(data.departures[0].service);
		return json(parsed);
	} else {
		throw new Error('No service found');
	}
	return json({});
};
