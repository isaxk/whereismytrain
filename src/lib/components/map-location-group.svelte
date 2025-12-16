<script lang="ts">
	import type { MapDataLocationGroup, ServiceMapData } from '$lib/types';
	import { LineLayer, MapLibre, GeoJSON, Marker, Popup, AttributionControl } from 'svelte-maplibre';
	import { AlertCircle, CircleAlert, TrainFront } from 'lucide-svelte';
	import type { Feature } from 'geojson';
	import { Tween } from 'svelte/motion';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	let {
		href,
		crs,
		rid,
		data,
		index,
		color,
		showDestination,
		isAtStation,
		filter
	}: {
		href: string;
		crs: string;
		rid: string;
		data: MapDataLocationGroup;
		index: number;
		color: string;
		showDestination: boolean;
		isAtStation: boolean;
		filter?: string | null;
	} = $props();

	const coordinates = $derived(data.lineLocations.map((l) => l.coords));

	const unCancelled = $derived(
		data.lineLocations.filter((c, i) => {
			const prevCP = data.lineLocations.find((l, j) => l.isCallingPoint && j < i);
			const nextCP = data.lineLocations.find((l, j) => l.isCallingPoint && j > i);

			const prevCpIsCancelled = prevCP?.isCancelled ?? false;
			const nextCpIsCancelled = nextCP?.isCancelled ?? false;

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
		console.log('filtered', filtered);
		const focus = filtered.findIndex((l) => l.crs === crs);
		if (focus !== -1 && filtered.find((l) => l.crs === crs)) {
			let coords = [];

			if (filter) {
				const filterIndex = filtered.findIndex((l) => l.crs === filter);

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

	$inspect(data);
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
			'line-opacity': 0.2
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
			'line-width': 5,
			'line-color': color,
			'line-opacity': page.data.crs && page.data.id !== rid ? 0.2 : 1
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
			'line-opacity': page.data.crs && page.data.id !== rid ? 0.1 : 0.4
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
		<div class="top-safe-top fixed right-3 z-[20000] lg:top-3">
			<div
				class="bg-background flex max-w-96 items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px]/3 drop-shadow sm:text-base"
			>
				<CircleAlert size={14} />
				Location indicator is of the service your train is formed from.
			</div>
		</div>
	{/if}
	<Marker
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
		<div class="bg-background relative rounded-full">
			<div
				style:border-color={color}
				style:color
				class={[
					'a relative z-20 flex  flex-col items-center justify-center rounded-full border-2 bg-white',
					data.isFormedFromTrain ? 'h-8 w-8 opacity-20' : 'h-9 w-9 opacity-100'
				]}
			>
				<TrainFront size={showDestination || data.isFormedFromTrain ? 14 : 18} />
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
						class="stroke-background fill-background"
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
	</Marker>
{/if}
