import { untrack } from 'svelte';

export function explicitEffect(fn: () => void, depsFn: () => void) {
	$effect(() => {
		depsFn();
		untrack(fn);
	});
}

export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
	let isWaiting = false;
	return function (this: any, ...args: Parameters<T>): void {
		if (!isWaiting) {
			func.apply(this, args);
			isWaiting = true;
			setTimeout(() => {
				isWaiting = false;
			}, delay);
		}
	} as T;
}
