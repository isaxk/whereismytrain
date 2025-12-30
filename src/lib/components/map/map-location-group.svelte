<script lang="ts">
	import type { MapDataLocationGroup, ServiceMapData } from '$lib/types';
	import { LineLayer, MapLibre, GeoJSON, Marker, Popup, AttributionControl } from 'svelte-maplibre';
	import { AlertCircle, CircleAlert, TrainFront } from 'lucide-svelte';
	import type { Feature } from 'geojson';
	import { Tween } from 'svelte/motion';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Spinner from '../ui/spinner/spinner.svelte';
	import { fade } from 'svelte/transition';
	import MapTrainIndication from './map-train-indication.svelte';
	let {
		href,
		crs,
		rid,
		data,
		index,
		category,
		refreshing = false,
		color,
		showDestination,
		isAtStation,
		filter,
		focus
	}: {
		href: string;
		crs: string;
		rid: string;
		data: MapDataLocationGroup;
		index: number;
		category: string;
		color: string;
		showDestination: boolean;
		refreshing: boolean;
		isAtStation: boolean;
		filter?: string | null;
		focus?: string | null;
	} = $props();

	const coordinates = $derived(data.lineLocations.map((l) => l.coords));

	const unCancelled = $derived(
		data.lineLocations.filter((c, i) => {
			const prevCP = data.lineLocations.find((l, j) => l.isCallingPoint && j < i);
			const nextCP = data.lineLocations.find((l, j) => l.isCallingPoint && j > i);

			const prevCpIsCancelled = prevCP?.isCancelled ?? false;
			const nextCpIsCancelled = nextCP?.isCancelled ?? false;

			if (c.isCallingPoint && c.isCancelled) {
				return false;
			}

			if (!c.isCancelled) {
				return true;
			}

			if (!nextCP && c.isCancelled) {
				return false;
			}

			if (!prevCpIsCancelled && !nextCpIsCancelled) {
				return true;
			}
			return false;
		})
	);

	const unCancelledCoordinates = $derived(unCancelled.map((l) => l.coords));

	const primaryCoordinates = $derived.by(() => {
		const filtered = unCancelled;

		if (!filter || !crs || !filtered.some((l) => l.crs === crs || l.crs === filter)) {
			return [];
		}

		let focus = filtered.findIndex((l) => l.crs === crs);
		if (focus === -1) {
			focus = 0;
		}
		if (focus !== -1) {
			let coords = [];

			if (filter) {
				const filterIndex = filtered.findIndex((l) => l.crs === filter);

				console.log('filterIndex', filter, filterIndex);

				if (filterIndex !== -1 && filterIndex > focus) {
					coords = filtered.slice(focus, filterIndex + 1);
				} else {
					coords = filtered.slice(focus);
				}
			} else {
				coords = filtered.slice(focus);
			}
			return coords.map((l) => l.coords);
		} else {
			return filtered.map((l) => l.coords);
		}
	});

	// const lineData = $derived.by(() => {
	// 	const filtered = data.lineLocations.filter((l) => !l.isCancelled);
	// 	const focus = filtered.findIndex((l) => l.crs === crs);
	// 	if (focus !== -1 && filtered.find((l) => l.crs === crs)) {
	// 		let coords = [];
	// 		if (filter) {
	// 			const filterIndex = data.lineLocations.findIndex((l) => l.crs === filter);
	// 			if (filterIndex !== -1 && filterIndex > focus) {
	// 				coords = data.lineLocations.slice(focus, filterIndex + 1);
	// 			} else {
	// 				coords = data.lineLocations.slice(focus);
	// 			}
	// 		} else {
	// 			coords = filtered.slice(focus);
	// 		}
	// 		return coords.map((l) => l.coords);
	// 	} else {
	// 		return [];
	// 	}
	// });

	const lineData: Feature = $derived({
		type: 'Feature',
		properties: {
			name: `train-route-${rid}-${index}-secondary`
		},
		geometry: {
			type: 'LineString',
			coordinates: coordinates
		}
	});

	const unCancelledLineData: Feature = $derived({
		type: 'Feature',
		properties: {
			name: `train-route-${rid}-${index}-uncancelled`
		},
		geometry: {
			type: 'LineString',
			coordinates: unCancelledCoordinates
		}
	});

	const primaryLineData: Feature = $derived({
		type: 'Feature',
		properties: {
			name: `train-route-${rid}-${index}-primary`
		},
		geometry: {
			type: 'LineString',
			coordinates: primaryCoordinates
		}
	});

	const coordsTween = $derived(data.trainPosition ? Tween.of(() => data.trainPosition) : null);

	$inspect('filter', filter);
	$inspect('focus', crs);
</script>

<GeoJSON id="train-route-{rid}-{index}-secondary" data={lineData}>
	<LineLayer
		onclick={() => {
			page.data.id = rid;
			page.data.crs = crs;
			goto(href);
		}}
		layout={{ 'line-cap': 'round', 'line-join': 'round' }}
		paint={{
			'line-width': 5,
			'line-color': color,
			'line-opacity': page.data.id === rid ? 0.2 : 0.05
		}}
	/>
</GeoJSON>

<GeoJSON id="train-route-{rid}-{index}-primary" data={primaryLineData}>
	<LineLayer
		onclick={() => {
			page.data.id = rid;
			page.data.crs = crs;
			goto(href);
		}}
		layout={{ 'line-cap': 'round', 'line-join': 'round' }}
		paint={{
			'line-width': 6.5,
			'line-color': color,
			'line-opacity': page.data.crs
				? page.data.id === rid
					? data.lineLocations.some((l) => l.crs === filter || l.crs === focus)
						? 1
						: 0.2
					: 0.2
				: 0.8
		}}
	/>
</GeoJSON>

<GeoJSON id="train-route-{rid}-{index}-uncancelled" data={unCancelledLineData}>
	<LineLayer
		onclick={() => {
			page.data.id = rid;
			page.data.crs = crs;
			goto(href);
		}}
		layout={{ 'line-cap': 'round', 'line-join': 'round' }}
		paint={{
			'line-width': 5,
			'line-color': color,
			'line-opacity': page.data.id === rid ? 0.4 : 0.1
		}}
	/>
</GeoJSON>

<GeoJSON id="train-route-{rid}-{index}-padding" data={lineData}>
	<LineLayer
		onclick={() => {
			page.data.id = rid;
			page.data.crs = crs;
			goto(href);
		}}
		layout={{ 'line-cap': 'round', 'line-join': 'round' }}
		paint={{
			'line-width': 10,
			'line-color': color,
			'line-opacity': 0
		}}
	/>
</GeoJSON>

{#if data.trainPosition && coordsTween?.current}
	{#if data.isFormedFromTrain}
		<div class="fixed top-safe-top right-3 z-[20000] lg:top-3">
			<div
				class="flex max-w-42 items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-[10px]/3 drop-shadow sm:max-w-md sm:text-xs"
			>
				<div class="min-w-4">
					<CircleAlert size={14} />
				</div>
				<a href="/board/{data.formedFromOrigin}/t/{data.formedFromId}?backTo={page.url.pathname}">
					Location is of the service your train is formed from, which can change last minute
				</a>
			</div>
		</div>
	{/if}
	{#if data.trainPosition}
		<MapTrainIndication
			{category}
			trainBearing={data.trainBearing}
			trainPosition={data.trainPosition}
			isFormedFromTrain={data.isFormedFromTrain}
			showDestination={showDestination ? data.destination.crs : null}
			{color}
			{refreshing}
			{rid}
		/>
	{/if}
	<!-- <Marker
		onclick={(e) => {
			goto(href);
			page.data.id = rid;
			page.data.crs = crs;
			setTimeout(() => {
				goto(href);
				page.data.id = rid;
				page.data.crs = crs;
			}, 50);
		}}
		lngLat={coordsTween.current ?? data.trainPosition}
		class="p-5 "
		zIndex={data.isFormedFromTrain ? 0 : 2000}
		opacity={page.data.crs && page.data.id !== rid ? 0.2 : 1}
	>
		<div class="relative rounded-full bg-background">
			<div
				style:border-color={color}
				style:color
				class={[
					'a relative z-20 flex flex-col items-center justify-center rounded-full border-2 bg-white',
					data.isFormedFromTrain ? 'h-8 w-8 opacity-20' : 'h-9 w-9 opacity-100'
				]}
			>
				<div class="relative">
					{#if refreshing}
						<div
							transition:fade={{ duration: 150 }}
							class="absolute inset-0 flex items-center justify-center"
						>
							<Spinner class="size-20 scale-120" />
						</div>
					{/if}
					<div class={['transition-all', refreshing ? 'scale-60' : 'scale-100']}>
						<TrainFront size={showDestination || data.isFormedFromTrain ? 14 : 18} />
					</div>
				</div>
				{#if showDestination}
					<div class="text-[8px]/3">
						to {data.destination.crs}
					</div>
				{/if}
			</div>

			{#if (!isAtStation || !data.isFormedFromTrain) && data.trainBearing != null}
				<svg
					class={['absolute top-1/2 left-1/2 -z-20']}
					width="20"
					height="20"
					style="
      transform: translate(-50%, -50%)
                 rotate({data.trainBearing}deg)
                 translateY(-{data.isFormedFromTrain && !isAtStation ? 14 : 18}px);
      transform-origin: center;
    "
				>
					<polygon
						points="10,0 0,20 20,20"
						class="fill-background stroke-background"
						stroke-width="2"
					/>
					<polygon
						points="10,0 0,20 20,20"
						class={[data.isFormedFromTrain ? 'opacity-20' : 'opacity-100']}
						fill="white"
						stroke={color}
						stroke-width="2"
					/>
				</svg>
			{/if}
		</div>
	</Marker> -->
{/if}
