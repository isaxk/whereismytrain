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
		LineLayer
	} from 'svelte-maplibre';
	import MapLocationGroup from './map-location-group.svelte';
	import { page } from '$app/state';
	import type { ServiceMapData, TrainService } from '$lib/types';
	import { TrainFront } from 'lucide-svelte';
	import StationsJSON from '$lib/data/stations.json';
	import { fade } from 'svelte/transition';
	import bbox from '@turf/bbox';
	import { goto } from '$app/navigation';
	import MapService from './map-service.svelte';
	import SavedMapService from './saved-map-service.svelte';
	import type { Feature, FeatureCollection } from 'geojson';
	import { MediaQuery } from 'svelte/reactivity';
	import { onMount, untrack } from 'svelte';
	import { explicitEffect } from '$lib/utils/index.svelte';
	import { cameraForBoundsCustom } from '$lib/utils';

	let serviceData: TrainService | null = $state(null);
	let map: maplibregl.Map;
	let center: LngLatLike = $state([-0.1278, 51.5074]);
	let zoom = $state(5);

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

	const padding = $derived({
		top: 20,
		bottom: paneHeight.current + 20,
		left: 60,
		right: 50
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
						coordinates: mapData.board
					}
				}
			: null
	);

	explicitEffect(
		() => {
			if (map && mapData.service) {
				console.log('Should zoom to map');
				const data: Feature = {
					type: 'Feature',
					properties: {
						name: `map-focus`
					},
					geometry: {
						type: 'LineString',
						coordinates: mapData.service.tiplocData.map((t) => t.coords) ?? []
					}
				};
				const bbox = getBbox(data);
				if (bbox) {
					console.log('Should be a bbox', bbox);

					setBounds(bbox);
				}
			} else if (map && mapData.board && !page.data.id) {
				if (mapData.board.length === 1) {
					easeToIfChanged({
						center: mapData.board[0],
						zoom: 7,
						padding
					});
				} else if (route) {
					const bbox = getBbox(route);
					if (bbox) {
						setBounds(bbox);
					}
				}
			}
		},
		() => [map, mapData.service, mapData.board, page.data.id, padding, paneHeight.current]
	);

	let lastEaseTo: maplibregl.EaseToOptions | null = null;

	function easeToIfChanged(options: maplibregl.EaseToOptions) {
		if (lastEaseTo?.center !== options.center || lastEaseTo?.zoom !== options.zoom) {
			map.easeTo(options);
		}
		lastEaseTo = options;
	}

	function setBounds(bbox?: LngLatBoundsLike, animate = true) {
		if (map && bbox) {
			const camera = cameraForBoundsCustom(map, bbox as number[], padding);
			if (camera) {
				map.stop();

				easeToIfChanged({
					center: camera.center,
					zoom: camera.zoom,
					padding,
					animate
				});
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

	const saved = [
		// {
		// 	rid: '202511236728146',
		// 	crs: 'SWI'
		// },
		// {
		// 	rid: '202511238937001',
		// 	crs: 'ZFD'
		// },
		// {
		// 	rid: '202511237089311',
		// 	crs: 'PAD'
		// }
	];

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
	});
</script>

<MapLibre
	style={darkMode
		? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
		: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'}
	class="relative h-full w-full"
	standardControls
	onload={(e) => {
		map = e;
		const bbox: LngLatBoundsLike = [-8.2, 49.8, 1.9, 59.2];
		if (bbox) {
			setBounds(bbox, false);
		}
	}}
>
	{#if !mapData.service}
		{#each saved as item, i (item.rid)}
			{#if !page.data.id || page.data.id === item.rid}
				<SavedMapService rid={item.rid} crs={item.crs} />
			{/if}
		{/each}
	{/if}

	{#if mapData.service && serviceData}
		<MapService rid={page.data.id} mapData={mapData.service} {serviceData} crs={page.data.crs} />
	{:else if !page.data.id}
		<!-- GeoJSON source with clustering -->

		<GeoJSON
			id="stations"
			data={stationsGeoJSON}
			cluster={{
				radius: 45,
				maxZoom: 12
			}}
		>
			<!-- Clustered marker icons -->
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

			<!-- Unclustered single station markers -->
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
		{#if page.data.crs}
			{@const station = StationsJSON.find((s) => s.crsCode === page.data.crs)}
			{#if station}
				<Marker lngLat={[station.long, station.lat]} zIndex={5000}>
					<div
						class="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs text-[10px] text-white dark:bg-white dark:text-black"
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
</MapLibre>
