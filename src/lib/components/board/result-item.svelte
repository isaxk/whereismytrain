<script lang="ts">
	import type { RouteResultFocusFilter, RouteResultItem } from '$lib/types';
	import dayjs from 'dayjs';
	import { Bus, ChevronRight, CircleQuestionMark, Rss } from 'lucide-svelte';
	import tz from 'dayjs/plugin/timezone';
	import { durationDisplay } from '$lib/utils';

	dayjs.extend(tz);

	let { item }: { item: RouteResultItem } = $props();
</script>

{#snippet timeDisplay(point: RouteResultFocusFilter)}
	<div class="min-w-18">
		<div class="text-lg/5 font-medium tabular-nums">
			{dayjs(point.planTime).format('HH:mm')}
		</div>
		{#if point.isCancelled}
			<div class="text-xs/4 font-semibold text-danger">Cancelled</div>
		{:else if point.delay === null}
			<div class="text-xs/4 font-semibold text-warning">Delayed</div>
		{:else if Math.abs(point.delay) >= 1}
			<div class="text-sm/4 font-semibold text-warning tabular-nums">
				{dayjs(point.rtTime).format('HH:mm')}
			</div>
		{:else}
			<div class="text-xs/4 font-semibold text-good tabular-nums">On time</div>
		{/if}
	</div>
{/snippet}

<div class="flex items-center gap-4 px-4 py-4">
	<div class="flex min-w-0 grow flex-col gap-2">
		<div class="flex flex-wrap items-center gap-1 text-sm/3">
			<div
				style:background-color={item.operator.color}
				class="rounded px-1 py-px text-[11px]/4 text-white"
			>
				{item.operator.name}
			</div>
			<span class="font-semibold">to {item.destination}</span>
		</div>
		<div class="flex items-start gap-0">
			<div class="w-full">
				{@render timeDisplay(item.from)}
			</div>
			<div class="flex justify-center gap-0 pr-2">
				<ChevronRight size={20} />
			</div>
			<div class="w-full">
				{@render timeDisplay(item.to)}
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
	{/if}
</div>
