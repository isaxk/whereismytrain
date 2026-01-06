<script lang="ts">
	import { page } from '$app/state';
	import { saved } from '$lib/state/saved.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { BoardItem, DestinationOrigin, Operator, SavedTrain } from '$lib/types';
	import dayjs from 'dayjs';
	import { ArrowDownRight, Bus, Check, ClockAlert, GitCompareArrowsIcon, X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ChangeNotifier from './change-notifier.svelte';
	import Button from '../ui/button/button.svelte';
	import { size } from 'zod';
	import { cn, dayjsFromHHmm } from '$lib/utils';

	let {
		crs,
		id,
		href,
		trainid,
		uid,
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
		class: className = '',
		filterName = null,
		connection = null
	}: {
		crs: string;
		id: string;
		href: string;
		trainid?: string;
		uid?: string;
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
		class?: string;
		connection?: {
			schTime: number;
			rtTime: number | null;
			name: string;
			status: string;
			acrossLondon: boolean;
		} | null;
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
	class={cn([
		'flex w-full flex-col justify-center rounded  text-left',
		connection && connection.rtTime && connection.status === 'ok'
			? 'h-28 gap-1'
			: filter
				? 'h-22 gap-1'
				: 'h-22',
		className
	])}
>
	<div class="flex h-max items-center gap-2">
		<div class="font-medium">
			{#if trainid && uid}
				{trainid} - {uid}
			{/if}
			{#if isToday}
				{planDep || 'N/A'}
			{:else}
				{planDep}

				<span class="text-sm text-muted-foreground">
					- {dayjs(date).format('ddd DD MMM')}
				</span>
			{/if}
		</div>
		<div class="text-[11px]">
			{#if isCancelled}
				<ChangeNotifier changed={oldisCancelled !== isCancelled} class="font-medium text-danger"
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
					class="font-medium text-warning"
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
					class="font-medium text-warning"
				>
					<ClockAlert size={14} />
					Delayed
				</ChangeNotifier>
			{/if}
		</div>
		<div class="grow"></div>
		<ChangeNotifier
			changed={oldPlatform !== platform}
			class={[
				'-mr-1 items-center justify-center px-1 text-right',
				platform === 'BUS' && 'text-sm text-warning'
			]}
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
				<div class="flex items-center gap-0.5 pr-4 text-xs/4 font-light text-muted-foreground">
					<div class="truncate font-medium">
						{focus.replace(' (Intl)', '')}
					</div>
					to
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
			class="h-max truncate rounded-md px-1.5 py-0.5 text-[10px] text-white"
			style:background={operator.color}
		>
			{operator.name}
		</div>
	</div>

	{#if filter}
		<div class="flex items-center gap-2">
			{#if filter.isCancelled}
				{#if !isCancelled}
					<ChangeNotifier
						changed={oldFilter?.isCancelled !== filter.isCancelled}
						class="pb-2 text-xs text-danger"
					>
						<X size={14} /> Cancelled to {filter.name}
					</ChangeNotifier>
				{/if}
			{:else}
				<div class="flex min-w-0 gap-1 overflow-hidden text-xs text-nowrap text-muted-foreground">
					<ArrowDownRight size={16} />
					<div class="truncate">
						{#if filter.arrived}
							Arrived
						{:else}
							Expected arrival
						{/if}

						{#if !destination.some((d) => d.name === filter?.name)}
							at
							<span class="font-medium text-foreground">
								{#if filter?.name && filter?.name?.includes('London ') && filter.name !== 'London Bridge'}
									{filter?.name.replace('London ', '').replace(' (Intl)', '')}
								{:else}
									{filter?.name?.replace(' (Intl)', '')}
								{/if}
							</span>
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
		{#if connection && connection.rtTime && connection.status === 'ok'}
			<div class="flex items-center gap-1 pl-0.5 text-xs text-muted-foreground">
				<GitCompareArrowsIcon size={12} />
				{connection.rtTime}m to change to the {connection.name}
			</div>
		{/if}
	{:else if isFilterCancelled && !isCancelled}
		<div class="flex items-center gap-0 text-xs">
			<ChangeNotifier
				changed={oldisFilterCancelled !== isFilterCancelled}
				class="text-xs text-danger"
			>
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
