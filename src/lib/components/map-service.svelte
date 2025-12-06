<script lang="ts">
	import { TrainFront } from 'lucide-svelte';
	import { Marker } from 'svelte-maplibre';
	import MapLocationGroup from './map-location-group.svelte';
	import type { ServiceMapData, TrainService } from '$lib/types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let {
		serviceData,
		mapData,
		crs,
		rid
	}: { serviceData: TrainService; mapData: ServiceMapData; crs: string; rid: string } = $props();
</script>

{#if mapData}
	<div>
		{#each mapData.locations as group, index (index)}
			<MapLocationGroup
				{rid}
				{crs}
				href="/board/{crs}/t/{rid}?returnToHome=1"
				isAtStation={false}
				showDestination={mapData.locations.reduce(
					(acc, curr) => acc + (curr.trainPosition ? 1 : 0),
					0
				) > 1}
				color={serviceData.operator.color}
				{index}
				data={group}
			/>
		{/each}
		{#if page.data.id === rid}
			{#each serviceData.callingPoints as cp, i (cp.tiploc + i)}
				{@const tiploc = mapData?.tiplocData?.find((t) => t.tiploc === cp.tiploc)}
				{#if tiploc?.coords}
					{@const isTrainAtStation = mapData.locations.some(
						(l) =>
							l.trainPosition?.[0] === tiploc.coords[0] && l.trainPosition?.[1] === tiploc.coords[1]
					)}
					<Marker
						onclick={() => {
							goto(`/board/${crs}/t/${rid}`);
						}}
						lngLat={tiploc?.coords}
						zIndex={isTrainAtStation ? 2000 : 100}
					>
						<div
							style:background={isTrainAtStation ? '#fff' : serviceData.operator.color}
							style:color={isTrainAtStation ? serviceData.operator.color : '#fff'}
							style:border-color={serviceData.operator.color}
							class={[
								'flex flex-col items-center justify-center overflow-hidden rounded-full text-[10px]/3',
								isTrainAtStation ? 'h-14 w-9 border-2' : 'h-7 w-7 ',

								cp.isCancelled ? 'line-through opacity-30' : ''
							]}
						>
							{#if isTrainAtStation}
								<div
									class="flex h-full w-full grow items-center justify-center pt-1 text-white"
									style:background={serviceData.operator.color}
								>
									{cp.crs}
								</div>
								<div class="flex h-full grow flex-col items-center justify-center pb-1">
									<TrainFront size={16} />
									<!-- <div class="text-[7px]/3">
									to {mapData.locations.find(
										(l) =>
											l.trainPosition?.[0] === tiploc.coords[0] &&
											l.trainPosition?.[1] === tiploc.coords[1]
									)?.destination.crs}
								</div> -->
								</div>
							{:else}
								{cp.crs}
							{/if}
						</div>
					</Marker>
				{/if}
			{/each}
		{/if}
	</div>
{/if}
