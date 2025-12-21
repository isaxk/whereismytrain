<script lang="ts">
	import { page } from '$app/state';
	import { saved } from '$lib/state/saved.svelte';
	import type { BoardItem, DestinationOrigin, Operator, SavedTrain } from '$lib/types';
	import dayjs from 'dayjs';
	import { Bus, Check, ClockAlert, X } from 'lucide-svelte';
	import { onMount } from 'svelte';

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
</script>

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
				<div class="flex items-center gap-1 text-danger"><X size={14} /> Cancelled</div>
			{:else if rtDep == planDep}
				<div class="flex items-center gap-1 text-good">
					<Check size={14} />
					{#if departed}
						Departed on time
					{:else}
						On time
					{/if}
				</div>
			{:else if rtDep}
				<div class="flex items-center gap-1 text-warning">
					<ClockAlert size={14} />
					{#if departed}
						Departed
					{:else}
						Expected
					{/if}
					{rtDep}
				</div>
			{:else}
				<div class="flex items-center gap-1 text-warning">
					<ClockAlert size={14} />
					Delayed
				</div>
			{/if}
		</div>
		<div class="grow"></div>
		<div class="flex items-center justify-center">
			{#if platform === 'BUS'}
				<div class="flex items-center gap-1 text-xs text-warning">
					<Bus size={16} /> Bus service
				</div>
			{:else}
				<div class="min-w-18 text-right">
					<span class="text-xs text-muted-foreground">Platform </span>

					{platform !== 'BUS' ? (platform ?? '-') : ''}
				</div>
			{/if}
		</div>
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
					<div class="flex items-center gap-1 text-xs text-danger">
						<X size={14} /> Cancelled to {filter.name}
					</div>
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
		<div class="flex items-center gap-0">
			<div class="flex items-center gap-1 pt-0.5 text-xs text-danger">
				<X size={14} /> Cancelled to {filterName}
			</div>
		</div>
	{/if}
</a>
