import { operatorList } from '$lib/data/operators';
import { findOvergroundLine } from '$lib/data/overground';
import type { BoardItem } from '$lib/types';
import dayjs from 'dayjs';

export const NULL_TIME = '0001-01-01T00:00:00';

export function parseBoardItem(item: any): BoardItem {
	if (item.ata === NULL_TIME) item.ata = null;
	if (item.atd === NULL_TIME) item.atd = null;
	if (item.eta === NULL_TIME) item.eta = null;
	if (item.etd === NULL_TIME) item.etd = null;
	if (item.sta === NULL_TIME) item.sta = null;
	if (item.std === NULL_TIME) item.std = null;

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

	// if (item.operatorCode === 'LO') {
	// 	item.operatorCode = findOvergroundLine(item.uid);
	// }

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
		rawTime: item.std,
		departed: item.atd && item.atd !== NULL_TIME,
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
