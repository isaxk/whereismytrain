<script lang="ts">
	import { Bus, ChevronRight, CircleQuestionMark, Dot, Rss, Zap } from '@lucide/svelte/icons';
	import dayjs from 'dayjs';
	import tz from 'dayjs/plugin/timezone';

	import type { RouteResultFocusFilter, RouteResultItem } from '$lib/types';
	import { durationDisplay } from '$lib/utils';

	dayjs.extend(tz);

	let { item }: { item: RouteResultItem } = $props();

	let timeUntilDeparture = dayjs(item.from.planTime).diff(dayjs(), 'minute');
</script>

{#snippet timeDisplay(
	point: RouteResultFocusFilter,
	hideLive: boolean = false,
	planArrivesFirst: boolean = false,
	rtArrivesFirst: boolean = false
)}
	<div class={['min-h-9 min-w-18']}>
		<div
			class={[
				'box-border flex w-max items-center gap-1 font-medium tabular-nums',
				planArrivesFirst && rtArrivesFirst
					? 'rounded bg-good p-1 py-1 text-base/4 text-white'
					: 'text-lg/5'
			]}
		>
			{dayjs(point.planTime).format('HH:mm')}
			{#if planArrivesFirst && rtArrivesFirst}
				<Zap size={16} />
			{/if}
		</div>
		{#if !hideLive}
				{#if point.isCancelled}
					<div class="text-xs/4 font-semibold text-danger">Cancelled</div>
				{:else if point.delay === null}
					<div class="text-xs/4 font-semibold text-warning">Delayed</div>
				{:else if Math.abs(point.delay) >= 1}
					<div class="flex items-center gap-0.5 text-sm/4 text-warning">
						<div class="font-semibold tabular-nums">
							{dayjs(point.rtTime).format('HH:mm')}
						</div>
						<!-- <div class="text-xs">
						({#if point.delay > 0}+{/if}{point.delay}m)
					</div> -->
					</div>
				{:else if timeUntilDeparture < 4 * 60}
					<div class="text-xs/4 font-semibold text-good tabular-nums">On time</div>
				{:else}
					<div class="text-xs/4 font-semibold text-muted-foreground tabular-nums">Scheduled</div>
				{/if}
				{#if rtArrivesFirst}
					<Zap size={16} />
				{/if}
		{/if}
	</div>
{/snippet}

<div class="flex items-center gap-4 px-4 py-4">
	<div class="flex min-w-0 grow flex-col gap-2">
		<div class="flex flex-wrap items-center gap-1 text-sm/3 font-semibold">
			<div
				style:background-color={item.operator.color}
				class="rounded px-1 py-px text-[11px]/4 font-normal text-white"
			>
				{item.operator.name}
			</div>
			to
			{#each item.destination as destination, i (destination + i)}
				<div>
					{#if i > item.destination.length - 2 && item.destination.length > 1}
						<span class="">and</span>
					{/if}
					{destination}{#if i < item.destination.length - 2},{/if}
				</div>
			{/each}
		</div>
		<div class="flex h-9 items-center gap-0">
			<div class="w-full">
				{@render timeDisplay(item.from)}
			</div>
			<div class="flex h-9 justify-center gap-0 pr-2">
				<ChevronRight size={20} />
			</div>
			<div class="w-full">
				{#if item.to}
					{@render timeDisplay(
						item.to,
						item.from.isCancelled,

					)}
				{/if}
			</div>
		</div>
	</div>
	<!-- {#if item.from.rtTime}
		<div class="flex flex-col items-center justify-center">
			<Rss size={18} class="animate-pulse"/>
			<div class="text-sm">{dayjs(item.from.rtTime).diff(dayjs(), 'minutes')} mins</div>
		</div>
	{/if} -->

	{#if !item.from.isCancelled || item.platform === 'BUS'}
		<div
			class={[
				'flex h-12 w-10 flex-col items-center justify-center rounded bg-muted',
				{
					'text-warning': item.platform === 'BUS',
					'bg-muted/75 text-muted-foreground/75':
						item.platform === null || !item.isPlatformConfirmed
				}
			]}
		>
			{#if item.platform === 'BUS'}
				<Bus />
				<div class="text-sm">Bus</div>
			{:else}
				<div class={['text-sm']}>Plat</div>
				<div class="h-5 text-xl/5 font-semibold">
					{#if item.platform}
						{item.platform}
					{:else}
						<CircleQuestionMark size={18} />
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="w-10"></div>
	{/if}
</div>
