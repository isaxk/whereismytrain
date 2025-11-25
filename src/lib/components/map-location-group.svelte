<script lang="ts">
	import type { MapDataLocationGroup, ServiceMapData } from '$lib/types';
	import { LineLayer, MapLibre, GeoJSON, Marker, Popup, AttributionControl } from 'svelte-maplibre';
	import { TrainFront } from 'lucide-svelte';
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
		isAtStation
	}: {
		href: string;
		crs: string;
		rid: string;
		data: MapDataLocationGroup;
		index: number;
		color: string;
		showDestination: boolean;
		isAtStation: boolean;
	} = $props();

	const coordinates = $derived(
		data.lineLocations
			.filter((c, i) => {
				if (!c.isCancelled) {
					return true;
				}
				const prev = data.lineLocations[i - 1];
				const next = data.lineLocations[i + 1];
				if (prev && !prev.isCancelled && next && !next.isCancelled) {
					return true;
				}
				return false;
			})
			.map((l) => l.coords)
	);

	const primaryCoordinates = $derived.by(() => {
		const filtered = data.lineLocations.filter((l)=>!l.isCancelled)
		const focus = filtered.findIndex((l) => l.crs === crs);
		if (filtered.find((l) => l.crs === crs)) {
			const coords = filtered.slice(focus);
			return coords.map((l) => l.coords);
		} else {
			return [];
		}
	});

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

	const coordsTween = Tween.of(() => data.trainPosition);
</script>

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

{#if data.trainPosition && coordsTween.current}
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
		lngLat={coordsTween.current}
		class="p-5 "
		zIndex={2000}
		opacity={page.data.crs && page.data.id !== rid ? 0.2 : 1}
	>
		<div class="relative">
			<div
				style:border-color={color}
				style:color
				class={[
					'bg-white a relative rounded-full z-20 border-2 w-9 h-9 items-center flex flex-col justify-center'
				]}
			>
				<TrainFront size={showDestination ? 14 : 18} />
				{#if showDestination}
					<div class="text-[8px]/3">
						to {data.destination.crs}
					</div>
				{/if}
			</div>
			{#if !isAtStation && data.trainBearing != null}
				<svg
					class="absolute -z-20 left-1/2 top-1/2"
					width="20"
					height="20"
					style="
      transform: translate(-50%, -50%)
                 rotate({data.trainBearing}deg)
                 translateY(-18px);
      transform-origin: center;
    "
				>
					<polygon points="10,0 0,20 20,20" fill="white" stroke={color} stroke-width="2" />
				</svg>
			{/if}
		</div>
	</Marker>
{/if}
