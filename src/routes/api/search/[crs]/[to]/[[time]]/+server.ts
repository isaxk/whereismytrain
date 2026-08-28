import dayjs from 'dayjs';
import type { RequestHandler } from './$types';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ACCESS_TOKEN, SERVICE_DETAILS_TOKEN } from '$env/static/private';
import type { BoardNotice, RouteResultItem } from '$lib/types';
import { operatorList } from '$lib/data/operators';
import { json } from '@sveltejs/kit';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(tz);

async function parseResult(
	item: any,
	from: string,
	fromName: string,
	to: string,
	toName: string
): Promise<RouteResultItem> {
	let filter = item.subsequentLocations.find((loc: any) => loc.crs === to);
	let destination = item.destination[0];

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
		const splitWithFilter = assocLocations.findIndex((list) => list.some((loc: any) => loc.crs === to));
		destination = item.destination[splitWithFilter + 1];

		if (!filter) {
			throw new Error(`No filter found for ${to}`);
		}
	}

	const isBus = item.category.includes('B');

	const delay = item.atd || item.etd ? dayjs(item.atd ?? item.etd).diff(item.std, 'minutes') : null;
	const filterDelay =
		filter.ata || filter.eta ? dayjs(filter.ata ?? filter.eta).diff(filter.sta, 'minutes') : null;

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
		to: {
			crs: to,
			name: toName,
			isCancelled: item.filterLocationCancelled,
			rtTime: filter.ata ?? filter.eta ?? null,
			planTime: filter.sta,
			delay: filterDelay
		},
		destination: destination.locationName,
		operator: {
			id: item.operatorCode,
			name: operatorList[item.operatorCode]?.name ?? item.operator,
			color: operatorList[item.operatorCode]?.bg ?? '#000'
		},
		platform: isBus ? 'BUS' : item.platform !== '' ? (item.platform ?? null) : null,
		duration: dayjs(filter.ata ?? filter.eta ?? filter.sta).diff(
			dayjs(item.atd ?? item.etd ?? item.std),
			'minutes'
		),
		isPlatformConfirmed: !item.platformIsHidden || item.atdSpecified
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { crs, to, time } = params;

	const date =
		time && time != 'null' ? dayjs(time, 'HH:mm').tz('Europe/London') : dayjs().tz('Europe/London');

	const url = new URL(
		`https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepBoardWithDetails/${crs}/${date.format('YYYYMMDDTHHmmss')}?numRows=20&timeWindow=120&services=PB`
	);
	if (to) url.searchParams.append('filterCRS', to);

	const response = await fetch(url.toString(), {
		headers: {
			'x-apikey': ACCESS_TOKEN
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch trains`);
	}

	const data = await response.json();
	const services = (data.trainServices ?? [])
		.concat(data.busServices ?? [])
		.toSorted((a, b) => a.std - b.std);

	const results = await Promise.all(
		services.map((item: any) =>
			parseResult(item, crs, data.locationName, to, data.filterLocationName)
		)
	);

	const notices: BoardNotice[] = data.nrccMessages?.map((n: any) => ({
		severity: n.severity === 'Normal' ? 'info' : n.severity.toLowerCase(),
		category: n.category,
		body: n.xhtmlMessage,
  })).toSorted((a, b) => {
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
			time
		}
	});
};
