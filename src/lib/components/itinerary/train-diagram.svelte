<script lang="ts">
	import dayjs from 'dayjs';
	import { Bus, ClockAlert } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import type { CallingPoint, Operator, SavedTrainServiceInfo, TrainService } from '$lib/types';

	import ChangeNotifier from '../ui/change-notifier.svelte';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';

	let {
		planDep,
		rtDep,
		delay,
		departed,
		planArr,
		rtArr,
		arrived,
		filterDelay,
		from,
		to,
		destination,
		platform,
		isCancelled,
		isCancelledAtFilter,
		operator,
		showDate = false
	}: SavedTrainServiceInfo & { showDate?: boolean } = $props();

	const planDepTime = $derived(dayjs(planDep).format('HH:mm'));
	const rtDepTime = $derived(rtDep ? dayjs(rtDep).format('HH:mm') : null);
	const planArrTime = $derived(dayjs(planArr).format('HH:mm'));
	const rtArrTime = $derived(rtArr ? dayjs(rtArr).format('HH:mm') : null);

	let now = $state(dayjs());

	onMount(() => {
		const interval = setInterval(() => {
			now = dayjs();
		}, 1000);
		return () => clearInterval(interval);
	});

	const duration = $derived.by(() => {
		let arrival = dayjs(planArr);
		let departure = dayjs(planDep);

		if (rtArr && rtDep) {
			arrival = dayjs(rtArr);
			departure = dayjs(rtDep);
		}

		let diff = arrival.diff(departure, 'minutes');

		if (diff > 60 && diff % 60 !== 0) {
			return `${Math.floor(diff / 60)}h ${diff % 60}m`;
		} else if (diff >= 60 && diff % 60 === 0) {
			return `${Math.floor(diff / 60)}h`;
		} else {
			return `${diff}m`;
		}
	});

	const remaining = $derived.by(() => {
		let arrival = dayjs(planArr);

		if (rtArr && rtDep) {
			arrival = dayjs(rtArr);
		}

		const diff = arrival.diff(now, 'minutes');
		if (diff < 0) {
			return null;
		} else if (diff > 60 && diff % 60 !== 0) {
			return `${Math.floor(diff / 60)}h ${diff % 60}m`;
		} else if (diff >= 60 && diff % 60 === 0) {
			return `${Math.floor(diff / 60)}h`;
		} else {
			return `${diff}m`;
		}
	});
</script>

{#if showDate}
	<div class="translate-y-2 border-b border-border px-2 pb-2 text-sm font-medium">
		{dayjs(rtDep ?? planDep).format('ddd DD MMM')}
	</div>
{/if}

<div class="flex items-center">
	<div class="flex min-w-12 justify-end">
		<ChangeNotifier value={delay} class="flex w-max flex-col items-end text-sm">
			{#if isCancelled}
				<div class="text-sm/4 text-danger line-through">{planDepTime}</div>
			{:else if delay === null}
				<div class="text-sm/3">{planDepTime}</div>
				{#if departed}
					<div class="text-[10px]/3">Unknown</div>
				{:else}
					<div class="text-xs/3 text-warning">Delayed</div>
				{/if}
			{:else if planDepTime !== rtDepTime}
				<div class="text-xs/4">{planDepTime}</div>
				<div class="text-sm/3 text-warning">{rtDepTime}</div>
			{:else}
				<div class="text-sm/3 text-good">{planDepTime}</div>
			{/if}
		</ChangeNotifier>
	</div>
	<div class="flex h-16 min-w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow"></div>
		<div class="flex h-1.5 min-w-4" style:background={operator.color}></div>
		<div class="w-1.5 grow" style:background={operator.color}></div>
	</div>

	<div class="min-w-0 grow">
		<div class="flex">
			<div class="grow text-base/6 font-medium">
				{from}
			</div>
			<ChangeNotifier
				value={platform}
				class={[
					'-mr-1 items-center justify-center gap-1 px-1 text-right text-base/5',
					platform === 'BUS' && 'text-sm text-warning'
				]}
			>
				{#if platform === 'BUS'}
					<Bus size={16} /> Bus service
				{:else}
					<span class="text-xs/4 text-muted-foreground sm:text-xs/6">Platform </span>

					{platform !== 'BUS' ? (platform ?? '-') : ''}
				{/if}
			</ChangeNotifier>
		</div>
	</div>
</div>

<div class="flex h-5 items-center">
	<div class="w-12"></div>
	<div class="flex h-5 w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow" style:background={operator.color}></div>
	</div>
	<div class="-mt-1 w-max text-xs">
		<!-- <div class="flex w-max items-center gap-1 pb-0.5 text-xs">
			{#if arrived}
				{#if filterDelay === 0}
					<Check size={14} />
				{:else}
					<ClockAlert size={14} />
				{/if}
				Arrived
				{#if filterDelay !== null}
					{#if filterDelay < 0}
						{-filterDelay}m early
					{:else if filterDelay < 1}
						on time
					{:else}
						{filterDelay}m late
					{/if}
				{/if}
			{:else if departed}
				{#if delay === 0}
					<Check size={14} />
				{:else}
					<ClockAlert size={14} />
				{/if}

				Departed
				{#if delay !== null}
					{#if delay < 0}
						{-delay}m early
					{:else if delay < 1}
						on time
					{:else}
						{delay}m late
					{/if}
				{/if}
			{:else if delay !== null}
				{#if delay === 0}
					<Check size={14} />
				{:else}
					<ClockAlert size={14} />
				{/if}

				Expected
				{#if delay < 0}
					{-delay}m early
				{:else if delay < 1}
					on time
				{:else}
					{delay}m late
				{/if}
			{/if}
		</div> -->
		<ChangeNotifier
			value="{isCancelled}-{destination}"
			class="-mt-1 truncate text-xs/4 text-muted-foreground"
		>
			{#if isCancelled}
				<div class="flex items-center gap-1 text-sm/5 font-medium text-danger">
					<X size={18} /> Cancelled
				</div>
			{:else}
				<div
					class="h-max w-max rounded-sm px-1.5 py-0.5 text-[10px]/3 text-white"
					style:background={operator.color}
				>
					{operator.name}
				</div>

				<div class="min-w-0 grow truncate">
					to
					{destination}
				</div>
			{/if}
		</ChangeNotifier>
		<!-- <div class="w-max text-xs">
			{#if arrived}
				<div class="text-[10px] text-muted-foreground">{duration}</div>
			{:else if departed}
				<div class="text-[10px] text-muted-foreground">
					<span class="text-foreground">{remaining}</span> / {duration} remaining
				</div>
			{:else}
				<div class="text-[10px] text-muted-foreground">{duration}</div>
			{/if}
		</div> -->
	</div>
</div>
<div class="flex h-12 items-center">
	<div class="flex min-w-12 justify-end">
		<ChangeNotifier value={filterDelay} class="flex w-max flex-col items-end text-sm">
			{#if isCancelledAtFilter}
				<div class="text-sm/3 text-danger line-through">{planArrTime}</div>
			{:else if filterDelay === null}
				<div class="text-base/4">{planArrTime}</div>
				<div class="text-xs/3 text-warning">Delayed</div>
			{:else if planArrTime !== rtArrTime}
				<div class="text-xs/4">{planArrTime}</div>
				<div class="text-sm/3 text-warning">{rtArrTime}</div>
			{:else}
				<div class="text-sm/3 text-good">{planArrTime}</div>
			{/if}
		</ChangeNotifier>
	</div>
	<div class="flex h-full w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow" style:background={operator.color}></div>
		<div class="flex h-1.5 min-w-4" style:background={operator.color}></div>

		<div class="w-1.5 grow"></div>
	</div>
	<div class="grow font-medium">
		<div class="text-base/5">
			{to}
		</div>
		<ChangeNotifier value={isCancelledAtFilter && !isCancelled}>
			{#if isCancelledAtFilter && !isCancelled}
				<div class="text-xs/4 font-medium text-danger">Cancelled</div>
			{/if}
		</ChangeNotifier>
	</div>
</div>
