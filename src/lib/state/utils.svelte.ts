import clsx, { type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import type { LngLatLike } from 'maplibre-gl';
import { untrack } from 'svelte';
import { twMerge } from 'tailwind-merge';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };


export function explicitEffect(fn: () => void, depsFn: () => void) {
	$effect(() => {
		depsFn();
		untrack(fn);
	});
}
