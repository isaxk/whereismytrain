import { browser } from '$app/environment';

import type { PinnedBoard, SavedTrain, SavedTrainServiceInfo, TrainService } from '$lib/types';

export class LocalStore<T> {
	value = $state<T>() as T;
	key = '';

	constructor(key: string, value: T) {
		this.key = key;
		this.value = value;

		if (browser) {
			const item = localStorage.getItem(key);
			if (item) this.value = this.deserialize(item);
		}

		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(this.key, this.serialize(this.value));
			});
		});
	}

	serialize(value: T): string {
		return JSON.stringify(value);
	}

	deserialize(item: string): T {
		return JSON.parse(item);
	}
}

export function localStore<T>(key: string, value: T) {
	return new LocalStore(key, value);
}

export const saved = localStore<SavedTrain[]>('saved-services-v3', []);
export const pinned = localStore<PinnedBoard[]>('pinned-boards', []);
export const pwa = localStore<boolean>('is-installed-pwa', false);

export function parseSavedInfo(service: TrainService): SavedTrainServiceInfo | null {
	const focus = service.callingPoints.find((cp) => cp.order === 'focus');
	const filter = service.callingPoints.find((cp) => cp.order === 'filter');
	if (!focus || !filter) return null;
	return {
		crs: focus.crs,
		from: focus.name,
		planDep: focus.times.plan.dep!,
		planArr: filter.times.plan.arr!,
		departed: focus.departed,
		delay: focus.delay,
		isCancelled: focus.isCancelled,

		filter: filter.crs,
		to: filter.name,
		rtDep: focus?.times.rt.dep ?? null,
		rtArr: filter?.times.rt.arr ?? null,
		arrived: filter.arrived,
		filterDelay: filter.arrivalDelay,
		isCancelledAtFilter: filter.isCancelled,

		destination: service.destination.map((d) => d.name).join(', '),

		platform: focus.platform,
		operator: service.operator
	};
}

const DB_NAME = 'whereismytrain';
const DB_VERSION = 1;

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('trains')) {
				db.createObjectStore('trains');
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function getSavedTrainData(trainId: string): Promise<SavedTrainServiceInfo> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('trains', 'readonly');
		const store = transaction.objectStore('trains');
		const request = store.get(trainId);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function setSavedTrainData(trainId: string, data: SavedTrainServiceInfo) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('trains', 'readwrite');
		const store = transaction.objectStore('trains');
		console.log(data);
		const request = store.put(JSON.parse(JSON.stringify(data)), trainId);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
