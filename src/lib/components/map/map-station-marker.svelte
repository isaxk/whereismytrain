<script lang="ts">
	import { page } from '$app/state';

	import clsx from 'clsx';
	import { fade } from 'svelte/transition';
	import { Marker } from 'svelte-maplibre';

	import { highlightedStation, paneHeight } from '$lib/state/map.svelte';
	import { refreshing } from '$lib/state/services-subscriber.svelte';
	import type {
		CallingPoint,
		Category,
		MapDataLocationGroup,
		Operator,
		ServiceLocation,
		ServiceLocationWithCoords
	} from '$lib/types';

	import TrainIconByCategory from '../train/train-icon-by-category.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let {
		cp,
		locations,
		tiplocData,
		operator,
		isFilterNotOnSplit = false,
		category
	}: {
		cp: CallingPoint;
		locations: MapDataLocationGroup[];
		tiplocData: {
			crs: string | null;
			tiploc: string;
			coords: [number, number];
		}[];
		operator: Operator;
		isFilterNotOnSplit: boolean;
		category: 'standard' | 'express' | 'sleeper' | 'bus' | 'metro';
	} = $props();

	const tiploc = $derived(tiplocData?.find((t) => t.tiploc === cp.tiploc));

	const isTrainAtStation = $derived(
		tiploc &&
			locations.some(
				(l) =>
					l.trainPosition?.[0] === tiploc.coords[0] && l.trainPosition?.[1] === tiploc.coords[1]
			)
	);

	const isOfFormedFrom = $derived(
		tiploc &&
			(locations.find(
				(l) =>
					l.trainPosition?.[0] === tiploc?.coords[0] && l.trainPosition?.[1] === tiploc?.coords[1]
			)?.isFormedFromTrain ??
				false)
	);
</script>

{#if tiploc?.coords}
	<Marker
		onclick={() => {
			highlightedStation.current = (cp.crs ?? '') + cp.rtDepDate;
			if (paneHeight.break !== 'top') {
				paneHeight.break = 'top';
			}
		}}
		lngLat={tiploc?.coords}
		zIndex={isTrainAtStation ? 2000 : cp.order === 'further' ? 50 : 100}
		class={clsx(['rounded-full bg-white dark:bg-black'])}
	>
		<div
			style:background={isTrainAtStation ? '#fff' : operator.color}
			style:color={isTrainAtStation ? operator.color : '#fff'}
			style:border-color={operator.color}
			class={[
				'flex flex-col items-center justify-center overflow-hidden rounded-full text-[10px]/3 text-white',
				isTrainAtStation ? 'h-10 w-10 border-2' : 'h-7 w-7',
				(cp.order === 'origin' ||
					cp.order === 'previous' ||
					cp.order === 'further' ||
					isFilterNotOnSplit ||
					cp.isDestination) &&
				!isTrainAtStation
					? 'opacity-50'
					: '',

				cp.isCancelled && 'line-through'
			]}
		>
			{#if isTrainAtStation}
				<div
					class={['flex w-full grow items-center justify-center pt-0.5 text-white']}
					style:background={operator.color}
				>
					{cp.crs}
				</div>
				<div
					class={[
						'relative flex grow flex-col items-center justify-center pb-0.5',
						isOfFormedFrom ? 'h-2 min-h-2 opacity-50' : 'h-5 min-h-5'
					]}
				>
					<div
						class={['rounded-full transition-all', refreshing.current ? 'scale-60' : 'scale-100']}
					>
						<TrainIconByCategory {category} size={isOfFormedFrom ? 10 : 14} />
					</div>
					{#if refreshing.current}
						<div
							transition:fade={{ duration: 150 }}
							class="absolute inset-0 flex items-center justify-center"
						>
							<Spinner class="size-20 scale-120" />
						</div>
					{/if}
				</div>
			{:else}
				<div class={['text-current', cp.isCancelled && 'text-red-200 line-through']}>
					{cp.crs}
				</div>
			{/if}
		</div>
	</Marker>
{/if}
