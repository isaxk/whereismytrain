<script lang="ts">
	import { mapData, paneHeight } from '$lib/state/map.svelte';
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
	import type { ServiceMapData, TrainService } from '$lib/types';
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
	import { explicitEffect, throttle } from '$lib/utils/index.svelte';
	import { cameraForBoundsCustom } from '$lib/utils';
	import { saved } from '$lib/state/saved.svelte';
	import { favourites } from '$lib/data/favourites';

	let serviceData: TrainService | null = $state(null);
	let map: maplibregl.Map;
	let center: LngLatLike = $state([-0.1278, 51.5074]);
	let zoom = $state(5);

	let safeAreaTop = $state(0);

	const lg = new MediaQuery('(min-width: 1024px)');

	$effect(() => {
		if (page.data.service) {
			page.data.service?.then((s: TrainService) => {
				serviceData = s;
			});
		} else {
			serviceData = null;
		}
	});

	const route: Feature | null = $derived(
		mapData.board?.length == 2
			? {
					type: 'Feature',
					properties: {
						name: `journey`
					},
					geometry: {
						type: 'LineString',
						coordinates: mapData.board ?? []
					}
				}
			: null
	);

	explicitEffect(
		() => {
			const padding = {
				top: lg.current ? 50 : Math.max(20, safeAreaTop + 20),
				bottom: lg.current ? 50 : paneHeight.current + 50,
				left: 60,
				right: 60
			};
			if (map && mapData.service) {
				// console.log('Should zoom to map');
				//

				const flatten = mapData.service.locations.map((l) => l.lineLocations).flat();

				const focusIndex = flatten.findIndex((l) => l.crs === page.data.crs);
				const filterIndex = page.data.to
					? flatten.findIndex((l) => l.crs === page.data.to)
					: flatten.length - 1;
				const train = mapData.service.locations[0]!.trainPosition ?? null;

				const route = flatten.slice(focusIndex, filterIndex + 1);

				const minimalObject = train
					? [...route.map((l) => l.coords), train]
					: route.map((l) => l.coords);

				const data: Feature = {
					type: 'Feature',
					properties: {
						name: `map-focus`
					},
					geometry: {
						type: 'LineString',
						coordinates:
							paneHeight.current > 400
								? minimalObject
								: mapData.service.locations[0].trainPosition
									? [
											...(mapData.service.tiplocData.map((t) => t.coords) ?? []),
											mapData.service.locations[0].trainPosition
										]
									: (mapData.service.tiplocData.map((t) => t.coords) ?? [])
					}
				};
				const bbox = getBbox(data);
				if (bbox) {
					// console.log('Should be a bbox', bbox);

					setBounds(bbox, padding);
				}
			} else if (
				map &&
				mapData.board &&
				page.data.crs &&
				navigating.to?.url.pathname !== '/' &&
				!page.data.id
			) {
				if (mapData.board.length === 1) {
					easeToIfChanged(
						{
							center: mapData.board[0],
							zoom: 7,
							padding
						},
						`${page.data.crs}-${paneHeight.current}`
					);
				} else if (route) {
					const bbox = getBbox(route);
					if (bbox) {
						setBounds(bbox, padding);
					}
				}
			} else if (map && !page.data.crs && !page.data.id) {
				setBounds([-8.2, 49.8, 1.9, 59.2], {
					top: Math.max(20, safeAreaTop),
					bottom: paneHeight.current,
					left: 0,
					right: 0
				});
			}
		},
		() => [map, mapData.service, mapData.board, page.data.id, paneHeight.current]
	);

	let lastKey: string | null = null;

	function easeToIfChanged(options: maplibregl.EaseToOptions, key: string) {
		console.log(lastKey, key);
		if (lastKey !== key) {
			map.easeTo(options);
			lastKey = key;
		}
	}

	function setBounds(
		bbox: LngLatBoundsLike,
		padding: { top: number; bottom: number; left: number; right: number },
		animate = true
	) {
		if (map && bbox) {
			padding = {
				top: padding.top ?? 0,
				bottom: padding.bottom ?? 0,
				left: padding.left ?? 0,
				right: padding.right ?? 0
			};
			// console.log('padding', padding);
			const camera = cameraForBoundsCustom(map, bbox as number[], padding);
			// console.log('camera', camera);
			if (camera) {
				map.stop();

				easeToIfChanged(
					{
						center: camera.center,
						zoom: camera.zoom,
						padding,
						animate
					},
					`${page.data.id}-${page.data.crs}-${page.data.to}-${paneHeight.current}`
				);
			}
		}
	}

	const stationsGeoJSON: FeatureCollection = {
		type: 'FeatureCollection',
		features: StationsJSON.map((s) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [s.long, s.lat] // IMPORTANT: GeoJSON is [lon, lat]
			},
			properties: {
				stationName: s.stationName,
				crsCode: s.crsCode,
				constituentCountry: s.constituentCountry
			}
		}))
	};

	function getBbox(feature: Feature): LngLatBoundsLike | undefined {
		const bboxResult = bbox(feature);
		if (bboxResult && (bboxResult.length === 4 || bboxResult.length === 6)) {
			if (bboxResult.length === 6) {
				// If it's a 6-element bbox, take the 2D part (first 4 elements)
				return [
					bboxResult[0], // minX (west)
					bboxResult[1], // minY (south)
					bboxResult[3], // maxX (east)
					bboxResult[4] // maxY (north)
				] as [number, number, number, number];
			} else {
				// bboxResult.length === 4
				return bboxResult as [number, number, number, number];
			}
		}
		return undefined; // Return undefined if bbox calculation fails or is empty
	}

	let darkMode = $state(false);

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
		if (map?.getZoom() > 8) {
			return sorted.slice(0, 125);
		} else {
			return favs;
		}
	});

	const updateBounds = throttle(() => {
		bounds = map?.getBounds();
	}, 500);

	$inspect(filteredStations);
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
			setBounds(bbox, { top: 0, bottom: lg.current ? 0 : 500, left: 0, right: 0 });
		}
	}}
>
	{#if lg.current}
		<NavigationControl position="top-left" />
	{/if}
	<GeolocateControl position="top-left" fitBoundsOptions={{ maxZoom: 12 }} />
	{#if !mapData.service}
		{#each saved.value as item, i (item.id)}
			{#if !page.data.id || page.data.id === item.id}
				<SavedMapService rid={item.id} crs={item.focusCrs} filter={item.filterCrs} />
			{/if}
		{/each}
	{/if}

	{#if mapData.service && serviceData}
		<MapService
			rid={page.data.id}
			mapData={mapData.service}
			{serviceData}
			filter={page.data.to}
			crs={page.data.crs}
		/>
	{:else if !page.data.id}
		{#if filteredStations.length === 0}
			<div class="fixed top-3 right-3 z-[200]">
				<div class="bg-background flex w-max items-center gap-1 rounded-md px-2 py-1">
					<CircleAlertIcon size={16} />
					Zoom in too see stations
				</div>
			</div>
		{/if}

		{#each filteredStations as station, i ((station?.crsCode ?? Date.now().toString()) + i)}
			{#if station}
				<Marker
					class="bg-background rounded-full"
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

		<!-- GeoJSON source with clustering -->

		<!-- {#key stationsGeoJSON}
			<GeoJSON
				id="stations"
				data={stationsGeoJSON}
				cluster={{
					radius: 45,
					maxZoom: 12
				}}
			>

				<MarkerLayer applyToClusters asButton>
					{#snippet children({ feature })}
						<div
							class={[
								'flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-white dark:bg-zinc-600',
								page.data.crs ? 'opacity-30' : 'opacity-80'
							]}
						>
							{feature.properties?.point_count}
						</div>
					{/snippet}
				</MarkerLayer>


				<MarkerLayer
					onclick={(e) => {
						page.data.crs = e.feature.properties.crsCode;
						goto('/board/' + e.feature.properties.crsCode);
					}}
					applyToClusters={false}
					asButton
				>
					{#snippet children({ feature })}
						<div
							class={[
								'flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-white dark:bg-zinc-600',
								page.data.crs ? 'opacity-30' : 'opacity-80'
							]}
						>
							{feature.properties?.crsCode}
						</div>
					{/snippet}
				</MarkerLayer>
			</GeoJSON>
		{/key} -->
		{#if page.data.crs && navigating.to?.url.pathname != '/'}
			{@const station = StationsJSON.find((s) => s.crsCode === page.data.crs)}
			{#if station}
				<Marker lngLat={[station.long, station.lat]} zIndex={5000}>
					<div
						class="animate-in fade-in-20 flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-[10px] text-white dark:bg-white dark:text-black"
					>
						{page.data.crs}
					</div>
				</Marker>
			{/if}
		{/if}

		{#if page.data.to && route}
			<GeoJSON id="journey" data={route}>
				<LineLayer
					layout={{ 'line-cap': 'round', 'line-join': 'round' }}
					paint={{
						'line-width': 5,
						'line-color': darkMode ? 'white' : 'black',
						'line-opacity': 1
					}}
				/>
			</GeoJSON>
			{@const station = StationsJSON.find((s) => s.crsCode === page.data.to)}
			{#if station}
				<Marker lngLat={[station.long, station.lat]} zIndex={5000}>
					<div
						class="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-[10px] text-white dark:bg-white dark:text-black"
					>
						{page.data.to}
					</div>
				</Marker>
			{/if}
		{/if}
	{/if}

	<!-- <div style:bottom="{paneHeight.current}px" class="fixed z-20 transition-all duration-200">

	</div> -->
</MapLibre>
