import { untrack } from 'svelte';
import type { LngLatLike, MapLibre } from 'svelte-maplibre';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
	// Convert degrees to radians
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const y = Math.sin(Δλ) * Math.cos(φ2);
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

	// Calculate the bearing in radians and convert to degrees
	let bearing = Math.atan2(y, x);
	bearing = bearing * (180 / Math.PI);

	// Normalize the bearing to be between 0 and 360 degrees
	return (bearing + 360) % 360;
}

export function cameraForBoundsCustom(
	map: maplibregl.Map,
	bounds: number[],
	padding: { top: number; bottom: number; left: number; right: number }
) {
	let west = bounds[0];
	let south = bounds[1];
	let east = bounds[2] ?? bounds[3];
	let north = bounds[3] ?? bounds[4];
	if (west == null || south == null || east == null || north == null) {
		return null;
	}
	const x1 = (west + 180) / 360;
	const x2 = (east + 180) / 360;
	const radSouth = (south * Math.PI) / 180;
	const radNorth = (north * Math.PI) / 180;
	const y1 = (1 - Math.log(Math.tan(radSouth) + 1 / Math.cos(radSouth)) / Math.PI) / 2;
	const y2 = (1 - Math.log(Math.tan(radNorth) + 1 / Math.cos(radNorth)) / Math.PI) / 2;
	const dx = Math.abs(x2 - x1);
	const dy = Math.abs(y2 - y1);
	const container = map.getContainer();
	const width = container.clientWidth - (padding.left + padding.right);
	const height = container.clientHeight - (padding.top + padding.bottom);
	if (width <= 0 || height <= 0 || dx === 0 || dy === 0) {
		const cx = (west + east) / 2;
		const cy = (south + north) / 2;
		return { center: [cx, cy] as LngLatLike, zoom: Math.min(map.getZoom() ?? 7, 14) };
	}
	const world = 512;
	const scaleX = width / (dx * world);
	const scaleY = height / (dy * world);
	const scale = Math.min(scaleX, scaleY);
	const zoom = Math.min(Math.max(Math.log2(scale), map.getMinZoom() ?? 0), map.getMaxZoom() ?? 22);
	const cx = (x1 + x2) / 2;
	const cy = (y1 + y2) / 2;
	const lng = cx * 360 - 180;
	const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180) / Math.PI;
	return { center: [lng, lat] as LngLatLike, zoom };
}



export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function parseServiceId(rawid: string) {
	const splitten = rawid.split('d');
	const id = splitten[0];

	const destCrsList = splitten.slice(1);

	return { id, destCrsList };
}