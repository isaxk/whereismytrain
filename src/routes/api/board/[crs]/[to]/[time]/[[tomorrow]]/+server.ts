import { json, type RequestHandler, error as kitError } from '@sveltejs/kit';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { Category, Severity, type Board, type BoardItem, type Notice } from '$lib/types';
import type { ServiceItemWithLocations, StationBoard } from '$lib/types/api';
import { dayjsFromHHmm } from '$lib/utils';

import { API_COMPATIBLE_VERSION, NULL_TIME } from '../../../../../_shared';

import { ACCESS_TOKEN } from '$env/static/private';
import { operatorList } from '$lib/data/operators';

dayjs.extend(utc);
dayjs.extend(tz);

function parseBoardItem(item: ServiceItemWithLocations, filter): BoardItem {
	if (item.ata === NULL_TIME) item.ata = null;
	if (item.atd === NULL_TIME) item.atd = null;
	if (item.eta === NULL_TIME) item.eta = null;
	if (item.etd === NULL_TIME) item.etd = null;
	if (item.sta === NULL_TIME) item.sta = null;
	if (item.std === NULL_TIME) item.std = null;

	let delay = null;

	// const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta) : null;
	const rtd = item.atd || item.etd ? dayjs(item.atd ?? item.etd) : null;
	// const pta = item.sta ? dayjs(item.sta) : null;
	const ptd = item.std ? dayjs(item.std) : null;

	item.rid = `${item.rid}`;

	if (rtd && ptd) {
		delay = rtd.diff(ptd, 'minutes');
	}

	const times = {
		rt: {
			arr: item.ata || item.eta ? dayjs(item.ata ?? item.eta).format('HH:mm') : null,
			dep: item.atd || item.etd ? dayjs(item.atd ?? item.etd).format('HH:mm') : null
		},
		plan: {
			arr: item.sta ? dayjs(item.sta).format('HH:mm') : null,
			dep: item.std && item.std !== NULL_TIME ? dayjs(item.std).format('HH:mm') : null
		}
	};

	const filterLocation = item.subsequentLocations
		?.flat()
		.find((location) => location.crs === filter);

	if (filterLocation?.ata === NULL_TIME) filterLocation.ata = null;
	if (filterLocation?.atd === NULL_TIME) filterLocation.atd = null;
	if (filterLocation?.eta === NULL_TIME) filterLocation.eta = null;
	if (filterLocation?.etd === NULL_TIME) filterLocation.etd = null;
	if (filterLocation?.sta === NULL_TIME) filterLocation.sta = null;
	if (filterLocation?.std === NULL_TIME) filterLocation.std = null;

	const filterTimes = filterLocation
		? {
				rt:
					(filterLocation?.ata && filterLocation.ataSpecified) ||
					(filterLocation.eta && filterLocation.etaSpecified)
						? dayjs(filterLocation.ata ?? filterLocation.eta).format('HH:mm')
						: null,
				plan:
					filterLocation?.sta && filterLocation.sta !== NULL_TIME
						? dayjs(filterLocation.sta).format('HH:mm')
						: null
			}
		: null;

	// if (item.operatorCode === 'LO') {
	// 	item.operatorCode = findOvergroundLine(item.uid);
	// }

	return {
		rid: item.rid,
		uid: item.uid!,
		sdd: item.sdd!,
		destination:
			item.destination?.map((d) => ({
				crs: d.crs,
				name: d.locationName,
				via: d.via
			})) ?? [],
		origin:
			item.origin?.map((o) => ({
				crs: o.crs,
				name: o.locationName,
				via: o.via
			})) ?? [],
		times,
		rawTime: item.std!,
		departed: (item.atdSpecified && item.atd !== NULL_TIME) ?? false,
		delay,
		platform: item.category === 'BR' || item.category === 'BS' ? 'BUS' : (item.platform ?? null),
		operator: {
			id: item.operatorCode ?? null,
			name: operatorList[item.operatorCode!]?.name ?? item.operator ?? 'Unknown',
			color: operatorList[item.operatorCode!]?.bg ?? '#000000'
		},
		filterArrTimes: filterTimes,
		isCancelled: item.isCancelled ?? false,
		isFilterCancelled: item.filterLocationCancelled ?? false,
		position: item.isCancelled ? 'Cancelled' : null,
		delayReason: null,
		cancelReason: null
	};
}

export const GET: RequestHandler = async ({ params, request }) => {
	const { crs, to, time, tomorrow: tomorrowParam } = params;

	if (!crs) {
		return new Response('CRS is required', { status: 400 });
	}

	if (request.headers.get('api-version') !== API_COMPATIBLE_VERSION) {
		return kitError(500, 'Your app version is not compatible. Please refresh your app.');
	}

	const tomorrow = tomorrowParam == 'true';

	// console.log('tomorrow', tomorrow);

	const date =
		time && time != 'null'
			? dayjsFromHHmm(time, false, 'Europe/London').add(tomorrow ? 24 : 0, 'hour')
			: dayjs.tz(undefined, 'Europe/London');
	// console.log(date.toString());

	const offset = time && time != 'null' ? date.diff(dayjs(), 'minute') : 0;
	console.log('offset', offset);

	let shouldUseRailData = false;
	if (Math.abs(offset) > 119) {
		shouldUseRailData = true;
	}

	let url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}&expand=true`;
	if (shouldUseRailData) {
		const urlObj = new URL(
			`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepBoardWithDetails/${crs}/${date.format('YYYYMMDDTHHmmss')}?numRows=20`
		);
		if (to && to != 'null') urlObj.searchParams.append('filterCRS', to);
		url = urlObj.toString();
	} else {
		if (to != 'null') {
			url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/to/${to}?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}&expand=true`;
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
			.map((s) => parseBoardItem(s, to));

		const nrccMessages: Notice[] = (data.nrccMessages ?? [])
			.map((m) => ({
				...m,
				category: (typeof m.category === 'number'
					? m.category
					: Category[m.category as number]) as Category,

				severity: (typeof m.severity === 'number'
					? m.severity
					: ((Severity as unknown as Record<string, number>)[m.severity as string] ??
						0)) as Severity,

				xhtmlMessage:
					m.xhtmlMessage?.replace(
						/More information can be found in\s*<a href="([^"]+)">[^<]+<\/a>/,
						'<a href="$1">More info</a>'
					) ?? ''
			}))
			.toSorted((a, b) => {
				return b.severity - a.severity;
			});

		const board: Board = {
			services,
			details: {
				name: data.locationName ?? '',
				crs: crs,
				filterName: data.filterLocationName ?? null,
				filterCrs: to && to != 'null' ? to : null,
				offset: typeof offset === 'number' ? offset : 0,
				time: date.toString(),
				requestedTime: time == 'null' ? null : (time ?? null),
				notices: nrccMessages
			}
		};

		return json(board);
	} catch (error: unknown) {
		console.log(error);
		return kitError(500, (error as Error).message);
	}
};
