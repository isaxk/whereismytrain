<script lang="ts">
	import { TrainFront } from 'lucide-svelte';
	import { Marker } from 'svelte-maplibre';
	import MapLocationGroup from './map-location-group.svelte';
	import type { ServiceMapData, TrainService } from '$lib/types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import Spinner from '../ui/spinner/spinner.svelte';
	import clsx from 'clsx';
	import TrainIconByCategory from '../train/train-icon-by-category.svelte';
	import { highlightedStation, paneHeight } from '$lib/state/map.svelte';

	let {
		serviceData,
		mapData,
		crs,
		filter = null,
		refreshing = false,
		rid
	}: {
		serviceData: TrainService;
		mapData: ServiceMapData;
		crs: string;
		filter?: string | null;
		refreshing: boolean;
		rid: string;
	} = $props();
</script>

{#if mapData}
	<div>
		{#key serviceData.rid}
			{#each mapData.locations as group, index (index)}
				<MapLocationGroup
					{rid}
					{crs}
					{refreshing}
					category={serviceData.category}
					filter={group.lineLocations.some((l) => l.crs === filter)
						? filter
						: group.lineLocations.some((l) => l.crs === crs)
							? (serviceData.callingPoints.find((l) => l.startDivide)?.crs ?? null)
							: null}
					focus={crs}
					to={filter}
					href="/board/{crs}/t/{rid}?{filter ? `to=${filter}&` : ''}backTo=/"
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
		{/key}
		{#if page.data.id === rid}
			{#each serviceData.callingPoints as cp, i (cp.tiploc + i)}
				{@const tiploc = mapData?.tiplocData?.find((t) => t.crs === cp.crs)}
				{#if tiploc?.coords}
					{@const isTrainAtStation = mapData.locations.some(
						(l) =>
							l.trainPosition?.[0] === tiploc.coords[0] && l.trainPosition?.[1] === tiploc.coords[1]
					)}
					{@const isOfFormedFrom = mapData.locations.find(
						(l) =>
							l.trainPosition?.[0] === tiploc.coords[0] && l.trainPosition?.[1] === tiploc.coords[1]
					)?.isFormedFromTrain}
					{@const filterItem = serviceData.callingPoints.find((cp) => cp.order === 'filter')}
					<Marker
						onclick={() => {
							if (page.data.id === rid) {
								highlightedStation.current = cp.crs + cp.rtDepDate;
								if (paneHeight.break !== 'top') {
									paneHeight.break = 'top';
								}
							}
						}}
						lngLat={tiploc?.coords}
						zIndex={isTrainAtStation ? 2000 : cp.order === 'further' ? 50 : 100}
						class={clsx(['rounded-full bg-white dark:bg-black'])}
					>
						<div
							style:background={isTrainAtStation ? '#fff' : serviceData.operator.color}
							style:color={isTrainAtStation ? serviceData.operator.color : '#fff'}
							style:border-color={serviceData.operator.color}
							class={[
								'flex flex-col items-center justify-center overflow-hidden rounded-full text-[10px]/3 text-white',
								isTrainAtStation ? 'h-10 w-10 border-2' : 'h-7 w-7',
								(cp.order === 'origin' ||
									cp.order === 'previous' ||
									cp.order === 'further' ||
									(!filterItem?.inDivision && cp.inDivision) ||
									(cp.isDestination && filter && filter !== cp.crs)) &&
								!isTrainAtStation
									? 'opacity-50'
									: '',

								cp.isCancelled && 'line-through opacity-30'
							]}
						>
							{#if isTrainAtStation}
								<div
									class={['flex w-full grow items-center justify-center pt-0.5 text-white']}
									style:background={serviceData.operator.color}
								>
									{cp.crs}
								</div>
								<div
									class={[
										'relative flex grow flex-col items-center justify-center pb-0.5',
										isOfFormedFrom ? 'h-2 min-h-2 opacity-50' : 'h-5 min-h-5'
									]}
								>
									<div class={['transition-all', refreshing ? 'scale-60' : 'scale-100']}>
										<TrainIconByCategory
											category={serviceData.category}
											size={isOfFormedFrom ? 10 : 14}
										/>
									</div>
									{#if refreshing}
										<div
											transition:fade={{ duration: 150 }}
											class="absolute inset-0 flex items-center justify-center"
										>
											<Spinner class="size-20 scale-120" />
										</div>
									{/if}
									<!-- <div class="text-[7px]/3">
									to {mapData.locations.find(
										(l) =>
											l.trainPosition?.[0] === tiploc.coords[0] &&
											l.trainPosition?.[1] === tiploc.coords[1]
									)?.destination.crs}
								</div> -->
								</div>
							{:else}
								<div class={['text-current', cp.isCancelled && 'text-red-200 line-through']}>
									{cp.crs}
								</div>
							{/if}
						</div>
					</Marker>
				{/if}
			{/each}
		{/if}
	</div>
{/if}
