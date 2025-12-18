import { ACCESS_TOKEN, SUPABASE_ANON_KEY, SUPABASE_URL } from '$env/static/private';
import type {
	MapDataLocationGroup,
	ServiceLocation,
	ServiceLocationWithCoords
} from '$lib/types/index.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';
import { calculateBearing } from '$lib/utils';
import { parse } from 'zod/v4-mini';

const nullTime = '0001-01-01T00:00:00';

dayjs.extend(utc);
dayjs.extend(timezone);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type TiplocDataItem = {
	tiploc: string;
	coords: [number, number];
};

async function fetchAssocService(rid: string) {
	const response = await fetch(
		`https://huxley2.azurewebsites.net/service/${rid}?access_token=${ACCESS_TOKEN}`
	);
	const data = await response.json();
	if (data?.locations) {
		return data;
	} else {
		throw new Error('Failed to fetch associated service');
	}
}

async function getTiplocs(tiplocs: string[]): Promise<
	{
		tiploc: string;
		coords: [number, number];
	}[]
> {
	const response = await supabase.from('tiplocs').select('*').in('tiploc', tiplocs);
	return (
		response.data?.map((tiploc) => {
			return {
				tiploc: tiploc.tiploc,
				coords: [tiploc.long, tiploc.lat]
			};
		}) ?? []
	);
}

function calculateTrainPosition(
	lastDepartedCoords: [number, number] | null,
	nextCoords: [number, number] | null,
	lastDepartedTime: string,
	nextDepartTime: string | null,
	departed: boolean
) {
	let coords: null | [number, number] = null;
	let bearing: number | null = null;

	coords = lastDepartedCoords ?? null;

	console.log('nextDepartTime:', nextDepartTime);
	console.log('lastDepartedTime:', lastDepartedTime);
	console.log('lastDepartedCoords:', lastDepartedCoords);
	console.log('nextCoords:', nextCoords);

	if (nextDepartTime && nextCoords && lastDepartedCoords && lastDepartedTime) {
		const lastTime = dayjs(lastDepartedTime, 'Europe/London').utc(false);
		const now = dayjs();
		const nextTime = dayjs(nextDepartTime, 'Europe/London').utc(false);
		const timeElapsed = now.diff(lastTime, 'seconds');
		const timeTotal = nextTime.diff(lastTime, 'seconds');
		let progress = Math.min(0.95, Math.max(0.05, timeElapsed / timeTotal));

		if (!departed || timeElapsed === 0) {
			progress = 0;
		}

		coords = [
			lastDepartedCoords[0] + (nextCoords[0] - lastDepartedCoords[0]) * progress,
			lastDepartedCoords[1] + (nextCoords[1] - lastDepartedCoords[1]) * progress
		];
		bearing = calculateBearing(
			lastDepartedCoords[1],
			lastDepartedCoords[0],
			nextCoords[1],
			nextCoords[0]
		);
	} else if (lastDepartedCoords) {
		coords = lastDepartedCoords;
	}

	console.log(coords);

	return { coords, bearing };
}

function parseLocation(l: any): ServiceLocation {
	return {
		crs: l.crs ?? null,
		isCancelled: l.isCancelled ?? false,
		tiploc: l.tiploc!,
		isCallingPoint: l.crs && !l.isPass,
		eta: (l.eta ?? null) === nullTime ? null : l.eta,
		etd: (l.etd ?? null) === nullTime ? null : l.etd,
		ata: (l.ata ?? null) === nullTime ? null : l.ata,
		atd: (l.atd ?? null) === nullTime ? null : l.atd,
		sta: (l.sta ?? null) === nullTime ? null : l.sta,
		std: (l.std ?? null) === nullTime ? null : l.std
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const {
		locations,
		formedFrom = null
	}: { locations: [ServiceLocation[]]; formedFrom?: string | null } = await request.json();

	const tiplocs: string[] = [];

	locations.forEach((group) => {
		group.forEach((location) => {
			tiplocs.push(location.tiploc);
		});
	});

	// console.log('formedFrom', formedFrom);

	const tiplocsData = await getTiplocs(tiplocs);
	const parsedLocations: MapDataLocationGroup[] = locations.map((group) => {
		const groupWithCoords: ServiceLocationWithCoords[] = group.map((item) => {
			if (item.ata === nullTime) item.ata = null;
			if (item.atd === nullTime) item.atd = null;
			if (item.eta === nullTime) item.eta = null;
			if (item.etd === nullTime) item.etd = null;
			if (item.sta === nullTime) item.sta = null;
			if (item.std === nullTime) item.std = null;
			return {
				...item,
				coords: tiplocsData.find((tiploc) => tiploc.tiploc === item.tiploc)?.coords ?? [0, 0]
			};
		});

		// let coords: null | [number, number] = null;
		// let bearing: number | null = null;

		const lastDepartedIndex: number = groupWithCoords.findLastIndex(
			(location) => location.atd || location.ata
		);
		const lastDeparted = groupWithCoords[lastDepartedIndex];
		const next = groupWithCoords[lastDepartedIndex + 1];
		const { coords, bearing }: { coords: [number, number] | null; bearing: number | null } =
			lastDeparted
				? calculateTrainPosition(
						lastDeparted.coords,
						next?.coords ?? null,
						lastDeparted.atd ??
							lastDeparted.etd ??
							lastDeparted.ata ??
							lastDeparted.eta ??
							lastDeparted.std ??
							lastDeparted.sta ??
							'',
						next?.atd ?? next?.etd ?? next?.ata ?? next?.eta ?? next?.std ?? next?.sta ?? null,
						lastDeparted.atd !== null
					)
				: { coords: null, bearing: null };

		return {
			lineLocations: groupWithCoords,
			trainPosition: coords,
			trainBearing: bearing,
			isFormedFromTrain: false,
			destination: groupWithCoords[groupWithCoords.length - 1]
		};
	});

	console.log(
		'Test data',
		calculateTrainPosition(
			[-0.2900566, 51.5149231],
			[-0.2675251, 51.5170784],
			'2025-12-18T18:06:37',
			'2025-12-18T18:07:07',
			false
		)
	);

	if (formedFrom && parsedLocations[0] && !parsedLocations.some((l) => l.trainPosition !== null)) {
		const data = await fetchAssocService(formedFrom);

		if (data && data.locations) {
			const parsed: ServiceLocation[] = data.locations.map(parseLocation);
			const tiplocs = parsed.map((item) => item.tiploc);
			const tiplocsData = await getTiplocs(tiplocs);

			const groupWithCoords: ServiceLocationWithCoords[] = parsed.map((item) => {
				return {
					...item,
					coords: tiplocsData.find((tiploc) => tiploc.tiploc === item.tiploc)?.coords ?? [0, 0]
				};
			});

			const lastDepartedIndex = groupWithCoords.findLastIndex(
				(l: ServiceLocationWithCoords) => l.atd || l.ata
			);
			const lastDeparted: ServiceLocationWithCoords | undefined =
				groupWithCoords[lastDepartedIndex];
			console.log('lastDeparted', lastDeparted);
			const next = groupWithCoords[lastDepartedIndex + 1];
			console.log('nexr', next);
			const { coords, bearing }: { coords: [number, number] | null; bearing: number | null } =
				lastDeparted
					? calculateTrainPosition(
							lastDeparted.coords,
							next?.coords ?? null,
							lastDeparted.atd ??
								lastDeparted.etd ??
								lastDeparted.ata ??
								lastDeparted.eta ??
								lastDeparted.std ??
								lastDeparted.sta ??
								'',
							next?.ata ?? next?.eta ?? next?.atd ?? next?.etd ?? next?.sta ?? next?.std ?? null,
							lastDeparted.atd !== null
						)
					: { coords: null, bearing: null };

			if (coords) {
				console.log(coords);
				parsedLocations[0].trainPosition = coords;
				parsedLocations[0].trainBearing = bearing;
				if (parsedLocations[0].lineLocations[0].crs !== lastDeparted.crs) {
					parsedLocations[0].isFormedFromTrain = true;
				}
			}
		}
	}

	return json({ locations: parsedLocations, tiplocData: tiplocsData });
};
