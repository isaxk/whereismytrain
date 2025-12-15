import { ACCESS_TOKEN, SUPABASE_ANON_KEY, SUPABASE_URL } from '$env/static/private';
import { operatorList } from '$lib/data/operators';
import { createClient } from '@supabase/supabase-js';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { parse } from 'zod/mini';
import { da } from 'zod/v4/locales';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tubeLines = {
	circle: { color: '#FFD300' },
	central: { color: '#E32017' },
	district: { color: '#00782A' },
	bakerloo: { color: '#B36305	' },
	'hammersmith-city': { color: '#F3A9BB' },
	jubilee: { color: '#A0A5A9' },
	metropolitan: { color: '#9B0056' },
	northern: { color: '#000000	' },
	piccadilly: { color: '#003688' },
	victoria: { color: '#0098D4' },
	'waterloo-city': { color: '#95CDBA' }
};

type ParsedTflLeg = {
	mode: string;
	duration: number;
	fromTiploc: string | null;
	fromName: string;
	toTiploc: string | null;
	toName: string;
	departureTime: string;
	arrivalTime: string;
};

type ParsedTflJourney = {
	legs: ParsedTflLeg[];
	duration: number;
	departureTime: string;
	arrivalTime: string;
};

async function fetchTflJourneyPlan(from: string, to: string, tube: boolean = false) {
	const url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?nationalSearch=true&mode=elizabeth-line,national-rail,overground,walking${tube ? ',tube' : ''}&journeyPreference=leastTime&includeAlternativeRoutes=true`;
	console.log(url);
	const response = await fetch(url);
	const data = await response.json();
	if (!data) {
		console.log(await response.text());
		return error(404, 'Journey plan not found');
	}
	return data;
}

async function getServiceFromNR(from: string, to: string, date: string) {
	// console.log(from, to);
	const tDate = dayjs(date).format('YYYYMMDDTHHmmss');
	const url = `https://api1.raildata.org.uk/1010-live-departure-board---staff-version1_0/LDBSVWS/api/20220120/GetDepBoardWithDetails/${from}/${tDate}?filterCrs=${to}`;
	// console.log(url);
	const response = await fetch(url, {
		headers: {
			'x-apikey': ACCESS_TOKEN
		}
	});
	const data = await response.json();
	// console.log(data);
	if (!data?.trainServices || data?.trainServices.length === 0) {
		error(404, `No train services found for ${from} to ${to} ${tDate}`);
	}
	const service = data.trainServices[0];
	return service;
}

function parseCallingPoint(cp: any) {
	return {
		estimated: cp.ata ?? cp.eta ?? cp.atd ?? cp.etd ?? null,
		scheduled: cp.sta ?? cp.std ?? null,
		name: cp.locationName,
		crs: cp.crs
	};
}

async function createJourney(tiplocs: any[], journey: ParsedTflJourney) {
	const parsedLegs = [];
	console.log(journey);

	// console.log('\n\n');
	for (const leg of journey.legs) {
		if (leg.mode === 'national-rail') {
			const fromCrs = tiplocs.find(
				(tiploc) =>
					tiploc.tiploc === leg.fromTiploc ||
					tiploc.name === leg.fromName ||
					(tiploc.name === 'Glasgow Central High Level' && leg.fromName === 'Glasgow Central') ||
					(tiploc.name === 'Glasgow Queen St High Level' && leg.fromName === 'Glasgow Queen Street')
			);
			const toCrs = tiplocs.find(
				(tiploc) =>
					tiploc.tiploc === leg.toTiploc ||
					tiploc.name === leg.toName ||
					(tiploc.name === 'Glasgow Central High Level' && leg.toName === 'Glasgow Central') ||
					(tiploc.name === 'Glasgow Queen St High Level' && leg.toName === 'Glasgow Queen Street')
			);
			if (!fromCrs || !toCrs) {
				console.error('Failed to find CRS codes for', leg.mode, leg.fromName, leg.toName);
				console.log(leg);
				return error(500, 'Invalid CRS codes');
			}

			const service = await getServiceFromNR(fromCrs.crs, toCrs.crs, leg.departureTime);
			const allCallingPoints = service.subsequentLocations.filter((cp) => !cp.isPass && cp.crs);
			const filterIndex = allCallingPoints.findIndex((cp) => cp.crs === toCrs.crs);
			const callingPoints = filterIndex !== -1 ? allCallingPoints.slice(0, filterIndex) : null;
			console.log(service);
			parsedLegs.push({
				mode: 'nr',
				operator: operatorList[service.operatorCode].name ?? service.operator,
				operatorColor: operatorList[service.operatorCode].bg ?? '#000',
				rid: service.rid,
				destination: service.destination[0].locationName,
				duration: leg.duration,
				estimatedDeparture: service.atd ?? service.etd,
				scheduledDeparture: service.std,
				estimatedArrival: service.ata ?? service.eta,
				scheduledArrival: service.sta,
				callingPoints: callingPoints?.map(parseCallingPoint),
				from: { ...fromCrs, name: leg.fromName },
				to: { ...toCrs, name: leg.toName }
			});
		} else if (leg.mode === 'elizabeth-line') {
			// console.log(leg);
			// console.log(tiplocs);
			const fromCrs = tiplocs.find(
				(tiploc) =>
					tiploc.tiploc === leg.fromTiploc ||
					tiploc.name.includes(leg.fromName.replace(' Station', ''))
			);
			const toCrs = tiplocs.find(
				(tiploc) =>
					tiploc.tiploc === leg.toTiploc || tiploc.name.includes(leg.toName.replace(' Station', ''))
			);
			if (!fromCrs || !toCrs) {
				console.log(tiplocs);
				console.error('Failed to find CRS codes for', leg.mode, leg.fromName, leg.toName);
				return error(500, 'Invalid CRS codes');
			}
			parsedLegs.push({
				mode: 'elizabeth-line',
				operator: operatorList['XR'].name ?? 'Elizabeth Line',
				operatorColor: operatorList['XR'].bg,
				rid: null,
				destination: null,
				duration: leg.duration,
				from: fromCrs,
				to: toCrs
			});
		} else if (leg.mode === 'tube') {
			const line = leg.routeOptions[0].lineIdentifier;
			console.log('line', line);
			parsedLegs.push({
				mode: 'tube',
				operator: line.name + ' Line',
				operatorColor: tubeLines[line.id].color ?? '#000',
				rid: null,
				destination: null,
				duration: leg.duration,
				from: {
					name: leg.fromName
				},
				to: { name: leg.toName }
			});
		} else if (leg.mode === 'walking') {
			parsedLegs.push({
				mode: 'walking',
				operator: 'Walking',
				operatorColor: '#000',
				rid: null,
				destination: null,
				duration: leg.duration,
				from: {
					name: leg.fromName
				},
				to: { name: leg.toName }
			});
		} else {
			console.log(leg.mode);
		}
	}
	return {
		legs: parsedLegs,
		duration: journey.duration,
		departureTime: journey.departureTime,
		arrivalTime: journey.arrivalTime
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { from, to, tube } = params;
	if (!from || !to) {
		return error(400, 'Missing from or to parameters');
	}

	const tiplocNames: string[] = [];
	const tiplocTiplocs: string[] = [];

	async function parseTflJourney(journey: any): Promise<ParsedTflJourney> {
		const legs = journey.legs;
		const parsed: ParsedTflLeg[] = [];
		for (const leg of legs) {
			tiplocNames.push(
				leg.departurePoint.commonName
					.replace(' Rail Station', '')
					.replace(' Underground Station', '')
					.replaceAll("'", ''),
				leg.arrivalPoint.commonName
					.replace(' Rail Station', '')
					.replace(' Underground Station', '')
					.replaceAll("'", '')
			);
			tiplocTiplocs.push(
				leg.departurePoint.naptanId?.replace('910G', '') ?? null,
				leg.arrivalPoint.naptanId?.replace('910G', '') ?? null
			);
			parsed.push({
				mode: leg.mode.id,
				departureTime: leg.departureTime,
				arrivalTime: leg.arrivalTime,
				duration: leg.duration,
				fromTiploc: leg.departurePoint.naptanId?.replace('910G', '') ?? null,
				fromName: leg.departurePoint.commonName
					.replace(' Rail Station', '')
					.replace(' Underground Station', '')
					.replaceAll("'", ''),
				toTiploc: leg.arrivalPoint.naptanId?.replace('910G', '') ?? null,
				toName: leg.arrivalPoint.commonName
					.replace(' Rail Station', '')
					.replace(' Underground Station', '')
					.replaceAll("'", ''),
				routeOptions: leg.routeOptions
			});
		}

		return {
			legs: parsed,
			duration: journey.duration,
			departureTime: journey.startDateTime,
			arrivalTime: journey.arrivalDateTime
		};
	}

	const crsResponse = await supabase.from('tiplocs').select('*').in('crs', [from, to]);

	const fromCrs = crsResponse.data?.find((l) => l.crs === from);
	const toCrs = crsResponse.data?.find((l) => l.crs === to);

	if (!fromCrs || !toCrs) {
		return error(404, 'CRS codes not found');
	}

	// console.log(fromCrs, toCrs);

	let fromNapTan = from === 'WAT' ? '1000254' : fromCrs.name + ' Rail Station';
	let toNapTan = to === 'WAT' ? '1000254' : toCrs.name + ' Rail Station';

	if (fromCrs.name.includes('(Crossrail')) {
		fromNapTan = '910G' + fromCrs.tiploc;
	}
	if (toCrs.name.includes('(Crossrail')) {
		toNapTan = '910G' + toCrs.tiploc;
	}

	const journeyPlan = await fetchTflJourneyPlan(fromNapTan, toNapTan, tube === 'true');
	if (!journeyPlan) {
		return error(404, 'Journey plan not found');
	}

	const journeys = await Promise.all(journeyPlan.journeys.map(parseTflJourney));

	console.log(tiplocNames);
	console.log(tiplocTiplocs);

	const tiplocResponse = await supabase
		.from('tiplocs')
		.select('*')
		.in(
			'name',
			tiplocNames.map((n) =>
				n
					.replace('Glasgow Central', 'Glasgow Central High Level')
					.replace('Glasgow Queen Street', 'Glasgow Queen St Low Level')
			)
		)
		.neq('crs', null);

	const tiplocIdResponse = await supabase
		.from('tiplocs')
		.select('*')
		.in(
			'tiploc',
			tiplocTiplocs.filter((tiploc) => tiploc !== null)
		)
		.neq('crs', null);

	// console.log('tpData', tiplocIdResponse.data);

	if (!tiplocResponse.data && !tiplocIdResponse.data) {
		return error(500, 'Tiploc data not found');
	}

	const tiplocData = tiplocResponse.data?.concat(tiplocIdResponse.data);
	console.log(tiplocData?.map((tiploc) => `${tiploc.crs} ${tiploc.name} ${tiploc.tiploc}`));

	// console.log('erm');

	const parsedJourneys = await Promise.all(
		journeys.map((journey) => createJourney(tiplocData, journey))
	);

	console.log('yeah');

	return json(parsedJourneys);
};
