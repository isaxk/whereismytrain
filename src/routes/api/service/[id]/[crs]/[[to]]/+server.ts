import { ACCESS_TOKEN } from '$env/static/private';
import { operatorList } from '$lib/data/operators';
import { findOvergroundLine } from '$lib/data/overground';
import type {
	CallingPoint,
	CallingPointOrder,
	Carriage,
	ServiceLocation,
	TimeObject,
	TrainService
} from '$lib/types';
import { parseServiceId } from '$lib/utils.js';
import { error, json } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { TreesIcon } from 'lucide-svelte';

const nullTime = '0001-01-01T00:00:00';

function parseLocation(l: any): ServiceLocation {
	return {
		crs: l.crs ?? null,
		isCancelled: l.isCancelled ?? false,
		tiploc: l.tiploc!,
		isCallingPoint: l.crs && !l.isPass,
		eta: l.eta ?? null,
		etd: l.etd ?? null,
		ata: l.ata ?? null,
		atd: l.atd ?? null,
		sta: l.sta ?? null,
		std: l.std ?? null
	};
}

function parseCallingPoint(
	item: any,
	index: number,
	length: number,
	focusIndex: number,
	filterIndex: number,
	dest: {
		crs: string;
		name: string;
		indexInCPs: number;
	}[],
	all: any[]
): CallingPoint {
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
			depSource:
				item.departureSource === 'Trust' ||
				item.departureSource === 'TD' ||
				item.departureSource === null
					? 'trust'
					: 'none'
		},
		plan: {
			arr: item.sta ? dayjs(item.sta).format('HH:mm') : null,
			dep: item.std ? dayjs(item.std).format('HH:mm') : null
		}
	};

	let order: CallingPointOrder | null = null;

	let arrivalCancelled = false;
	let departureCancelled = false;

	if (item.isCancelled) {
		arrivalCancelled = true;
		departureCancelled = true;
	} else {
		const isUnCancelledAfter = all.some((cp, i) => !cp.isCancelled && i > index);
		const isUnCancelledBefore = all.some((cp, i) => !cp.isCancelled && i < index);
		if (!isUnCancelledAfter) {
			departureCancelled = true;
		}
		if (!isUnCancelledBefore) {
			arrivalCancelled = true;
		}
	}

	const max = dest.reduce((prev, current) =>
		prev && prev.indexInCPs > current.indexInCPs ? prev : current
	);

	let isDestination = false;
	let isPostDestination = false;

	if (dest.some((d) => d.indexInCPs === index)) {
		isDestination = true;
	}
	if (index > max.indexInCPs) {
		isPostDestination = true;
	}

	if (index === focusIndex) {
		order = 'focus';
	} else if (index === 0) {
		order = 'origin';
	} else if (index === filterIndex) {
		order = 'filter';
	} else if (index < focusIndex) {
		order = 'previous';
	} else if (index > max.indexInCPs) {
		order = 'post-destination';
	} else if (filterIndex && index > filterIndex) {
		order = 'further';
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
		departed: item.atd && item.atd !== nullTime,
		arrived: item.ata && item.ata !== nullTime,
		isCancelled: item.isCancelled,
		departureCancelled,
		arrivalCancelled,
		inDivision: item.inDivision ?? false,
		startDivide: item.startDivide ?? false,
		endDivide: item.endDivide ?? false,
		platform: item.platform ?? null,
		order,
		isDestination,
		isPostDestination
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
	const { id: rawid, crs, to } = params;

	const { id, destCrsList } = parseServiceId(rawid);

	const response = await fetch(
		`https://huxley2.azurewebsites.net/service/${id}?access_token=${ACCESS_TOKEN}`
	);
	const data = await response.json();
	console.log(data);
	const locations: ServiceLocation[] = [data.locations.map(parseLocation)];
	const rawCallingPoints = data.locations.filter((l: any) => !l.isPass && l.crs);

	let callingPoints: any[] = [];
	let destination = [rawCallingPoints[rawCallingPoints.length - 1]];

	let formedFrom: string | null = null;

	const hasNextAssoc = rawCallingPoints.find((l: any) =>
		l.associations?.some((a: any) => a.category === 4 || a.category === 'next')
	);
	if (hasNextAssoc) {
		const nextAssoc = hasNextAssoc.associations.find(
			(l: any) => l.category === 4 || l.category === 'next'
		);
		formedFrom = `${nextAssoc?.rid}d${nextAssoc.destination?.[0]?.crs || rawCallingPoints[0].crs}`;
	}

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
				const assocServices = await Promise.all(
					associations.map((assoc: any) => fetchAssocService(assoc.rid))
				);

				// sort assoc services by dep
				assocServices.sort((a: any, b: any) => {
					const aOrigin = a.locations?.[0];
					const bOrigin = b.locations?.[0];
					if (dayjs(aOrigin.std).isBefore(dayjs(bOrigin.std))) {
						return -1;
					} else {
						return 1;
					}
				});

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

	destination = destCrsList.map((item) => {
		const cp = callingPoints.find((loc: any, i) => loc.crs === item);
		return {
			crs: cp.crs,
			name: cp.locationName,
			indexInCPs: callingPoints.findIndex((l, i) => l.crs === item)
		};
	});

	let focusIndex = callingPoints.findLastIndex(
		(l, i) => l.crs === crs && i < destination[0].indexInCPs
	);

	const allThatMatchFilter = callingPoints
		.map((loc, i) => ({
			...loc,
			indexInCPs: i
		}))
		.filter((l, i) => l.crs === to)
		.toSorted((a, b) => dayjs(a.sta).diff(dayjs(b.sta)));

	console.log(
		'allThatMatchFilter',
		allThatMatchFilter.map((loc) => `${loc.indexInCPs} ${loc.std}`)
	);

	console.log('focusIndex', focusIndex);

	let filterIndex = to
		? allThatMatchFilter.find((l) => l.indexInCPs > focusIndex)?.indexInCPs
		: callingPoints.findIndex((l, i) => destCrsList.includes(l.crs));

	console.log('focusIndex', focusIndex);
	console.log('filterIndex', filterIndex);

	if ((!filterIndex || filterIndex === -1) && to) {
		console.log('Could not find filter, retrying');
		filterIndex = callingPoints.findLastIndex((l, i) => l.crs === to);
		focusIndex = callingPoints.findLastIndex(
			(l, i) => l.crs === crs && i < destination[0].indexInCPs && i < (filterIndex ?? 10000)
		);
		console.log('focusIndex', focusIndex);
		console.log('filterIndex', filterIndex);
	}

	if (filterIndex && focusIndex > filterIndex) {
		console.log('Focus index is after filter index, retrying');
		focusIndex = callingPoints.findLastIndex(
			(l, i) => l.crs === crs && i < destination[0].indexInCPs && i < filterIndex
		);
		console.log('focusIndex', focusIndex);
		console.log('filterIndex', filterIndex);
	}

	const title = `${dayjs(callingPoints[focusIndex].std).format('HH:mm')} to ${destination.map((l) => l.name).join(', ')}`;

	let formationLengthOnly: boolean = data.locations[focusIndex]?.length ? true : false;

	let formation: Carriage[] | null = data.locations[focusIndex]?.length
		? [...Array(data.locations[focusIndex]?.length).keys()].map((_, i) => {
				return {
					coachNumber: (i + 1).toString(),
					serviceClass: 'standard',
					toilet: false,
					toiletIsAccessible: false,
					loading: null
				};
			})
		: null;

	if (data.formation) {
		const focus = data.formation.find((f: any) => f.tiploc === data.locations[focusIndex]?.tiploc);
		const lastWithLoading =
			data.formation.find((f: any) =>
				f ? f?.coaches?.some((c: any) => c.loading?.value !== null) : false
			) ?? null;

		if (focus?.coaches || lastWithLoading?.coaches) {
			formationLengthOnly = false;
			formation = ((focus?.coaches || lastWithLoading?.coaches) ?? []).map((c: any, i) => ({
				coachNumber: c.number,
				serviceClass: c.coachClass === 'First' ? 'first' : 'standard',
				toilet: c.toilet && c.toilet?.value !== 'None',
				toiletIsAccessible: c.toilet?.value === 'Accessible',
				loading: lastWithLoading.coaches[i].loading?.value ?? null
			}));
		}
	}

	if (id === '202511307801133') {
		callingPoints[focusIndex].isCancelled = false;
	}

	if (data.operatorCode == 'LO') {
		data.operatorCode = findOvergroundLine(data.uid);
	}

	const final: TrainService = {
		rid: data.id,
		callingPoints: callingPoints.map((cp, i) =>
			parseCallingPoint(
				cp,
				i,
				callingPoints.length,
				focusIndex,
				filterIndex,
				destination,
				callingPoints
			)
		),
		locations,
		isBus: data.serviceType === 'bus' || data.serviceType === 1,
		operator: {
			id: data.operatorCode,
			name: operatorList[data.operatorCode].name ?? data.operator ?? 'Unknown',
			color: operatorList[data.operatorCode].bg ?? '#000000'
		},
		title,
		formedFrom,
		destination,
		formation,
		formationLengthOnly,
		uid: data.uid,
		sdd: data.sdd,
		reasonCode: data.delayReason?.value ?? data.cancelReason?.value ?? null
	};

	return json(final);
};
