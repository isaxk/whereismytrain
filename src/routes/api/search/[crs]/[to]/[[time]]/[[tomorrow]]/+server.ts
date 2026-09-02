import { json } from '@sveltejs/kit';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { operatorList } from '$lib/data/operators';
import type { BoardNotice, RouteResultItem } from '$lib/types';

import type { RequestHandler } from './$types';

import { ACCESS_TOKEN, SERVICE_DETAILS_TOKEN } from '$env/static/private';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(tz);

async function parseResult(
	item: any,
	from: string,
	fromName: string,
	toParam: string | null,
	toName: string | null
): Promise<RouteResultItem> {
	let to = toParam;
	if (!to) {
		to = item.destination[0].crs;
		toName = item.destination[0].locationName;
	}

	let filter = item.subsequentLocations.find((loc: any) => loc.crs === to);
	let destination = [item.destination[0]];

	if (!filter) {
		const associations = item.subsequentLocations
			.map((loc: any) => loc.associations?.filter((a) => a.category === 'divide') ?? [])
			.filter((a) => a.length > 0)
			.flat();
		if (associations.length === 0) {
			throw new Error(`No associations found for ${to}`);
		}
		const assocLocations = await Promise.all(
			associations.map(async (a) => {
				const response = await fetch(
					`https://api1.raildata.org.uk/1010-query-services-and-service-details1_0/LDBSVWS/api/20220120/GetServiceDetailsByRID/${a.rid}`,
					{
						headers: {
							'x-apikey': SERVICE_DETAILS_TOKEN
						}
					}
				);
				const data = await response.json();
				return data.locations;
			})
		);

		filter = assocLocations.flat().find((loc: any) => loc.crs === to);
		const splitWithFilter = assocLocations.findIndex((list) =>
			list.some((loc: any) => loc.crs === to)
		);
		destination = item.destination[splitWithFilter + 1];

		if (!filter) {
			throw new Error(`No filter found for ${to}`);
		}
	} else {
		const splitPoint = item.subsequentLocations.findIndex((loc: any) =>
			loc.associations?.some((a) => a.category === 'divide')
		);
		const filterIndex = item.subsequentLocations.findIndex((loc: any) => loc.crs === to);
		if (splitPoint > filterIndex) {
			destination = item.destination;
		}
	}

	const isBus = item.category.includes('B');

	const delay = item.atd || item.etd ? dayjs(item.atd ?? item.etd).diff(item.std, 'minutes') : null;
	const filterDelay = to
		? filter.ata || filter.eta
			? dayjs(filter.ata ?? filter.eta).diff(filter.sta, 'minutes')
			: null
		: null;

	return {
		id: item.rid,
		from: {
			crs: from,
			name: fromName,
			isCancelled: item.isCancelled,
			rtTime: item.atd ?? item.etd ?? null,
			planTime: item.std,
			delay: delay
		},
		to:
			to && toName
				? {
						crs: to,
						name: toName,
						isCancelled: item.filterLocationCancelled,
						rtTime: filter.ata ?? filter.eta ?? null,
						planTime: filter.sta,
						delay: filterDelay
					}
				: null,
		destination: toParam
			? destination.map((d) => d.locationName)
			: item.destination.map((d) => d.locationName),
		operator: {
			id: item.operatorCode,
			name: operatorList[item.operatorCode]?.name ?? item.operator,
			color: operatorList[item.operatorCode]?.bg ?? '#000'
		},
		platform: isBus ? 'BUS' : item.platform !== '' ? (item.platform ?? null) : null,
		duration: to
			? dayjs(filter.ata ?? filter.eta ?? filter.sta).diff(
					dayjs(item.atd ?? item.etd ?? item.std),
					'minutes'
				)
			: null,
    isPlatformConfirmed: !item.platformIsHidden || item.atdSpecified,
		arrivesFirst: false,
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { crs, tomorrow } = params;
	let { to, time }: { to: string | null; time: string | null } = params as {
		to: string | null;
		time: string | null;
	};

	if (to === 'null') to = null;
	if (time === 'null') time = null;

	if (
		time ===
		dayjs()
			.tz('Europe/London')
			.format(!time?.includes(':') ? 'HHmm' : 'HH:mm')
	)
		time = null;

	let date = dayjs().tz('Europe/London');
	if (time) date = dayjs.tz(time, !time?.includes(':') ? 'HHmm' : 'HH:mm', 'Europe/London');
	if (tomorrow === 'true') date = date.add(1, 'day');

	const url = new URL(
		`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepBoardWithDetails/${crs}/${date.format('YYYYMMDDTHHmmss')}?numRows=20&timeWindow=240&services=PB`
	);
	if (to) url.searchParams.append('filterCRS', to);

	const response = await fetch(url.toString(), {
		headers: {
			'x-apikey': ACCESS_TOKEN
		}
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(`Failed to fetch trains: ${JSON.stringify(data)}`);
	}

	const data = await response.json();
	const services = (data.trainServices ?? [])
		.concat(data.busServices ?? [])
		.toSorted((a, b) => (dayjs(a.std).isBefore(b.std) ? -1 : 1));

	const results = await Promise.all(
		services.map((item: any) =>
			parseResult(item, crs, data.locationName, to, data.filterLocationName)
		)
  );

  if (to && results.length > 0) {
    const sortedByArrival = results.toSorted((a, b) => (dayjs(a.to.planTime).isBefore(b.to.planTime) ? -1 : 1));
    const sortedByRtArrival = results.toSorted((a, b) => (dayjs(a.to.rtTime).isBefore(b.to.rtTime) ? -1 : 1))
    const planId = sortedByArrival[0].id;
    const rtId = sortedByRtArrival[0].id;
    if (results.findIndex((item) => item.id === rtId) > 0) {
      results.find((item) => item.id === rtId).rtArrivesFirst = true;
    }
    if (results.findIndex((item) => item.id === planId) > 0) {
      results.find((item) => item.id === planId).planArrivesFirst = true;
    }
    console.log(results);
	}

	const notices: BoardNotice[] = data.nrccMessages
		?.map((n: any) => ({
			severity: n.severity === 'Normal' ? 'info' : n.severity.toLowerCase(),
			category: n.category,
			body: n.xhtmlMessage
		}))
		.toSorted((a, b) => {
			const severityOrder = ['info', 'minor', 'major', 'severe'];
			return severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity);
		});

	return json({
		results,
		notices,
		details: {
			name: data.locationName ?? '',
			crs,
			filterName: data.filterLocationName ?? null,
			filterCrs: to,
			time: time && date.format('HH:mm')
		}
	});
};
