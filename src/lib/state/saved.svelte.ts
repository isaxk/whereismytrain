import { browser } from '$app/environment';
import type { PinnedBoard, SavedTrain } from '$lib/types';

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
export const pwa = $state({ current: false });
