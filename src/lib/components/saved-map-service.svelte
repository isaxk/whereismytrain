<script lang="ts">
	import type { ServiceMapData, TrainService } from '$lib/types';
	import { onMount } from 'svelte';
	import MapService from './map-service.svelte';
	import { servicesSub } from '$lib/state/services-subscriber';

	let { rid, crs, filter = null } = $props();

	let serviceData: TrainService | null = $state(null);
	let mapData: ServiceMapData | null = $state(null);

	async function getServiceData() {
		const response = await fetch(`/api/service/${rid}/${crs}`);
		const data = await response.json();
		return data;
	}

	function refresh() {
		getServiceData().then(async (data) => {
			serviceData = data;
			const response = await fetch(`/api/mapdata`, {
				method: 'POST',
				body: JSON.stringify({ locations: data.locations }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const resData = await response.json();
			mapData = resData;
		});
	}

	onMount(() => {
		refresh();
		const unsubscribe = servicesSub.subscribe(rid, crs, filter, async (s) => {
			serviceData = s;
			console.log('map-service', rid, crs, filter);
			const response = await fetch(`/api/mapdata`, {
				method: 'POST',
				body: JSON.stringify({ locations: s.locations }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const resData = await response.json();
			mapData = resData;
		});
		return () => unsubscribe();
	});
</script>

{#if serviceData && mapData}
	<MapService {rid} {serviceData} {mapData} {crs} filter={filter ?? null} />
{/if}
