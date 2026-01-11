<script lang="ts">
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import type { ServiceMapData, TrainService } from '$lib/types';

	import MapService from './map-service.svelte';

	let { rid, crs, filter = null } = $props();

	let serviceData: TrainService | null = $state(null);
	let mapData: ServiceMapData | null = $state(null);

	async function getServiceData() {
		const response = await fetch(`/api/service/${rid}/${crs}`);
		const data = await response.json();
		return data;
	}

	let refreshingMap = $state(false);

	function refresh() {
		getServiceData().then(async (data) => {
			serviceData = data;
			refreshingMap = true;
			const response = await fetch(`/api/mapdata`, {
				method: 'POST',
				body: JSON.stringify({ locations: data.locations, formedFrom: data.formedFrom }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const resData = await response.json();
			mapData = resData;
			refreshingMap = false;
		});
	}

	let unsubscribe: () => void;

	$effect(() => {
		unsubscribe?.();
		refresh();
		unsubscribe = servicesSub.subscribe(rid, crs, filter, async (s) => {
			serviceData = s;
			// console.log('map-service', rid, crs, filter);
			const response = await fetch(`/api/mapdata`, {
				method: 'POST',
				body: JSON.stringify({ locations: s.locations, formedFrom: s.formedFrom }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const resData = await response.json();
			mapData = resData;
		});
		return () => unsubscribe?.();
	});
</script>

{#if serviceData && mapData}
	<MapService
		{rid}
		{serviceData}
		{mapData}
		{crs}
		filter={filter ?? null}
		refreshing={refreshing.current || refreshingMap}
	/>
{/if}
