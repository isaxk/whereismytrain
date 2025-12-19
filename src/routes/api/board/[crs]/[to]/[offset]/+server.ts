import { ACCESS_TOKEN } from '$env/static/private';
import { operatorList } from '$lib/data/operators';
import { Severity, type Board, type BoardItem, type Notice } from '$lib/types';
import { json, type RequestHandler, error as kitError } from '@sveltejs/kit';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { findOvergroundLine } from '$lib/data/overground';

dayjs.extend(utc);
dayjs.extend(tz);

const nullTime = '0001-01-01T00:00:00';

function parseBoardItem(item: any): BoardItem {
	if (item.ata === nullTime) item.ata = null;
	if (item.atd === nullTime) item.atd = null;
	if (item.eta === nullTime) item.eta = null;
	if (item.etd === nullTime) item.etd = null;
	if (item.sta === nullTime) item.sta = null;
	if (item.std === nullTime) item.std = null;

	let delay = null;

	const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta) : null;
	const rtd = item.atd || item.etd ? dayjs(item.atd ?? item.etd) : null;
	const pta = item.sta ? dayjs(item.sta) : null;
	const ptd = item.std ? dayjs(item.std) : null;

	item.rid = `${item.rid}d${item.destination.map((d) => d.crs).join('d')}`;

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
			dep: item.std ? dayjs(item.std).format('HH:mm') : null
		}
	};

	if (item.operatorCode === 'LO') {
		item.operatorCode = findOvergroundLine(item.uid);
	}

	return {
		rid: item.rid,
		uid: item.uid,
		sdd: item.sdd,
		destination: item.destination.map((d: any) => ({
			crs: d.crs,
			name: d.locationName,
			via: d.via
		})),
		origin: item.origin.map((o: any) => ({
			crs: o.crs,
			name: o.locationName,
			via: o.via
		})),
		times,
		departed: item.atd && item.atd !== nullTime,
		delay,
		platform: item.platform ?? null,
		operator: {
			id: item.operatorCode ?? null,
			name: operatorList[item.operatorCode]?.name ?? item.operator ?? 'Unknown',
			color: operatorList[item.operatorCode]?.bg ?? '#000000'
		},
		isCancelled: item.isCancelled ?? false,
		isFilterCancelled: item.filterLocationCancelled ?? false,
		position: item.isCancelled ? 'Cancelled' : null,
		delayReason: null,
		cancelReason: null
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { crs, to, offset } = params;

	let shouldUseRailData = false;
	if (parseInt(offset || '0') > 119) {
		shouldUseRailData = true;
	}

	let url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/20?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
	if (shouldUseRailData) {
		const time = dayjs()
			.tz('Europe/London')
			.add(parseInt(offset || '0'), 'minute')
			.format('YYYYMMDDTHHmmss');
		const urlObj = new URL(
			`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepartureBoardByCRS/${crs}/${time}`
		);
		if (to && to != 'null') urlObj.searchParams.append('filterCRS', to);
		url = urlObj.toString();
	} else {
		if (to != 'null') {
			url = `https://huxley2.azurewebsites.net/staffdepartures/${crs}/to/${to}/20?timeOffset=${offset}&timeWindow=120&access_token=${ACCESS_TOKEN}`;
		}
	}

	try {
		console.log(url);
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
		console.log(data);

		const services = (data.trainServices ?? [])
			.concat(data.busServices ?? [])
			.map((s: any) => parseBoardItem(s));

		const nrccMessages: Notice[] = (data.nrccMessages ?? [])
			.toSorted((a: any, b: any) => b.severity - a.severity)
			.map((m: any) => ({
				...m,
				severity: typeof m.severity === 'number' ? m.severity : Severity[m.severity.toLowerCase()],
				xhtmlMessage: m.xhtmlMessage
					.replace('Latest information can be found in', '')
					.replace('Status and Disruptions.', 'More info')
			}));

		const board: Board = {
			services,
			details: {
				name: data.locationName,
				filterName: data.filterLocationName ?? null,
				notices: nrccMessages
			}
		};

		return json(board);
	} catch (error: any) {
		console.log(error);
		throw kitError(500, error.message);
	}
};
