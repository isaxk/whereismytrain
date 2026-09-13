import dayjs from 'dayjs';

import { operatorList } from '$lib/data/operators';
import type {
	CallingPoint,
	CallingPointOrder,
	Carriage,
	Formation,
	SavedTrainServiceInfo,
	ServiceLocation,
	TimeObject,
	TrainService
} from '$lib/types';
import type { ServiceDetails, ServiceLocation as APIServiceLocation } from '$lib/types/api.js';

const nullTime = '0001-01-01T00:00:00';

type WorkingCallingPoint = APIServiceLocation & {
	startDivide?: boolean;
	endDivide?: boolean;
	inDivision?: boolean;
	startJoin?: boolean;
	endJoin?: boolean;
};

export async function fetchService(
	id: string,
	crs: string,
	to: string | null,
	token: string
): Promise<TrainService> {
	// console.log('token', token);
	const response = await fetch(
		`https://api1.raildata.org.uk/1010-query-services-and-service-details1_0/LDBSVWS/api/20220120/GetServiceDetailsByRID/${id}`,
		{
			headers: {
				'x-apikey': token
			}
		}
	);

	if (!response.ok) {
		const data: ServiceDetails = await response.json();
		// console.log(data);
		throw new Error(
			'Failed to fetch service. This usually means it does not (or no longer) exists in the National Rail database.'
		);
	}

	const data: ServiceDetails = await response.json();
	// console.log(data);
	const locations: ServiceLocation[][] = [(data.locations ?? []).map(parseLocation)];
	const rawCallingPoints: APIServiceLocation[] = (data.locations ?? []).filter(
		(l) => !l.isPass && l.activities?.split('').some((a) => ['T', 'U', 'D', 'R'].includes(a))
	);

	let callingPoints: WorkingCallingPoint[] = [];

	let focusIndex = rawCallingPoints.findIndex((l) => l.crs === crs);

	const formedFrom: string | null = null;

	// const hasNextAssoc = rawCallingPoints.find((l) =>
	// 	l.associations?.some((a) => a.category === 4 || a.category === 'next')
	// );
	// if (hasNextAssoc) {
	// 	const nextAssoc = hasNextAssoc.associations?.find(
	// 		(l: Association) => l.category === 4 || l.category === 'next'
	// 	);
	// 	// formedFrom = nextAssoc?.rid ?? null;
	// }

	let destination: APIServiceLocation[] = [];

	// console.log(rawCallingPoints.map((cp) => cp.activities?.split('')));

	// --- Division & Joins Logic ---

	// If the trains joins another service, the train's calling point list must continue on another service
	if (
		rawCallingPoints[rawCallingPoints.length - 1].associations?.some((l) => l.category === 'join')
	) {
		// Fetch the associated service
		const rid = rawCallingPoints?.[rawCallingPoints.length - 1].associations?.find(
			(l) => l.category === 'join'
		)?.rid;

		const assocService: ServiceDetails | null = rid ? await fetchAssocService(rid, token) : null;

		if (assocService) {
			const assocRawCallingPoints: WorkingCallingPoint[] = (assocService.locations ?? []).filter(
				(l) => !l.isPass
			);

			// Find where the first service joins onto the associated service, in the associated service's calling point list
			const joinIndexOnAssoc = assocRawCallingPoints.findIndex((cp) =>
				cp.associations?.some((l) => l.rid === id)
			);
			const joinIndexOnAssocLocations = (assocService.locations ?? []).findIndex((cp) =>
				cp.associations?.some((l) => l.rid === id)
			);
			const joinOnAssoc = assocRawCallingPoints[joinIndexOnAssoc];
			const joinOnAssocLocations = (assocService.locations ?? [])[joinIndexOnAssocLocations];

			const lastOfMain = rawCallingPoints[rawCallingPoints.length - 1];
			const lastOfAssoc = locations[0][locations[0].length - 1];

			// Add departure times to the join point
			rawCallingPoints[rawCallingPoints.length - 1] = {
				...lastOfMain,
				std: joinOnAssoc.std,
				etd: joinOnAssoc.etd,
				atd: joinOnAssoc.atd
			};

			locations[0][locations[0].length - 1] = {
				...lastOfAssoc,
				std: joinOnAssocLocations.std ?? null,
				etd: joinOnAssocLocations.etd ?? null,
				atd: joinOnAssocLocations.atd ?? null
			};

			// Join the two lists to form one continuous calling point list
			callingPoints = rawCallingPoints.concat(assocRawCallingPoints.slice(joinIndexOnAssoc + 1));
			const sliced = assocService.locations!.slice(joinIndexOnAssocLocations + 1);
			locations[0] = locations[0].concat(sliced.map(parseLocation));
		}
	} else {
		for (const [i, entry] of rawCallingPoints.entries()) {
			let cp = entry;
			// If the service divides onto another service, or is the division service
			if (cp.associations?.some((l) => l.category === 'divide') && (i > focusIndex || i === 0)) {
				// Set the destination of the main service
				destination = [
					rawCallingPoints.findLast(
						(l) => !l.isCancelled || rawCallingPoints[focusIndex + 1].isCancelled
					)!
				];

				// get associations
				const associations = cp.associations.filter((l) => l.category === 'divide');

				// When a service divides the join location is repeated at least 3 times: once for the arrival and once for each departure on each split
				// add the location before the division, with arrival info only
				if (i > 0) {
					callingPoints.push({
						...cp,
						std: null,
						etd: null,
						atd: null,
						stdSpecified: false,
						etdSpecified: false,
						atdSpecified: false
					});
				}

				// fetch assoc services
				const assocServices = await Promise.all(
					associations.map(async (assoc) => ({
						...(await fetchAssocService(assoc.rid!, token)),
						category: assoc.category
					}))
				);

				// sort assoc services by dep
				assocServices.sort((a, b) => {
					const aOrigin = a.locations?.[0];
					const bOrigin = b.locations?.[0];
					if (dayjs(aOrigin.std).isBefore(dayjs(bOrigin.std))) {
						return -1;
					} else {
						return 1;
					}
				});

				// console.log('assocServices', assocServices);

				for (const { locations: assocLocations, category } of assocServices) {
					// add locations to line model
					const parsedAssoc: ServiceLocation[] = assocLocations.map(parseLocation);

					// filter for calling points
					const assocRawCallingPoints: APIServiceLocation[] = assocLocations.filter(
						(l: APIServiceLocation) => !l.isPass
					);

					// if the requested service is the division service
					if (i === 0) {
						const divPoint = assocRawCallingPoints.findIndex((l) => l.crs === cp.crs);
						const locationDivPoint = parsedAssoc.findIndex((l) => l.crs === cp.crs);
						const beforeRawCallingPoints = assocRawCallingPoints.slice(0, divPoint);

						// add arrival information
						cp = {
							...cp,

							sta: assocRawCallingPoints[divPoint].sta,
							eta: assocRawCallingPoints[divPoint].eta,
							ata: assocRawCallingPoints[divPoint].sta,
							staSpecified: assocRawCallingPoints[divPoint].staSpecified,
							ataSpecified: assocRawCallingPoints[divPoint].ataSpecified,
							etaSpecified: assocRawCallingPoints[divPoint].etaSpecified
						};

						// add previous calling points
						callingPoints = beforeRawCallingPoints.concat(callingPoints);
						locations[0] = parsedAssoc.slice(0, locationDivPoint).concat(locations[0]);
					}
					// if the requested service is not the division service
					else {
						// add to destination array
						//
						if (category === 'divide') {
							destination.push(
								assocRawCallingPoints.findLast(
									(l) => !l.isCancelled || rawCallingPoints[focusIndex + 1].isCancelled
								)!
							);
						}

						// add to calling points array
						assocRawCallingPoints.forEach((cpj: WorkingCallingPoint, j: number) => {
							callingPoints.push({
								...cpj,
								ataSpecified: j === 0 ? cp.atdSpecified && !cpj.atdSpecified : cpj.ataSpecified,
								ata: j === 0 ? (cp.atdSpecified && !cpj.atdSpecified ? cp.ata : null) : cpj.ata,
								inDivision: true,
								startDivide: j === 0 && category === 'divide',
								startJoin: false,
								endDivide: j === assocRawCallingPoints.length - 1 && category === 'divide',
								endJoin: false
							});
						});
						locations.push(parsedAssoc);
					}
				}

				// finally add the cp after division for the main service, with dep. info only
				//
				if (i > 0) {
					callingPoints.push({
						...cp,
						sta: null,
						eta: null,
						ata: null,
						staSpecified: false,
						etaSpecified: false,
						ataSpecified: false
					});
				} else {
					callingPoints.push(cp);
				}
			} else {
				callingPoints.push(cp);
			}
		}
	}

	if (locations.length === 1) {
		if (callingPoints[focusIndex]?.falseDest) {
			destination = [callingPoints.find((cp) => callingPoints[focusIndex].fdTiploc === cp.tiploc)!];
		} else {
			destination = !callingPoints.some((cp, i) => !cp.isCancelled && i > focusIndex)
				? [callingPoints[callingPoints.length - 1]]
				: [callingPoints.findLast((l) => !l.isCancelled)!];
		}
	}

	const allThatMatchFilter = callingPoints
		.map((loc, i) => ({
			...loc,
			indexInCPs: i
		}))
		.filter((l) =>
			to
				? l.crs === to
				: callingPoints[focusIndex]?.falseDest
					? l.tiploc === callingPoints[focusIndex].fdTiploc
					: destination[0].crs === l.crs
		)
		.toSorted((a, b) => dayjs(a.sta).diff(dayjs(b.sta)));

	// console.log(
	// 	'allThatMatchFilter',
	// 	allThatMatchFilter.map((l) => l.crs)
	// );

	const filterIndex = allThatMatchFilter.find((l) => l.indexInCPs > focusIndex)?.indexInCPs;

	// console.log(filterIndex);

	if (filterIndex === undefined || filterIndex === -1) {
		throw new Error(`Could not query journey: ${crs}->${to}, on this service`);
	}

	focusIndex = callingPoints.findLastIndex((l, i) => l.crs === crs && i < filterIndex);

	if (focusIndex === -1 || filterIndex === -1) {
		throw new Error(`Could not query journey: ${crs}->${to}, on this service`);
	}

	if (
		filterIndex <=
			callingPoints.findIndex((l) => l.tiploc === callingPoints[focusIndex].fdTiploc) &&
		locations.length === 1
	) {
		callingPoints = callingPoints.slice(
			0,
			callingPoints.findIndex((l) => l.tiploc === callingPoints[focusIndex].fdTiploc) + 1
		);
		locations[0] = locations[0].slice(
			0,
			locations[0].findIndex((l) => l.tiploc === callingPoints[focusIndex].fdTiploc) + 1
		);
	}

	const date = callingPoints[focusIndex].std ?? dayjs().toString();

	const destinationDisplay =
		callingPoints[focusIndex]?.falseDest ?? destination.map((d) => d.locationName).join(' & ');

	const title = `${dayjs(date).format('HH:mm')} to ${destinationDisplay}`;

	let formationLengthOnly: boolean = (data.locations ?? [])[focusIndex]?.length ? true : false;

	let formation: Formation[] | null = (data.locations ?? [])[focusIndex]?.length
		? [
				{
					carriages: [...Array((data.locations ?? [])[focusIndex]?.length).keys()].map((_, i) => {
						return {
							coachNumber: (i + 1).toString(),
							serviceClass: 'standard',
							toilet: false,
							toiletIsAccessible: false,
							loading: null
						};
					})
				}
			]
		: null;

	let loading = null;

	if (data.formation) {
		const focus = data.formation.find(
			(f) => f.tiploc === (data.locations ?? [])[focusIndex]?.tiploc
		);
		const lastWithLoadingCarriages =
			data.formation.find((f) =>
				f ? f?.coaches?.some((c) => c.loading?.Value !== null) : false
			) ?? null;

		if (focus?.coaches || lastWithLoadingCarriages?.coaches) {
			formationLengthOnly = false;
			formation = [
				{
					carriages: ((focus?.coaches || lastWithLoadingCarriages?.coaches) ?? []).map((c, i) => ({
						coachNumber: c.number ?? '',
						serviceClass: (c.coachClass === 'First' ? 'first' : 'standard') as 'first' | 'standard',
						toilet: (c.toilet && c.toilet?.value !== 'None') ?? false,
						toiletIsAccessible: c.toilet?.value === 'Accessible',
						loading: (lastWithLoadingCarriages?.coaches ?? [])[i].loading?.Value ?? null
					}))
				}
			];
		}

		const focusFormation = data.formation.find(
			(f) => f.tiploc === (data.locations ?? [])[focusIndex]?.tiploc
		);

		if (focusFormation?.serviceLoading?.loadingPercentage?.Value) {
			loading = focusFormation.serviceLoading?.loadingPercentage?.Value;
		}
	}

	if (id === '202511307801133') {
		callingPoints[focusIndex].isCancelled = false;
	}

	// if (data.operatorCode == 'LO') {
	// 	data.operatorCode = findOvergroundLine(data.uid);
	// }
	//
	if (callingPoints.some((l) => l.crs === 'SSD') && callingPoints.some((l) => l.crs === 'LST')) {
		data.operatorCode = 'SX';
	}

	let category: 'standard' | 'express' | 'sleeper' | 'bus' | 'metro' = 'standard';
	if (data.category === 'XX' || data.category === 'XC') {
		category = 'express';
	} else if (data.category === 'XZ') {
		category = 'sleeper';
	} else if (data.category === 'BR' || data.category === 'BS') {
		category = 'bus';
	} else if (data.category === 'OL') {
		category = 'metro';
	}

	const parsedPoints = callingPoints.map((cp, i) =>
		parseCallingPoint(
			cp,
			i,
			callingPoints.length,
			focusIndex,
			filterIndex,
			callingPoints,
			locations
		)
	);

	let cancelledBetween: string | null = null;
	if (parsedPoints.some((l) => l.isCancelled) && parsedPoints.some((l) => !l.isCancelled)) {
		const firstCancelled = parsedPoints.findIndex((l) => l.isCancelled);
		const lastCancelled = parsedPoints.findLastIndex((l) => l.isCancelled);
		if (
			firstCancelled !== lastCancelled &&
			!parsedPoints.some((l, i) => !l.isCancelled && i > firstCancelled && i < lastCancelled)
		) {
			const end =
				lastCancelled === parsedPoints.length - 1
					? parsedPoints[lastCancelled]
					: parsedPoints[lastCancelled + 1];
			const start =
				firstCancelled === 0 ? parsedPoints[firstCancelled] : parsedPoints[firstCancelled - 1];
			if (firstCancelled === 0 || lastCancelled === parsedPoints.length - 1) {
				cancelledBetween = 'has been cancelled between ' + start.name + ' and ' + end.name;
			}
			// else {
			//   cancelledBetween = 'will no longer call at stations between ' + parsedPoints[firstCancelled].name + ' and ' + end.name;
			// }
		}
	}

	const final: TrainService = {
		rid: id,
		callingPoints: parsedPoints,
		focus: parsedPoints[focusIndex],
		filter: parsedPoints[filterIndex],
		locations,
		category,
		isBus: data.serviceType === 'bus' || data.serviceType === 1,
		operator: {
			id: data.operatorCode!,
			name: operatorList[data.operatorCode!]?.name ?? data.operator ?? 'Unknown',
			// name: data.operator ?? 'Unknown',
			color: operatorList[data.operatorCode!]?.bg ?? '#000000'
		},
		title,
		formedFrom,
		loading,
		destination: destination.map((d) => ({
			name: d.locationName ?? '',
			crs: d.crs ?? '',
			via: null
		})),
		formation,
		formationLengthOnly,
		uid: data.uid!,
		sdd: data.sdd!,
		date,
		isToday: dayjs().isSame(date, 'day'),
		cancelledBetween,
		reasonCode: (data.delayReason?.Value ?? data.cancelReason?.Value ?? null)?.toString() ?? ''
	};

	return final;
}

function parseLocation(l: APIServiceLocation): ServiceLocation {
	if (l.sta === nullTime) l.sta = null;
	if (l.std === nullTime) l.std = null;

	if (l.eta === nullTime) l.eta = null;
	if (l.etd === nullTime) l.etd = null;

	if (l.ata === nullTime) l.ata = null;
	if (l.atd === nullTime) l.atd = null;

	return {
		crs: l.crs ?? null,
		name: l.locationName ?? 'null',
		platform: l.platform ?? null,
		isPlatformConfirmed: l.platformIsHidden != true,
		isCancelled: l.isCancelled ?? false,
		tiploc: l.tiploc!,
		isCallingPoint: !l.isPass,
		eta: l.eta ?? null,
		etd: l.etd ?? null,
		ata: l.ata ?? null,
		atd: l.atd ?? null,
		sta: l.sta ?? null,
		std: l.std ?? null
	};
}

function parseCallingPoint(
	item: WorkingCallingPoint,
	index: number,
	length: number,
	focusIndex: number,
	filterIndex: number,
	all: WorkingCallingPoint[],
	locations: ServiceLocation[][]
): CallingPoint {
	if (item.ata === nullTime) item.ata = null;
	if (item.atd === nullTime) item.atd = null;
	if (item.eta === nullTime) item.eta = null;
	if (item.etd === nullTime) item.etd = null;
	if (item.sta === nullTime) item.sta = null;
	if (item.std === nullTime) item.std = null;

	let delay = null;
	let arrivalDelay = null;

	const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta).set('second', 0) : null;
	const rtd = item.atd || item.etd ? dayjs(item.atd ?? item.etd).set('second', 0) : null;

	const pta = item.sta ? dayjs(item.sta).set('second', 0) : null;
	const ptd = item.std ? dayjs(item.std).set('second', 0) : null;

	if (rtd && ptd) {
		delay = rtd.diff(ptd, 'minutes');
	}

	if (rta && pta) {
		arrivalDelay = rta ? rta.diff(pta, 'minutes') : null;
	}

	const times: TimeObject = {
		rt: {
			arr: item.ata ?? item.eta ?? null,
			dep: item.atd ?? item.etd ?? null
		},
		plan: {
			arr: item.sta ?? null,
			dep: item.std ?? null
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

	// const max = dest.reduce((prev, current) =>
	// 	prev && prev.indexInCPs > current.indexInCPs ? prev : current
	// );

	// let isDestination = false;
	// let isPostDestination = false;

	// if (dest.some((d) => d.indexInCPs === index)) {
	// 	isDestination = true;
	// }
	// if (index > max.indexInCPs) {
	// 	isPostDestination = true;
	// }

	if (index === focusIndex) {
		order = 'focus';
	} else if (index === 0) {
		order = 'origin';
	} else if (index === filterIndex) {
		order = 'filter';
	} else if (index < focusIndex) {
		order = 'previous';
	} else if (filterIndex && index > filterIndex) {
		order = 'further';
	} else {
		order = 'subsequent';
	}

	if (!order) {
		throw new Error('Failed to parse calling point order');
	}

	let cpsOnSplit = all.map((cp, i) => ({ ...cp, indexInCPs: i }));

	if (item.inDivision) {
		cpsOnSplit = all.map((cp, i) => ({ ...cp, indexInCPs: i })).filter((cp) => cp.inDivision);
	} else {
		cpsOnSplit = all.map((cp, i) => ({ ...cp, indexInCPs: i })).filter((cp) => !cp.inDivision);
	}

	let showTrain = false;

	// if the cp has arrived or departed
	if (item.atd || item.ata) {
		showTrain = true;
	}

	// console.log('has arrived or departed', showTrain);

	if (item.isCancelled) {
		// if the next cp is not cancelled and there are no non-cancelled, non-departed cp before this one
		if (
			cpsOnSplit[index + 1]?.isCancelled ||
			cpsOnSplit.some((cp) => cp.indexInCPs < index && !cp.atdSpecified && !cp.isCancelled)
		) {
			showTrain = false;
		} else if (cpsOnSplit.some((cp) => cp.indexInCPs < index && cp.atdSpecified)) {
			showTrain = true;
		}
	} else if (item.atd && cpsOnSplit.find((cp) => cp.indexInCPs === index + 1)?.isCancelled) {
		showTrain = false;
	}

	// console.log('first uncancelled', showTrain);

	// if there is an arrival or departure at a later calling point, hide the train
	if (
		cpsOnSplit.some((cp) => {
			if (
				cp.indexInCPs > index &&
				(cp.atdSpecified ||
					cp.ataSpecified ||
					(cp.atd !== nullTime && cp.atd) ||
					(cp.ata !== nullTime && cp.ata))
			) {
				return true;
			}
			return false;
		})
	) {
		showTrain = false;
	}

	// console.log('no later passes', showTrain);

	if (item.inDivision && cpsOnSplit.some((cp) => cp.startJoin)) {
		const firstAfterDivision = all.find((_, j) => j > cpsOnSplit[cpsOnSplit.length - 1].indexInCPs);
		if (firstAfterDivision?.atdSpecified) {
			showTrain = false;
		}
	}

	// console.log('no departs after join', showTrain);
	//

	const locationsOnSplit = locations.find((group) =>
		cpsOnSplit.every((cp) => group.some((loc) => loc.crs === cp.crs))
	);
	const indexOnLocations = locationsOnSplit?.findIndex((loc) => loc.crs === item.crs);
	const departedAfter = locationsOnSplit?.some(
		(loc, i) => (loc.atd || loc.ata) && i > (indexOnLocations ?? 100000)
	);

	const activities = item.activities?.split(' ') ?? [];

	// console.log(item.crs, activities);

	let feature: 'request' | 'pickup' | 'setdown' | null = null;
	if (activities.includes('R')) {
		feature = 'request';
	}
	if (activities.includes('U')) {
		feature = 'pickup';
	}
	if (activities.includes('D')) {
		feature = 'setdown';
	}

	return {
		crs: item.crs!,
		tiploc: item.tiploc!,
		name: item.locationName ?? '',
		times,
		delay,
		arrivalDelay,
		rtDepDate: item.atd ?? item.etd ?? null,
		departed: (item.atdSpecified === true && item.atd !== nullTime) || departedAfter === true,
		arrived: item.ataSpecified === true && item.ata !== nullTime,
		isCancelled: item.isCancelled ?? false,
		feature,
		departureCancelled,
		arrivalCancelled,
		inDivision: item.inDivision ?? false,
		startDivide: item.startDivide ?? false,
		endDivide: item.endDivide ?? false,
		startJoin: item.startJoin ?? false,
		endJoin: item.endJoin ?? false,
		platform: item.platform ?? null,
		isPlatformConfirmed:
			item.platformIsHidden != true ||
			(item.platform && item.atdSpecified) ||
			departedAfter === true,
		order,
		isOrigin: index === 0,
		showTrain
	};
}

async function fetchAssocService(rid: string, token: string) {
	console.log(`Fetching associated service for rid: ${rid}`);
	const response = await fetch(
		`https://api1.raildata.org.uk/1010-query-services-and-service-details1_0/LDBSVWS/api/20220120/GetServiceDetailsByRID/${rid}`,
		{
			headers: {
				'x-apikey': token
			}
		}
	);
	const data = await response.json();
	if (data?.locations) {
		return data;
	} else {
		throw new Error('Failed to fetch associated service');
	}
}

export function parseSavedInfo(service: TrainService): SavedTrainServiceInfo | null {
	const focus = service.focus;
	const filter = service.filter;
	if (!focus || !filter) return null;
	return {
		crs: focus.crs ?? '',
		from: focus.name,
		focusTiploc: focus.tiploc,
		planDep: focus.times.plan.dep!,
		planArr: filter.times.plan.arr!,
		departed: focus.departed,
		delay: focus.delay,
		isCancelled: focus.isCancelled || focus.departureCancelled,

		filter: filter.crs ?? '',
		to: filter.name,
		filterTiploc: filter.tiploc,
		rtDep: focus?.times.rt.dep ?? null,
		rtArr: filter?.times.rt.arr ?? null,
		arrived: filter.arrived,
		filterDelay: filter.arrivalDelay,
		isCancelledAtFilter: filter.isCancelled,

		destination: service.destination.map((d) => d.name).join(' & '),

		refreshedAt: Date.now(),

		platform: focus.platform,
		isPlatformConfirmed: focus.isPlatformConfirmed,
		operator: service.operator
	};
}
