import { SUPABASE_ANON_KEY, SUPABASE_URL } from '$env/static/private';
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

const nullTime = '0001-01-01T00:00:00';

dayjs.extend(utc);
dayjs.extend(timezone);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export const POST: RequestHandler = async ({ request }) => {
	const { locations }: { locations: [ServiceLocation[]] } = await request.json();

	const tiplocs: string[] = [];

	locations.forEach((group) => {
		group.forEach((location) => {
			tiplocs.push(location.tiploc);
		});
	});

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

		let coords: null | [number, number] = null;
		let bearing: number | null = null;

		const lastDepartedIndex: number = groupWithCoords.findLastIndex(
			(location) => location.atd || location.ata
		);
		const lastDeparted = group[lastDepartedIndex];
		if (lastDepartedIndex !== -1 && lastDeparted) {
			const next = group[lastDepartedIndex + 1] ?? null;

			const lastDepartedCoords: [number, number] | undefined = tiplocsData.find(
				(tiploc) => tiploc.tiploc === lastDeparted.tiploc
			)?.coords;

			coords = lastDepartedCoords ?? null;

			if (next && lastDepartedCoords) {
				const nextCoords: [number, number] | undefined = tiplocsData.find(
					(tiploc) => tiploc.tiploc === next.tiploc
				)?.coords;

				const lastTime = dayjs(
					lastDeparted.atd ?? lastDeparted.etd ?? lastDeparted.std,
					'Europe/London'
				).utc(false);
				const now = dayjs();
				const nextTime = dayjs(
					next.ata ?? next.eta ?? next.sta ?? next.atd ?? next.etd ?? next.std,
					'Europe/London'
				).utc(false);
				const timeElapsed = now.diff(lastTime, 'minutes');
				const timeTotal = nextTime.diff(lastTime, 'minutes');
				const progress = Math.min(0.95, Math.max(0, timeElapsed / timeTotal));

				if (nextCoords) {
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
				}
			}
		}
		return {
			lineLocations: groupWithCoords,
			trainPosition: coords,
			trainBearing: bearing,
			destination: groupWithCoords[groupWithCoords.length - 1]
		};
	});
	return json({ locations: parsedLocations, tiplocData: tiplocsData });
};
