import { error as kitError, json } from '@sveltejs/kit';
import dayjs from 'dayjs';

import { operatorList } from '$lib/data/operators';
import type {
	CallingPoint,
	CallingPointOrder,
	Carriage,
	ServiceLocation,
	TimeObject,
	TrainService
} from '$lib/types';
import type {
	ServiceDetails,
	ServiceLocation as APIServiceLocation,
	Association
} from '$lib/types/Api.js';
import { parseServiceId } from '$lib/utils.js';

import { ACCESS_TOKEN } from '$env/static/private';

type WorkingCallingPoint = APIServiceLocation & {
	startDivide?: boolean;
	endDivide?: boolean;
	inDivision?: boolean;
	startJoin?: boolean;
	endJoin?: boolean;
};

const nullTime = '0001-01-01T00:00:00';

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
		isCancelled: l.isCancelled ?? false,
		tiploc: l.tiploc!,
		isCallingPoint: l.crs !== undefined && !l.isPass,
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
	dest: {
		crs: string;
		name: string;
		indexInCPs: number;
	}[],
	all: WorkingCallingPoint[]
): CallingPoint {
	if (item.ata === nullTime) item.ata = null;
	if (item.atd === nullTime) item.atd = null;
	if (item.eta === nullTime) item.eta = null;
	if (item.etd === nullTime) item.etd = null;
	if (item.sta === nullTime) item.sta = null;
	if (item.std === nullTime) item.std = null;

	let delay = null;
	let arrivalDelay = null;

	const rta = item.ata || item.eta ? dayjs(item.ata ?? item.eta) : null;
	const rtd = item.atd || item.etd ? dayjs(item.atd ?? item.etd) : null;

	const pta = item.sta ? dayjs(item.sta) : null;
	const ptd = item.std ? dayjs(item.std) : null;

	if (rtd && ptd) {
		delay = rtd.diff(ptd, 'minutes');
	}

	if (rta && pta) {
		arrivalDelay = rta ? rta.diff(pta, 'minutes') : null;
	}

	const times: TimeObject = {
		rt: {
			arr: item.ata || item.eta ? dayjs(item.ata ?? item.eta).format('HH:mm') : null,
			dep: item.atd || item.etd ? dayjs(item.atd ?? item.etd).format('HH:mm') : null
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

	return {
		crs: item.crs!,
		tiploc: item.tiploc!,
		name: item.locationName ?? '',
		times,
		delay,
		arrivalDelay,
		rtDepDate: item.atd ?? item.etd ?? null,
		departed: item.atdSpecified === true && item.atd !== nullTime,
		arrived: item.ataSpecified === true && item.ata !== nullTime,
		isCancelled: item.isCancelled ?? false,
		departureCancelled,
		arrivalCancelled,
		inDivision: item.inDivision ?? false,
		startDivide: item.startDivide ?? false,
		endDivide: item.endDivide ?? false,
		startJoin: item.startJoin ?? false,
		endJoin: item.endJoin ?? false,
		platform: item.platform ?? null,
		order,
		isDestination,
		isOrigin: index === 0,
		isPostDestination,
		showTrain
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

	try {
		const { id, destCrsList } = parseServiceId(rawid);

		const response = await fetch(
			`https://huxley2.azurewebsites.net/service/${id}?access_token=${ACCESS_TOKEN}`
		);

		if (!response.ok) {
			throw new Error(
				'Failed to fetch service. This usually means it does not (or no longer) exists in the National Rail database.'
			);
		}

		const data: ServiceDetails = await response.json();
		// console.log(data);
		const locations: ServiceLocation[][] = [(data.locations ?? []).map(parseLocation)];
		const rawCallingPoints: APIServiceLocation[] = (data.locations ?? []).filter(
			(l) => !l.isPass && l.crs
		);

		let callingPoints: WorkingCallingPoint[] = [];

		let formedFrom: string | null = null;

		const hasNextAssoc = rawCallingPoints.find((l) =>
			l.associations?.some((a) => a.category === 4 || a.category === 'next')
		);
		if (hasNextAssoc) {
			const nextAssoc = hasNextAssoc.associations?.find(
				(l: Association) => l.category === 4 || l.category === 'next'
			);
			formedFrom = `${nextAssoc?.rid}d${nextAssoc?.destCRS || rawCallingPoints[0].crs}`;
		}

		// Division logic

		// If the current service *is* the division
		// category 1 == 'divide'
		if (rawCallingPoints[0].associations?.some((l) => l.category === 1)) {
			// const assocService = await fetchAssocService(
			// 	rawCallingPoints[0].associations.find((l: any) => l.category === 1).rid
			// );

			// if (assocService) {
			// 	// add the location as a line to the map object
			// 	const assocParsedLocations = assocService.locations.map(parseLocation);
			// 	locations.push(assocParsedLocations);

			// 	const assocRawCallingPoints = assocService.locations.filter((l: any) => !l.isPass && l.crs);
			// 	destination.push(assocRawCallingPoints[assocRawCallingPoints.length - 1]);
			// 	assocRawCallingPoints.forEach((cp: any) => {
			// 		// Insert the division calling point to the list
			// 		if (cp.associations?.some((l: any) => l.category === 1)) {
			// 			rawCallingPoints.forEach((cp: any, i: number) => {
			// 				callingPoints.push({
			// 					...cp,
			// 					inDivision: true,
			// 					startDivide: i === 0, // and specify where the division starts and ends
			// 					endDivide: i === rawCallingPoints.length - 1
			// 				});
			// 			});
			// 		}

			// 		callingPoints.push(cp);
			// 	});
			// }
			callingPoints = rawCallingPoints;
			const assoc = rawCallingPoints[0].associations?.find((l) => l.category === 1);
			console.log(assoc);
			formedFrom = assoc ? `${assoc.rid}d${assoc.destCRS || rawCallingPoints[0].crs}` : null;
		}
		// the current service joins onto the 'main' service
		else if (
			rawCallingPoints[rawCallingPoints.length - 1].associations?.some((l) => l.category === 0)
		) {
			const rid = rawCallingPoints?.[rawCallingPoints.length - 1].associations?.find(
				(l) => l.category === 0
			)?.rid;

			const assocService: ServiceDetails | null = rid ? await fetchAssocService(rid) : null;

			if (assocService) {
				// add the location as a line to the map object
				// locations.push(assocParsedLocations);

				const assocRawCallingPoints: WorkingCallingPoint[] = (assocService.locations ?? []).filter(
					(l) => !l.isPass && l.crs
				);
				// destination.push(assocRawCallingPoints[assocRawCallingPoints.length - 1]);

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

				callingPoints = rawCallingPoints.concat(assocRawCallingPoints.slice(joinIndexOnAssoc + 1));
				const sliced = assocService.locations!.slice(joinIndexOnAssocLocations + 1);
				locations[0] = locations[0].concat(sliced.map(parseLocation));

				// assocRawCallingPoints.forEach((cp: any) => {
				// 	// Insert the join calling point to the list

				// 	if (cp.associations?.some((l: any) => l.category === 0)) {
				// 		callingPoints.push({ ...cp, std: null, etd: null, atd: null });
				// 		rawCallingPoints.forEach((cp: any, i: number) => {
				// 			callingPoints.push({
				// 				...cp,
				// 				inDivision: true,
				// 				startJoin: i === 0, // and specify where the division starts and ends
				// 				endJoin: i === rawCallingPoints.length - 1
				// 			});
				// 		});
				// 		callingPoints.push({ ...cp, sta: null, eta: null, ata: null });
				// 	} else {
				// 		callingPoints.push(cp);
				// 	}
				// });
			}
		}
		// otherwise assume the current service is the primary service, or there is no division
		else {
			for (const cp of rawCallingPoints) {
				if (
					cp.associations?.some((l) => l.category === 1 || l.category === 0) &&
					destCrsList.length > 1
				) {
					// get associations
					const associations = cp.associations.filter((l) => l.category === 1 || l.category === 0);

					// add the location before the division, with arr. info only
					callingPoints.push({ ...cp, std: null, etd: null, atd: null });

					// fetch assoc services
					const assocServices = await Promise.all(
						associations.map(async (assoc) => ({
							...(await fetchAssocService(assoc.rid!)),
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

					for (const { locations: assocLocations, category } of assocServices) {
						// add locations to line model
						const parsedAssoc = assocLocations.map(parseLocation);
						locations.push(parsedAssoc);

						// filter for calling points
						const assocRawCallingPoints = assocLocations.filter(
							(l: APIServiceLocation) => !l.isPass && l.crs
						);

						// add to destination array
						// destination.push(assocRawCallingPoints[assocRawCallingPoints.length - 1]);

						// add to calling points array
						assocRawCallingPoints.forEach((cp: WorkingCallingPoint, i: number) => {
							callingPoints.push({
								...cp,
								inDivision: true,
								startDivide: i === 0 && category === 1, // and specify where the division starts and ends
								startJoin: i === 0 && category === 0,
								endDivide: i === assocRawCallingPoints.length - 1 && category === 1,
								endJoin: i === assocRawCallingPoints.length - 1 && category === 0
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
		//
		// console.log(destCrsList);
		// console.log(callingPoints.map((cp) => cp.crs));

		const destination: {
			crs: string;
			indexInCPs: number;
			name: string;
			via: string | null;
		}[] = destCrsList
			.map((item) => {
				const cp = callingPoints.find((loc, i) => loc.crs === item && i > 0);
				if (cp) {
					return {
						crs: cp.crs ?? '',
						name: cp.locationName ?? '',
						indexInCPs: callingPoints.findIndex((l, i) => l.crs === item && i > 0),
						via: null
					};
				} else {
					return null;
				}
			})
			.filter((item) => item !== null);
		if (!destination.length || !destination) {
			throw new Error(`Could not find destination station(s) on route: ${destCrsList.join(', ')}`);
		}

		let focusIndex = callingPoints.findLastIndex(
			(l, i) => l.crs === crs && i < (destination[0]?.indexInCPs ?? Number.POSITIVE_INFINITY)
		);

		const allThatMatchFilter = callingPoints
			.map((loc, i) => ({
				...loc,
				indexInCPs: i
			}))
			.filter((l) => l.crs === to)
			.toSorted((a, b) => dayjs(a.sta).diff(dayjs(b.sta)));

		// console.log(
		// 	'allThatMatchFilter',
		// 	allThatMatchFilter.map((loc) => `${loc.indexInCPs} ${loc.std}`)
		// );

		// console.log('focusIndex', focusIndex);

		let filterIndex = to
			? allThatMatchFilter.find((l) => l.indexInCPs > focusIndex)?.indexInCPs
			: callingPoints.findIndex((l) => destCrsList.includes(l.crs ?? ''));

		// console.log('focusIndex', focusIndex);
		// console.log('filterIndex', filterIndex);

		if ((!filterIndex || filterIndex === -1) && to) {
			console.log('Could not find filter, retrying');
			filterIndex = callingPoints.findLastIndex(
				(l, i) => l.crs === to && i <= destination[0]!.indexInCPs
			);
			focusIndex = callingPoints.findLastIndex(
				(l, i) => l.crs === crs && i < destination[0]!.indexInCPs && i < (filterIndex ?? 10000)
			);
			console.log('focusIndex', focusIndex);
			console.log('filterIndex', filterIndex);
		}

		if (filterIndex && focusIndex > filterIndex) {
			console.log('Focus index is after filter index, retrying');
			focusIndex = callingPoints.findLastIndex(
				(l, i) => l.crs === crs && i < destination[0]!.indexInCPs && i < (filterIndex ?? 10000)
			);
			console.log('focusIndex', focusIndex);
			console.log('filterIndex', filterIndex);
		}

		if (focusIndex === -1 || filterIndex === -1 || !filterIndex) {
			filterIndex = callingPoints.findLastIndex(
				(l) => l.crs === to || destCrsList.includes(l.crs ?? '')
			);
			focusIndex = callingPoints.findLastIndex(
				(l, i) => l.crs === crs && i < (filterIndex ?? 10000)
			);
		}

		if (focusIndex === -1 || filterIndex === -1 || !filterIndex) {
			focusIndex = callingPoints.findIndex((l) => l.crs === crs);
			filterIndex = callingPoints.findIndex(
				(l, i) => (l.crs === to || destCrsList.includes(l.crs ?? '')) && i > focusIndex
			);
		}

		if (focusIndex === -1 || filterIndex === -1 || !filterIndex) {
			throw new Error(`Could not query journey: ${crs}->${to ?? destCrsList[0]}, on this service`);
		}

		const date = callingPoints[focusIndex].std ?? dayjs().toString();

		const title = `${dayjs(date).format('HH:mm')} to ${destination.map((l) => l.name).join(', ')}`;

		let formationLengthOnly: boolean = (data.locations ?? [])[focusIndex]?.length ? true : false;

		let formation: Carriage[] | null = (data.locations ?? [])[focusIndex]?.length
			? [...Array((data.locations ?? [])[focusIndex]?.length).keys()].map((_, i) => {
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
			const focus = data.formation.find(
				(f) => f.tiploc === (data.locations ?? [])[focusIndex]?.tiploc
			);
			const lastWithLoading =
				data.formation.find((f) =>
					f ? f?.coaches?.some((c) => c.loading?.value !== null) : false
				) ?? null;

			if (focus?.coaches || lastWithLoading?.coaches) {
				formationLengthOnly = false;
				formation = ((focus?.coaches || lastWithLoading?.coaches) ?? []).map((c, i) => ({
					coachNumber: c.number ?? '',
					serviceClass: (c.coachClass === 'First' ? 'first' : 'standard') as 'first' | 'standard',
					toilet: (c.toilet && c.toilet?.value !== 'None') ?? false,
					toiletIsAccessible: c.toilet?.value === 'Accessible',
					loading: (lastWithLoading?.coaches ?? [])[i].loading?.value ?? null
				}));
			}
		}

		if (id === '202511307801133') {
			callingPoints[focusIndex].isCancelled = false;
		}

		// if (data.operatorCode == 'LO') {
		// 	data.operatorCode = findOvergroundLine(data.uid);
		// }

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
			category,
			isBus: data.serviceType === 'bus' || data.serviceType === 1,
			operator: {
				id: data.operatorCode!,
				name: operatorList[data.operatorCode!].name ?? data.operator ?? 'Unknown',
				color: operatorList[data.operatorCode!].bg ?? '#000000'
			},
			title,
			formedFrom,
			destination,
			formation,
			formationLengthOnly,
			uid: data.uid!,
			sdd: data.sdd!,
			date,
			isToday: dayjs().isSame(date, 'day'),
			reasonCode: (data.delayReason?.value ?? data.cancelReason?.value ?? null)?.toString() ?? ''
		};

		return json(final);
	} catch (error: unknown) {
		console.error('error.message', (error as Error).message);
		return kitError(500, (error as Error).message);
	}
};
