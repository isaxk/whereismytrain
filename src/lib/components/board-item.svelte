<script lang="ts">
	import { page } from '$app/state';
	import { saved } from '$lib/state/saved.svelte';
	import type { BoardItem, DestinationOrigin, Operator, SavedTrain } from '$lib/types';
	import { Bus, Check, ClockAlert, X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import Page from '../../routes/+page.svelte';

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
		filterName = null
	}: {
		crs: string;
		id: string;
		href: string;
		isCancelled: boolean;
		isFilterCancelled: boolean;
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
		filterName?: string | null;
	} = $props();
</script>

<a
	{href}
	class={[
		'border-border flex w-full flex-col justify-center rounded border-b text-left',
		filter ? 'h-32 gap-1' : 'h-22'
	]}
>
	<div class="flex h-max items-center gap-2">
		<div class="font-medium">
			{planDep || 'N/A'}
		</div>
		<div class="text-[11px]">
			{#if isCancelled}
				<div class="flex items-center gap-1 text-red-600"><X size={14} /> Cancelled</div>
			{:else if rtDep == planDep}
				<div class="text-good flex items-center gap-1">
					<Check size={14} />
					{#if departed}
						Departed on time
					{:else}
						On time
					{/if}
				</div>
			{:else if rtDep}
				<div class="flex items-center gap-1 text-yellow-600">
					<ClockAlert size={14} />
					{#if departed}
						Departed
					{:else}
						Expected
					{/if}
					{rtDep}
				</div>
			{:else}
				<div class="flex items-center gap-1 text-yellow-600">
					<ClockAlert size={14} />
					Delayed
				</div>
			{/if}
		</div>
		<div class="grow"></div>
		<div class="flex items-center justify-center">
			<div class="min-w-18 text-right">
				<span class="text-muted-foreground text-xs">Platform </span>

				{platform !== 'BUS' ? (platform ?? '-') : ''}
			</div>
			{#if platform === 'BUS'}
				<div class="flex items-center gap-1 text-xs text-yellow-600">
					<Bus size={16} /> Rail Replacement Bus
				</div>
			{/if}
		</div>
	</div>
	<div class="flex items-start">
		<div class="min-w-0 grow overflow-hidden">
			{#if focus}
				<div class="text-muted-foreground text-xs/3 font-light">
					<span class="font-medium">
						{focus}
					</span> to
				</div>
			{/if}
			<div class={['truncate text-base/5 font-semibold']}>
				{destination.map((d) => d.name).join(', ')}
			</div>
			{#if destination[0].via}
				<div class="text-muted-foreground text-xs/3 font-light">
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
					<div class="text-danger flex items-center gap-1 text-xs">
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
						<div class="text-good flex items-center gap-0.5">
							<Check size={12} />
							{filter.rtArr}
						</div>
					{:else}
						<div class="text-warning flex items-center gap-1">
							<ClockAlert size={12} />
							{filter.rtArr ?? 'Unknown'}
						</div>
					{/if}
				</div>
			{/if}
			<div class="grow"></div>
		</div>
	{:else if isFilterCancelled}
		<div class="flex items-center gap-0">
			<div class="text-danger flex items-center gap-1 pt-0.5 text-xs">
				<X size={14} /> Cancelled to {filterName}
			</div>
		</div>
	{/if}
</a>
