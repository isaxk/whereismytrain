<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { CircleAlert } from 'lucide-svelte';
	import { Tween } from 'svelte/motion';
	import { LineLayer, GeoJSON } from 'svelte-maplibre';

	import type { MapDataLocationGroup } from '$lib/types';

	import MapTrainIndication from './map-train-indication.svelte';

	import type { Feature } from 'geojson';
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
		filter,
		to = null,
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
		filter?: string | null;
		to?: string | null;
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
		<div class="fixed top-safe-top right-3 z-20000 lg:top-3">
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
			opacity={!to || data.lineLocations.some((l) => l.crs === to && l.crs !== null)
				? data.isFormedFromTrain
					? 0.5
					: 1
				: 0.2}
			trainBearing={data.trainBearing}
			trainPosition={data.trainPosition}
			isFormedFromTrain={data.isFormedFromTrain}
			showDestination={showDestination ? data.destination.crs : null}
			{color}
			{refreshing}
			{rid}
		/>
	{/if}
{/if}
