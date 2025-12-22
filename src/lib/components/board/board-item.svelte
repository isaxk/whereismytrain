<script lang="ts">
	import { page } from '$app/state';
	import { saved } from '$lib/state/saved.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { BoardItem, DestinationOrigin, Operator, SavedTrain } from '$lib/types';
	import dayjs from 'dayjs';
	import { Bus, Check, ClockAlert, X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ChangeNotifier from './change-notifier.svelte';
	import Button from '../ui/button/button.svelte';
	import { size } from 'zod';
	import { dayjsFromHHmm } from '$lib/utils';

	let {
		crs,
		id,
		href,
		isCancelled,
		isFilterCancelled = false,
		rtDep,
		planDep,
		delay = null,
		departed,
		focus = null,
		destination,
		platform,
		filter,
		operator,
		date = null,
		isToday = true,
		filterName = null
	}: {
		crs: string;
		id: string;
		href: string;
		isCancelled: boolean;
		isFilterCancelled?: boolean;
		rtDep: string | null;
		planDep: string;
		delay?: number | null;
		departed: boolean;
		focus?: string | null;
		destination: DestinationOrigin[];
		platform: string | null;
		filter?: {
			name: string | null;
			planArr: string;
			rtArr: string | null;
			isCancelled: boolean;
			arrived: boolean;
		} | null;
		operator: Operator;
		date?: string | null;
		isToday?: boolean;
		filterName?: string | null;
	} = $props();

	let oldRtDep = $state(rtDep);
	let oldDeparted = $state(departed);
	let oldPlatform = $state(platform);
	let oldisCancelled = $state(isCancelled);
	let oldisFilterCancelled = $state(isFilterCancelled);
	let oldFilter = $state(filter);

	explicitEffect(
		() => {
			console.log('effect');
			setTimeout(() => {
				oldRtDep = rtDep;
				oldDeparted = departed;
				oldPlatform = platform;
				oldisCancelled = isCancelled;
				oldisFilterCancelled = isFilterCancelled;
				oldFilter = filter;
			}, 2500);
		},
		() => [rtDep, departed, platform, isCancelled, isFilterCancelled, filter]
	);
</script>

{#snippet figure(image)}
	<figure>
		<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
		<figcaption>{image.caption}</figcaption>
	</figure>
{/snippet}

<a
	{href}
	class={['flex w-full flex-col justify-center rounded  text-left', filter ? 'h-30 gap-1' : 'h-22']}
>
	<div class="flex h-max items-center gap-2">
		<div class="font-medium">
			{#if isToday}
				{planDep || 'N/A'}
			{:else}
				<span class="text-muted-foreground">
					{dayjs(date).format('ddd DD MMM')} -
				</span>

				{planDep}
			{/if}
		</div>
		<div class="text-[11px]">
			{#if isCancelled}
				<ChangeNotifier changed={oldisCancelled !== isCancelled} class="text-danger"
					><X size={14} /> Cancelled</ChangeNotifier
				>
			{:else if rtDep == planDep}
				<ChangeNotifier changed={oldDeparted !== departed || oldRtDep !== rtDep} class="text-good">
					<Check size={14} />
					{#if departed}
						Departed on time
					{:else}
						On time
					{/if}
				</ChangeNotifier>
			{:else if rtDep}
				<ChangeNotifier
					changed={oldDeparted !== departed || oldRtDep !== rtDep}
					class="text-warning"
				>
					<ClockAlert size={14} />
					{#if departed}
						Departed
					{:else}
						Expected
					{/if}
					{rtDep}
				</ChangeNotifier>
			{:else}
				<ChangeNotifier
					changed={oldDeparted !== departed || oldRtDep !== rtDep}
					class="text-warning"
				>
					<ClockAlert size={14} />
					Delayed
				</ChangeNotifier>
			{/if}
		</div>
		<div class="grow"></div>
		<ChangeNotifier
			changed={oldPlatform !== platform}
			class="-mr-1 items-center justify-center px-1 text-right"
		>
			{#if platform === 'BUS'}
				<Bus size={16} /> Bus service
			{:else}
				<span class="text-xs text-muted-foreground">Platform </span>

				{platform !== 'BUS' ? (platform ?? '-') : ''}
			{/if}
		</ChangeNotifier>
	</div>
	<div class="flex items-start">
		<div class="min-w-0 grow overflow-hidden">
			{#if focus}
				<div class="text-xs/3 font-light text-muted-foreground">
					<span class="font-medium">
						{focus}
					</span> to
				</div>
			{/if}
			<div class={['truncate text-base/5 font-semibold']}>
				{destination.map((d) => d.name).join(', ')}
			</div>
			{#if destination[0].via}
				<div class="text-xs/3 font-light text-muted-foreground">
					{destination[0].via}
				</div>
			{/if}
		</div>
		<div
			class="mt-0.5 h-max rounded-md px-1.5 py-0.5 text-[10px] text-white"
			style:background={operator.color}
		>
			{operator.name}
		</div>
	</div>

	{#if filter}
		<div class="flex items-center gap-0">
			{#if filter.isCancelled}
				{#if !isCancelled}
					<ChangeNotifier
						changed={oldFilter?.isCancelled !== filter.isCancelled}
						class="text-danger"
					>
						<X size={14} /> Cancelled to {filter.name}
					</ChangeNotifier>
				{/if}
			{:else}
				<div class="flex min-w-0 gap-1 overflow-hidden text-xs text-nowrap">
					<div class="truncate">
						{#if filter.arrived}
							Arrived
						{:else}
							Expected arrival
						{/if}
						{#if filter.name !== destination[0].name}
							at {filter.name}
						{/if}
					</div>
					{#if filter.planArr === filter.rtArr}
						<div class="flex items-center gap-0.5 text-good">
							<Check size={12} />
							{filter.rtArr}
						</div>
					{:else}
						<div class="flex items-center gap-1 text-warning">
							<ClockAlert size={12} />
							{filter.rtArr ?? 'Unknown'}
						</div>
					{/if}
				</div>
			{/if}
			<div class="grow"></div>
		</div>
	{:else if isFilterCancelled && !isCancelled}
		<div class="flex items-center gap-0 text-xs">
			<ChangeNotifier changed={oldisFilterCancelled !== isFilterCancelled} class="text-danger">
				<X size={14} /> Cancelled to {filterName}
			</ChangeNotifier>
		</div>
	{/if}
</a>
<!-- <div class="flex">
	<Button size="sm" onclick={() => (departed = true)}>Depart</Button>
	<Button size="sm" onclick={() => (rtDep = dayjsFromHHmm(rtDep).add(5, 'minutes').format('HH:mm'))}
		>Delay</Button
	>
	<Button size="sm" onclick={() => (isCancelled = !isCancelled)}>Cancel</Button>
	<Button size="sm" onclick={() => (platform = Math.floor(Math.random() * 10).toString())}
		>Platform</Button
	>
	<Button size="sm" onclick={() => (isFilterCancelled = !isFilterCancelled)}>Filter Cancel</Button>
</div> -->
