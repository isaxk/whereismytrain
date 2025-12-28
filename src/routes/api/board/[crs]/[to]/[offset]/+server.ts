import { ACCESS_TOKEN } from '$env/static/private';
import { operatorList } from '$lib/data/operators';
import { Category, Severity, type Board, type BoardItem, type Notice } from '$lib/types';
import { json, type RequestHandler, error as kitError } from '@sveltejs/kit';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { findOvergroundLine } from '$lib/data/overground';
import { parseBoardItem } from '../../../../_shared';

dayjs.extend(utc);
dayjs.extend(tz);

const nullTime = '0001-01-01T00:00:00';

export const GET: RequestHandler = async ({ params }) => {
	const { crs, to, offset } = params;

	if (!crs) {
		return new Response('CRS is required', { status: 400 });
	}

	let shouldUseRailData = false;
	if (Math.abs(parseInt(offset || '0')) > 119) {
		shouldUseRailData = true;
	}

	const time = dayjs()
		.tz('Europe/London')
		.add(parseInt(offset || '0'), 'minute');

	let url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/20?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
	if (shouldUseRailData) {
		const urlObj = new URL(
			`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepartureBoardByCRS/${crs}/${time.format('YYYYMMDDTHHmmss')}?numRows=20`
		);
		if (to && to != 'null') urlObj.searchParams.append('filterCRS', to);
		url = urlObj.toString();
	} else {
		if (to != 'null') {
			url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/to/${to}/20?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
		}
	}

	try {
		// console.log(url);
		const response = await fetch(url, {
			headers: shouldUseRailData
				? {
						'x-apikey': ACCESS_TOKEN
					}
				: {}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch station board');
		}

		const data = await response.json();

		const services = (data.trainServices ?? [])
			.concat(data.busServices ?? [])
			.toSorted((a: any, b: any) => dayjs(a.std).diff(dayjs(b.std)))
			.map((s: any) => parseBoardItem(s));

		const nrccMessages: Notice[] = (data.nrccMessages ?? [])
			.toSorted((a: any, b: any) => b.severity - a.severity)
			.map((m: any) => ({
				...m,
				category: typeof m.category === 'number' ? m.category : Category[m.category],
				severity:
					typeof m.severity === 'number' ? m.severity : (Severity[m.severity.toLowerCase()] ?? 0),
				xhtmlMessage: m.xhtmlMessage
					.replace('Latest information can be found in', '')
					.replace('Status and Disruptions.', 'More info')
			}));

		console.log(data.nrccMessages);

		const board: Board = {
			services,
			details: {
				name: data.locationName,
				crs: crs,
				filterName: data.filterLocationName ?? null,
				filterCrs: to && to != 'null' ? to : null,
				offset: parseInt(offset ?? '0'),
				time,
				notices: nrccMessages
			}
		};

		return json(board);
	} catch (error: any) {
		console.log(error);
		return kitError(500, error.message);
	}
};
