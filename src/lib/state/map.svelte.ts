import type { ServiceMapData } from '$lib/types';
import type { LngLatLike } from 'svelte-maplibre';

export const mapData: {
	service: ServiceMapData | null;
	board: LngLatLike[] | null;
} = $state({
	service: null,
	board: null
});

export const paneHeight: {
	current: number;
	break: 'top' | 'middle' | 'bottom';
} = $state({
	current: 0,
	break: 'middle'
});

export const headerColor: {
	current: string | null;
} = $state({
	current: null
});
