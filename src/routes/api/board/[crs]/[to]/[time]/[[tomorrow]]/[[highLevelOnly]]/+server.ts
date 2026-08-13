import { json, type RequestHandler, error as kitError } from '@sveltejs/kit';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { Severity, type Board, type BoardItem, type Notice } from '$lib/types';
import type { ServiceItemWithLocations, StationBoard } from '$lib/types/api';
import { dayjsFromHHmm } from '$lib/utils';

import { API_COMPATIBLE_VERSION, NULL_TIME } from '../../../../../../_shared';

import { ACCESS_TOKEN, REFERENCE_DATA_KEY } from '$env/static/private';
import { operatorList } from '$lib/data/operators';

dayjs.extend(utc);
dayjs.extend(tz);

function parseBoardItem(item: ServiceItemWithLocations, filter, reasonCodes): BoardItem {
	if (item.ata === NULL_TIME) item.ata = null;
	if (item.atd === NULL_TIME) item.atd = null;
	if (item.eta === NULL_TIME) item.eta = null;
	if (item.etd === NULL_TIME) item.etd = null;
	if (item.sta === NULL_TIME) item.sta = null;
	if (item.std === NULL_TIME) item.std = null;

	let delay = null;

	// const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta) : null;
	const rtd = item.atd || item.etd ? (item.atd ?? item.etd) : null;
	// const pta = item.sta ? dayjs(item.sta) : null;
	const ptd = item.std ? item.std : null;

	item.rid = `${item.rid}`;

	if (rtd && ptd) {
		delay = dayjs(rtd).diff(ptd, 'minutes', true);
	}

	const times = {
		rt: {
			arr: item.ata ?? item.eta ?? null,
			dep: item.atd ?? item.etd ?? null
		},
		plan: {
			arr: item.sta ?? null,
			dep: item.std ?? null
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
						? (filterLocation.ata ?? filterLocation.eta)
						: null,
				plan: filterLocation?.sta && filterLocation.sta !== NULL_TIME ? filterLocation.sta : null
			}
		: null;

	// if (item.operatorCode === 'LO') {
	// 	item.operatorCode = findOvergroundLine(item.uid);
	// }
	//
	if (
		(item.origin?.[0].crs === 'LST' && item.destination?.[0].crs === 'SSD') ||
		(item.origin?.[0].crs === 'SSD' && item.destination?.[0].crs === 'LST')
	) {
		item.operatorCode = 'SX';
	}

	const reason =
		item.delayReason || item.cancelReason
			? reasonCodes.find((r) =>
					item.isCancelled
						? r.code === item.cancelReason?.Value || r.code === item.cancelReason?.value
						: r.code === item.delayReason?.Value || r.code === item.delayReason?.value
				)
			: null;

	return {
		rid: item.rid,
		uid: item.uid!,
		sdd: item.sdd!,
		reason: reason?.lateReason?.replace('This service has been delayed by', ''),
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

		platform: item.category === 'BR' || item.category === 'BS' ? 'BUS' : (item.isCancelled ? null : item.platform ?? null),
		isPlatformConfirmed:
			item.platformIsHidden !== true ||
			item.serviceIsSuppressed === true ||
			(item.platform !== undefined && item.atdSpecified === true),
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

async function getReasonCodes() {
	const response = await fetch(
		`https://api1.raildata.org.uk/1010-reference-data1_0/LDBSVWS/api/ref/20211101/GetReasonCodeList`,
		{
			headers: {
				'x-apikey': REFERENCE_DATA_KEY
			}
		}
	);
	const data = await response.json();
	return data;
}

export const GET: RequestHandler = async ({ params, request }) => {
	const { crs, to, time, tomorrow: tomorrowParam } = params;

	if (!crs) {
		return new Response('CRS is required', { status: 400 });
	}

	if (request.headers.get('api-version') !== API_COMPATIBLE_VERSION) {
		return kitError(500, 'Your app version is out of date. Please refresh your app to update.');
	}

	const tomorrow = tomorrowParam == 'true';

	const reasonCodes = await getReasonCodes();

	// console.log('tomorrow', tomorrow);

	const date =
		time && time != 'null'
			? dayjsFromHHmm(time, false, 'Europe/London').add(tomorrow ? 24 : 0, 'hour')
			: dayjs.tz(undefined, 'Europe/London');
	// console.log(date.toString());

	const offset = time && time != 'null' ? date.diff(dayjs(), 'minute') : 0;
	console.log('offset', offset);

	// let shouldUseRailData = false;
	// if (Math.abs(offset) > 119) {
	// 	shouldUseRailData = true;
 //  }

  console.log(ACCESS_TOKEN);

	const urlObj = new URL(
		`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepBoardWithDetails/${crs}/${date.format('YYYYMMDDTHHmmss')}?numRows=20&timeWindow=120&services=PB`
	);
	if (to && to != 'null') urlObj.searchParams.append('filterCRS', to);
	const url = urlObj.toString();

	try {
		// console.log(url);
		const response = await fetch(url, {
			headers: {
        'x-apikey': ACCESS_TOKEN
			}
		});

    if (!response.ok) {
      const data = await response.json();
      throw new Error(JSON.stringify(data));
    }

		const data: StationBoard = await response.json();

		const services = (data.trainServices ?? [])
			.concat(data.busServices ?? [])
			.toSorted((a, b) => dayjs(a.std).diff(dayjs(b.std)))
			.map((s) => parseBoardItem(s, to, reasonCodes));

		const nrccMessages: Notice[] = (data.nrccMessages ?? [])
			.map((m) => ({
				...m,
				category: m.category,

				severity: (typeof m.severity === 'string'
					? (Severity[m.severity.toLowerCase() as unknown as number] ?? 0)
					: m.severity) as unknown as Severity,

				xhtmlMessage:
					(m.xhtmlMessage?.replace(
						/More information can be found in\s*<a href="([^"]+)">[^<]+<\/a>/,
						'<a href="$1">More info</a>'
					) ?? '') + m.category
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
