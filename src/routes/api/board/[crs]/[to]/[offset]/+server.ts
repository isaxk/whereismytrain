import { json, type RequestHandler, error as kitError } from '@sveltejs/kit';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { Category, Severity, type Board, type Notice } from '$lib/types';
import type { StationBoard } from '$lib/types/api';

import { parseBoardItem } from '../../../../_shared';

import { ACCESS_TOKEN } from '$env/static/private';

dayjs.extend(utc);
dayjs.extend(tz);

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

		const data: StationBoard = await response.json();

		const services = (data.trainServices ?? [])
			.concat(data.busServices ?? [])
			.toSorted((a, b) => dayjs(a.std).diff(dayjs(b.std)))
			.map((s) => parseBoardItem(s));

		const nrccMessages: Notice[] = (data.nrccMessages ?? []).map((m) => ({
			...m,
			category: (typeof m.category === 'number'
				? m.category
				: Category[m.category as number]) as Category,
			severity: (typeof m.severity === 'number'
				? m.severity
				: ((Severity as unknown as Record<string, number>)[m.severity as string] ?? 0)) as Severity,
			xhtmlMessage:
				m.xhtmlMessage?.replace(
					/More information can be found in\s*<a href="([^"]+)">[^<]+<\/a>/,
					'<a href="$1">More info</a>'
				) ?? ''
		}));

		const board: Board = {
			services,
			details: {
				name: data.locationName ?? '',
				crs: crs,
				filterName: data.filterLocationName ?? null,
				filterCrs: to && to != 'null' ? to : null,
				offset: parseInt(offset ?? '0'),
				time: dayjs.toString(),
				notices: nrccMessages
			}
		};

		return json(board);
	} catch (error: unknown) {
		console.log(error);
		return kitError(500, (error as Error).message);
	}
};
