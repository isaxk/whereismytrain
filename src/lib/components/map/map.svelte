<script lang="ts">
	import { paneHeight } from '$lib/state/map.svelte';
	import {
		Layer,
		MapLibre,
		Marker,
		MarkerLayer,
		GeoJSON,
		type LngLatBoundsLike,
		type LngLatLike,
		LineLayer,
		NavigationControl,
		GeolocateControl,
		FullscreenControl,
		ScaleControl
	} from 'svelte-maplibre';
	import { LngLatBounds } from 'maplibre-gl';
	import MapLocationGroup from './map-location-group.svelte';
	import { navigating, page } from '$app/state';
	import type { MapData, ServiceMapData, TrainService } from '$lib/types';
	import { AlertCircle, CircleAlertIcon, TrainFront } from 'lucide-svelte';
	import StationsJSON from '$lib/data/stations.json';
	import { fade } from 'svelte/transition';
	import bbox from '@turf/bbox';
	import { goto } from '$app/navigation';
	import MapService from './map-service.svelte';
	import SavedMapService from './saved-map-service.svelte';
	import type { Feature, FeatureCollection } from 'geojson';
	import { MediaQuery } from 'svelte/reactivity';
	import { onMount, untrack } from 'svelte';
	import { throttle } from '$lib/utils';
	import { cameraForBoundsCustom } from '$lib/utils';
	import { saved } from '$lib/state/saved.svelte';
	import { favourites } from '$lib/data/favourites';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import { refreshing } from '$lib/state/services-subscriber.svelte';
	import { easeToIfChanged, getBbox, setBounds } from './map-utils';

	const lg = new MediaQuery('(min-width: 1024px)');

	let darkMode = $state(false);
	let safeAreaTop = $state(0);

	let serviceData: TrainService | null = $state(null);
	let mapData: MapData | null = $state(null);
	let id: string | null = $state(null);

	let map: maplibregl.Map | null = null;
	let boundsData: [number, number][] = $state([]);

	$effect(() => {
		if (page.data.id !== id) {
			serviceData = null;
			mapData = null;
		}
		id = page.data.id;
		page.data.service?.then((d) => (serviceData = d));
		page.data.map?.then((d) => (mapData = d));
	});

	$effect(() => {
		// if (mapData?.type === 'service') {
		// 	boundsData = mapData.locations
		// 		.map((l) => l.lineLocations)
		// 		.flat()
		// 		.map((l) => l.coords);
		// } else
		if (mapData?.type === 'board' && page.data.crs) {
			boundsData = mapData.to ? [mapData?.from, mapData?.to] : [mapData?.from];
		}
	});

	const mapFocusLine: Feature = $derived({
		type: 'Feature',
		properties: {
			name: `map-focus`
		},
		geometry: {
			type: 'LineString',
			coordinates: boundsData
		}
	});

	explicitEffect(
		() => {
			console.log('refreshing map');

			if (!map || !boundsData || boundsData.length === 0) return;

			if (boundsData.length === 1) {
				easeToIfChanged(
					map,
					{
						center: boundsData[0],
						zoom: 7,
						padding: { top: 20 + safeAreaTop, left: 20, right: 20, bottom: paneHeight.current }
					},
					`${page.data.crs}-${paneHeight.current}`
				);
				return;
			}

			const bbox = getBbox(mapFocusLine);
			if (bbox && map) {
				// console.log('Should be a bbox', bbox);

				setBounds(
					map,
					bbox,
					mapData?.type === 'service'
						? { top: 25 + safeAreaTop, left: 50, right: 50, bottom: paneHeight.current + 50 }
						: { top: 50 + safeAreaTop, left: 75, right: 75, bottom: paneHeight.current + 50 },
					true,
					`${page.data.crs}-${page.data.id}-${page.data.to}-${paneHeight.current}`
				);
			}
		},
		() => [mapFocusLine]
	);

	onMount(() => {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			darkMode = true;
		} else {
			darkMode = false;
		}
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			darkMode = event.matches;
		});
		safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat'));
	});

	let bounds: LngLatBounds = $state(new LngLatBounds([-8.2, 49.8, 1.9, 59.2]));

	let filteredStations = $derived.by(() => {
		const favs = favourites.map((crs) => StationsJSON.find((station) => station.crsCode === crs));
		const list = StationsJSON.filter((station) => bounds?.contains([station.long, station.lat]));
		const sorted = list.toSorted((a, b) => {
			if (favourites.includes(a.crsCode)) return -1;
			if (favourites.includes(b.crsCode) && !favourites.includes(a.crsCode)) return 1;
			return 0;
		});
		if ((map?.getZoom() ?? 0) > 8) {
			return sorted.slice(0, 125);
		} else {
			return favs;
		}
	});

	const updateBounds = throttle(() => {
		if (!map) return;
		bounds = map.getBounds();
	}, 500);
</script>

<MapLibre
	style={darkMode
		? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
		: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'}
	class="relative h-full w-full"
	onmoveend={(e) => {
		updateBounds();
	}}
	onzoom={(e) => {
		updateBounds();
	}}
	onload={(e) => {
		map = e;
		const bbox: LngLatBoundsLike = [-8.2, 49.8, 1.9, 59.2];
		if (bbox) {
			setBounds(
				map,
				bbox,
				{ top: 0, bottom: lg.current ? 0 : 500, left: 0, right: 0 },
				false,
				`uk`
			);
		}
	}}
>
	<div class="blur-panel fixed top-0 right-0 left-0 z-10000000 h-safe-top"></div>
	{#if lg.current}
		<NavigationControl position="top-left" />
	{/if}

	{#if serviceData && mapData?.type === 'service' && page.data.id}
		{#if mapData.type === 'service'}
			<MapService
				onBounds={(bounds) => (boundsData = bounds)}
				rid={page.data.id}
				{serviceData}
				{mapData}
				crs={page.data.crs}
				filter={page.data.to}
				refreshing={refreshing.current}
			/>
		{/if}
	{:else if mapData?.type === 'board' && page.data.crs}
		{#if mapData.from}
			<GeoJSON id="journey-route" data={mapFocusLine}>
				<LineLayer
					layout={{ 'line-cap': 'round', 'line-join': 'round' }}
					paint={{
						'line-width': 5,
						'line-color': 'black',
						'line-opacity': 1
					}}
				/>
			</GeoJSON>
			<Marker lngLat={mapData.from} zIndex={5000}>
				<div
					class="flex h-7 w-7 animate-in items-center justify-center rounded-full bg-black text-xs text-[10px] text-white fade-in-20 dark:bg-white dark:text-black"
				>
					{page.data.crs}
				</div>
			</Marker>
			{#if mapData.to}
				<Marker lngLat={mapData.to} zIndex={5000}>
					<div
						class="flex h-7 w-7 animate-in items-center justify-center rounded-full bg-black text-xs text-[10px] text-white fade-in-20 dark:bg-white dark:text-black"
					>
						{page.data.to}
					</div>
				</Marker>
			{/if}
		{/if}
	{:else}
		{#each filteredStations as station, i ((station?.crsCode ?? Date.now().toString()) + i)}
			{#if station}
				<Marker
					class="rounded-full bg-background"
					zIndex={favourites.includes(station.crsCode) ? 1000 : 100}
					lngLat={[station.long, station.lat]}
					onclick={(e) => {
						page.data.crs = station.crsCode;
						goto('/board/' + station.crsCode);
					}}
				>
					<div
						class={[
							'flex h-7 w-7 items-center justify-center rounded-full  text-[10px] text-white ',
							page.data.crs
								? 'bg-neutral-900 opacity-20 dark:bg-neutral-700'
								: 'bg-zinc-700 opacity-100 dark:bg-zinc-600'
						]}
					>
						{station.crsCode}
					</div>
				</Marker>
			{/if}
		{/each}
	{/if}
</MapLibre>
