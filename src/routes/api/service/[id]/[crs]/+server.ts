import { ACCESS_TOKEN } from '$env/static/private';
import { operatorList } from '$lib/data/operators';
import type { CallingPoint, CallingPointOrder, ServiceLocation, TimeObject } from '$lib/types';
import { error, json } from '@sveltejs/kit';
import dayjs from 'dayjs';

const nullTime = '0001-01-01T00:00:00';

function parseLocation(l: any): ServiceLocation {
	return {
		crs: l.crs ?? null,
		isCancelled: l.isCancelled ?? false,
		tiploc: l.tiploc!,
		eta: l.eta ?? null,
		etd: l.etd ?? null,
		ata: l.ata ?? null,
		atd: l.atd ?? null,
		sta: l.sta ?? null,
		std: l.std ?? null
	};
}

function parseCallingPoint(item: any, index: number, length: number, focusIndex: number): CallingPoint {
	if (item.ata === nullTime) item.ata = null;
	if (item.atd === nullTime) item.atd = null;
	if (item.eta === nullTime) item.eta = null;
	if (item.etd === nullTime) item.etd = null;
	if (item.sta === nullTime) item.sta = null;
	if (item.std === nullTime) item.std = null;

	let delay = null;

	// const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta) : null;
	const rtd = item.atd || item.etd ? dayjs(item.atd ?? item.etd) : null;
	// const pta = item.sta ? dayjs(item.sta) : null;
	const ptd = item.std ? dayjs(item.std) : null;

	if (rtd && ptd) {
		delay = rtd.diff(ptd, 'minutes');
	}

	const times: TimeObject = {
		rt: {
			arr: item.ata || item.eta ? dayjs(item.ata ?? item.eta).format('HH:mm') : null,
			arrSource: item.arrivalSource === 'Trust' || item.arrivalSource === 'TD' ? 'trust' : 'none',
			dep: item.atd || item.etd ? dayjs(item.atd ?? item.etd).format('HH:mm') : null,
			depSource: item.departureSource === 'Trust' || item.departureSource === 'TD' ? 'trust' : 'none',
		},
		plan: {
			arr: item.sta ? dayjs(item.sta).format('HH:mm') : null,
			dep: item.std ? dayjs(item.std).format('HH:mm') : null
		}
	};

	let order: CallingPointOrder | null = null;

	if (index === 0) {
		order = 'origin';
	} else if (index < focusIndex) {
		order = 'previous'
	}
	else if (index === focusIndex) {
		order = 'focus';
	} else if (index === length - 1) {
		order = 'destination';
	} else {
		order = 'subsequent';
	}

	if (!order) {
		throw new Error('Failed to parse calling point order');
	}

	return {
		crs: item.crs,
		tiploc: item.tiploc,
		name: item.locationName,
		times,
		delay,
		isCancelled: item.isCancelled,
		inDivision: item.inDivision ?? false,
		startDivide: item.startDivide ?? false,
		endDivide: item.endDivide ?? false,
		platform: item.platform ?? null,
		order

	};
}

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

export const GET = async ({ params }) => {
	const { id, crs } = params;
	const response = await fetch(
		`https://huxley2.azurewebsites.net/service/${id}?access_token=${ACCESS_TOKEN}`
	);
	const data = await response.json();
	const locations: [ServiceLocation[]] = [data.locations.map(parseLocation)];
	const rawCallingPoints = data.locations.filter((l: any) => !l.isPass && l.crs);

	let callingPoints = [];
	let destination = [rawCallingPoints[rawCallingPoints.length - 1]];

	// Division logic

	// If the current service *is* the division
	// category 1 == 'divide'
	if (rawCallingPoints[0].associations?.some((l: any) => l.category === 1)) {

		const assocService = await fetchAssocService(
			rawCallingPoints[0].associations.find((l: any) => l.category === 1).rid
		);

		if (assocService) {

			// add the location as a line to the map object
			const assocParsedLocations = assocService.locations.map(parseLocation);
			locations.push(assocParsedLocations);

			const assocRawCallingPoints = assocService.locations.filter((l: any) => !l.isPass && l.crs);
			destination.push(assocRawCallingPoints[assocRawCallingPoints.length - 1]);
			assocRawCallingPoints.forEach((cp: any) => {
				// Insert the division calling point to the list
				if (cp.associations?.some((l: any) => l.category === 1)) {
					rawCallingPoints.forEach((cp: any, i: number) => {
						callingPoints.push({
							...cp,
							inDivision: true,
							startDivide: i === 0, // and specify where the division starts and ends
							endDivide: i === rawCallingPoints.length - 1
						});
					});
				}

				callingPoints.push(cp);
			});
		}
	}
	// otherwise assume the current service is the primary service, or there is no division
	else {
		for (const cp of rawCallingPoints) {
			// if there is a division at this calling point
			if (cp.associations?.some((l: any) => l.category === 1)) {

				// add the location before the division, with arr. info only
				callingPoints.push({ ...cp, std: null, etd: null, atd: null });

				// get and fetch assoc services
				const associations = cp.associations.filter((l: any) => l.category === 1);
				const assocServices = await Promise.all(associations.map((assoc: any) => fetchAssocService(assoc.rid)));

				// sort assoc services by dep
				assocServices.sort((a: any, b: any) => {
					const aOrigin = a.locations?.[0];
					const bOrigin = b.locations?.[0];
					if (dayjs(aOrigin.std).isBefore(dayjs(bOrigin.std))) {
						return -1;
					}
					else {
						return 1;
					}
				})

				for (const { locations: assocLocations } of assocServices) {

					// add locations to line model
					const parsedAssoc = assocLocations.map(parseLocation);
					locations.push(parsedAssoc);

					// filter for calling points
					const assocRawCallingPoints = assocLocations.filter((l: any) => !l.isPass && l.crs);

					// add to destination array
					destination.push(assocRawCallingPoints[assocRawCallingPoints.length - 1]);

					// add to calling points array
					assocRawCallingPoints.forEach((cp: any, i: number) => {
						callingPoints.push({
							...cp,
							inDivision: true,
							startDivide: i === 0, // and specify where the division starts and ends
							endDivide: i === assocRawCallingPoints.length - 1
						});
					});

				}

				// finally add the cp after division for the main service, with dep. info only
				callingPoints.push({ ...cp, sta: null, eta: null, ata: null });
			} else {
				callingPoints.push(cp);
			}
		}
	}

	// console.log(
	// 	callingPoints
	// 		.map((cp) => {
	// 			if (cp.startDivide) {
	// 				return 'startDivide:' + cp.crs;
	// 			}
	// 			if (cp.endDivide) {
	// 				return 'endDivide:' + cp.crs;
	// 			} else {
	// 				return cp.crs;
	// 			}
	// 		})
	// 		.join(', ')
	// );

	destination = destination.map((l) => ({
		crs: l.crs,
		name: l.locationName
	}));

	const focusIndex = callingPoints.findIndex((l) => l.crs === crs);

	const title = `to ${destination.map((l) => l.name).join(', ')}`;

	return json({
		callingPoints: callingPoints.map((cp, i) => parseCallingPoint(cp, i, callingPoints.length, focusIndex)),
		locations,
		operator: {
			id: data.operatorCode,
			name: operatorList[data.operatorCode].name ?? data.operator ?? 'Unknown',
			color: operatorList[data.operatorCode].bg ?? '#000000'
		},
		title,
		reasonCode: data.delayReason?.value ?? data.cancelReason?.value ?? null
	});
};
