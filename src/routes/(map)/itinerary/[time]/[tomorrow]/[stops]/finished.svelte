<script lang="ts">
	import TrainDiagram from '$lib/components/itinerary/train-diagram.svelte';
	import { londonTerminals } from '$lib/data/favourites';
	import type { CallingPoint, TrainService, SavedTrain as SavedTrainType } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';
	import { Bell, GitCompareArrowsIcon } from 'lucide-svelte';
	import tube from '$lib/assets/tube.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';
	import { saved } from '$lib/state/saved.svelte';
	import dayjs from 'dayjs';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { goto } from '$app/navigation';

	let {
		services
	}: { services: { service: TrainService; focus: CallingPoint; filter: CallingPoint }[] } =
		$props();

	let saving = $state(false);

	async function add() {
		saving = true;
		const promises = services.map(async (s) => {
			console.log(s.service.rid);
			if (s.filter?.crs === null || s.focus?.crs === null) return;
			// loading = true;
			let newItem: SavedTrainType = {
				id: crypto.randomUUID(),
				service_id: s.service.rid,
				focusCrs: s.focus.crs,
				filterCrs: s.filter.crs,
				service: s.service,
				lastRefreshed: Date.now(),
				subscriptionId: null,
				originalArrival:
					s.service.callingPoints.find((cp) => cp.order === 'filter')?.times.plan.arr ?? null
			};
			const subscriptionId = await subscribeToTrain(
				s.service.rid,
				s.filter.crs,
				s.filter.crs,
				s.service.destination.map((d) => d.name).join(', ')
			);
			// console.log('subscriptionId', subscriptionId);
			if (subscriptionId === null) {
				// failedToSubscribe = true;
				// console.log(failedToSubscribe);
			}

			const existingID = saved.value.find(
				(item) => item.service_id === newItem.service_id
			)?.subscriptionId;
			if (existingID) {
				unsubscribeToTrain(existingID);
			}

			saved.value = [
				...saved.value.filter((item) => item.service_id !== newItem.service_id),
				{ ...newItem, subscriptionId }
			].toSorted((a, b) => {
				const aFocus = a.service.callingPoints.find((cp) => cp.order === 'focus');
				const bFocus = b.service.callingPoints.find((cp) => cp.order === 'focus');
				if (!aFocus || !bFocus) return 0;

				if (!aFocus?.times.plan.dep || !bFocus?.times.plan.dep) return 0;
				const diff = dayjs(a.service.date).diff(b.service.date);
				// console.log('diff', diff);
				return diff === 0 ? 0 : diff > 0 ? 1 : -1;
			});
			// loading = false;
		});
		await Promise.all(promises);
		saving = false;
		goto('/');
	}
</script>

{#each services as leg, i (i)}
	{@const next = services[i + 1]?.focus}
	{@const rawDiff = dayjsFromHHmm(leg.filter.times.rt.arr ?? leg.filter.times.plan.arr).diff(
		dayjsFromHHmm(leg.focus.times.rt.dep ?? leg.focus.times.plan.dep),
		'm'
	)}
	{@const duration =
		rawDiff >= 60
			? rawDiff % 60 === 0
				? `${Math.floor(rawDiff / 60)}h`
				: `${Math.floor(rawDiff / 60)}h ${rawDiff % 60}m`
			: `${rawDiff % 60}m`}
	{@const rawRemaining = dayjsFromHHmm(leg.filter.times.rt.arr ?? leg.filter.times.plan.arr).diff(
		dayjs(),
		'm'
	)}
	{@const remaining =
		rawRemaining >= 60
			? rawRemaining % 60 === 0
				? `${Math.floor(rawRemaining / 60)}h`
				: `${Math.floor(rawRemaining / 60)}h ${rawRemaining % 60}m`
			: `${rawRemaining % 60}m`}

	<div class="pb-8">
		<TrainDiagram
			service={leg.service}
			focus={leg.focus}
			filter={leg.filter}
			{duration}
			{remaining}
		/>
		{#if next}
			{@const schDiff = dayjsFromHHmm(next.times.plan.dep!).diff(
				dayjsFromHHmm(leg.filter.times.plan.arr),
				'm'
			)}
			{@const rtDiff = dayjsFromHHmm(next.times.rt.dep!).diff(
				dayjsFromHHmm(leg.filter.times.rt.arr),
				'm'
			)}
			{@const acrossLondon =
				londonTerminals.includes(leg.filter.crs) &&
				londonTerminals.includes(next.crs) &&
				leg.filter.crs !== next.crs}

			<div class="relative h-5">
				<div class="absolute -top-2 right-0 left-0 flex h-18 items-center">
					<div class="w-12"></div>
					<div class="flex h-16 w-10 flex-col items-center justify-center gap-0.5">
						<div class="w-px grow rounded-full bg-muted-foreground"></div>
						{#if acrossLondon}
							<img src={tube} alt="Transport for London" class="h-6 w-6 p-1 dark:invert" />
						{:else}
							<GitCompareArrowsIcon size={15} />
						{/if}
						<div class="w-px grow rounded-full bg-muted-foreground"></div>
					</div>
					<div class="grow text-xs">
						{#if schDiff !== rtDiff}
							<span class="line-through opacity-80">{schDiff}m</span>
						{/if}
						{rtDiff}m to change {#if acrossLondon}via Underground{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/each}
<Button onclick={add} class="w-full">
	{#if saving}
		<Spinner />
	{:else}
		<Bell />
		Add trains
	{/if}
</Button>
