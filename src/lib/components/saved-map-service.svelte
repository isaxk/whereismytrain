<script lang="ts">
	import type { ServiceMapData, TrainService } from '$lib/types';
	import MapService from './map-service.svelte';

	let { rid, crs } = $props();

	let serviceData: TrainService | null = $state(null);
	let mapData: ServiceMapData | null = $state(null);

	async function getServiceData() {
		const response = await fetch(`/api/service/${rid}/${crs}`);
		const data = await response.json();
		return data;
	}

	$effect(() => {
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
	});
</script>

{#if serviceData && mapData}
	<MapService {rid} {serviceData} {mapData} {crs} />
{/if}
