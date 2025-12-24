<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { SavedTrain } from '$lib/types';
	import {
		ArrowUpRight,
		BellOff,
		Bus,
		Check,
		ClockAlert,
		GitCompareArrowsIcon,
		Trash,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import BoardItem from '$lib/components/board/board-item.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { unsubscribeToTrain } from '$lib/notifications';
	import { derived } from 'svelte/store';
	import dayjs from 'dayjs';
	import { dayjsFromHHmm } from '$lib/utils';
	import AlertCard from '../ui/alert-card.svelte';
	import { londonTerminals } from '$lib/data/favourites';
	import Button from '../ui/button/button.svelte';

	let { data }: { data: SavedTrain } = $props();

	let service = $derived(data.service);
	let lastRefreshed = $state(null);

	const refreshed = $derived.by(() => {
		// console.log(Date.now() - data.lastRefreshed);
		if (data.lastRefreshed && Date.now() - data.lastRefreshed > 20000) {
			return false;
		}
		return true;
	});

	async function refetch() {
		const res = await fetch(`/api/service/${data.id}/${data.focusCrs}`);
		if (res.ok) {
			const s = await res.json();
			if (s) {
				service = s;
				if (saved.value.find((s) => s.id === data.id)) {
					saved.value.find((s) => s.id === data.id)!.service = s;
				}
			} else {
				saved.value = saved.value.filter((s) => s.id !== data.id);
			}
		} else {
			return null;
		}
	}

	function remove() {
		if (data.subscriptionId) {
			unsubscribeToTrain(data.subscriptionId);
		}
		saved.value = saved.value.filter((s) => s.id !== data.id);
	}

	onMount(() => {
		// refetch();
		const unsubscribe = servicesSub.subscribe(data.id, data.focusCrs, data.filterCrs, (s) => {
			if (s) {
				service = s;
				const item = saved.value.findIndex((s) => s.id === data.id);
				if (item !== -1) {
					saved.value[item] = {
						...saved.value[item],
						service: s,
						lastRefreshed: Date.now()
					};
				}
			}
		});
		const interval = setInterval(() => {
			now = dayjs();
		}, 100);
		return () => {
			unsubscribe();
			clearInterval(interval);
		};
	});

	const focus = $derived(service?.callingPoints?.find((cp) => cp.crs === data.focusCrs));
	const filter = $derived(service?.callingPoints?.find((cp) => cp.crs === data.filterCrs));
	let now = $state(dayjs());

	const timeUntilDeparture = $derived(focus ? dayjs(focus.rtDepDate).diff(now, 'minute') : 0);

	const connection = $derived.by(() => {
		if (!filter) return null;

		console.log(`\n---${service.title}, ${data.focusCrs} to ${filter.crs}---`);

		const connection = saved.value.find((s) => {
			console.log(`${s.service.title}, ${s.focusCrs} to ${s.filterCrs}`);
			// if (s.id === service.rid) return false;

			const acrossLondon =
				londonTerminals.includes(s.focusCrs) &&
				londonTerminals.includes(filter.crs ?? '') &&
				s.focusCrs !== filter.crs;

			if (s.focusCrs !== filter.crs) return false;

			console.log('connection');

			const connectionFocus = s.service.callingPoints.find((cp) => cp.crs === s.focusCrs);
			console.log('connectionFocus', connectionFocus);
			if (connectionFocus) {
				const schDiff =
					connectionFocus.times.plan.dep && filter.times.plan.arr
						? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
								dayjsFromHHmm(filter.times.plan.arr),
								'minute'
							)
						: null;
				console.log(schDiff);
				if (schDiff && schDiff < 45 && schDiff > 1) return true;
			}
			return false;
		});
		if (!connection) return null;
		const acrossLondon =
			londonTerminals.includes(connection.focusCrs) &&
			londonTerminals.includes(filter.crs ?? '') &&
			connection.focusCrs !== filter.crs;
		console.log('acrossLondon', acrossLondon);
		const connectionFocus = connection.service.callingPoints.find(
			(cp) => cp.crs === connection.focusCrs
		);
		if (connectionFocus) {
			const schDiff =
				connectionFocus.times.plan.dep && filter.times.plan.arr
					? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
							dayjsFromHHmm(filter.times.plan.arr),
							'minute'
						)
					: null;
			const rtDiff =
				connectionFocus.times.rt.dep && filter.times.rt.arr
					? dayjsFromHHmm(connectionFocus.times.rt.dep).diff(
							dayjsFromHHmm(filter.times.rt.arr),
							'minute'
						)
					: null;

			let status = 'ok';
			if (!rtDiff || !schDiff) {
				status = 'warning';
			} else if (acrossLondon) {
				console.log(rtDiff);
				if (acrossLondon && rtDiff <= 20) {
					status = 'impossible';
				} else if (acrossLondon && rtDiff <= 30) {
					status = 'warning';
				}
			} else if (schDiff <= 5) {
				if (rtDiff < 1) {
					status = 'impossible';
				} else if (rtDiff < 4) {
					status = 'warning';
				}
			} else if (schDiff <= 10) {
				if (rtDiff < 1) {
					status = 'impossible';
				} else if (rtDiff <= 5) {
					status = 'warning';
				}
			} else if (rtDiff < schDiff) {
				if (rtDiff < 1) {
					status = 'impossible';
				} else if (rtDiff <= 8) {
					status = 'warning';
				}
			}

			if (rtDiff && schDiff) {
				return {
					rtTime: rtDiff,
					schTime: schDiff,
					name: `${connectionFocus.times.plan.dep}`,
					status,
					acrossLondon
				};
			} else if (schDiff) {
				return {
					schTime: schDiff,
					rtTime: null,
					name: `${connectionFocus.times.plan.dep}`,
					status,
					acrossLondon
				};
			}
		}

		return null;
	});

	$inspect('connection', connection);
</script>

<div
	class={[
		'relative py-4 transition-all duration-300',
		!refreshed && 'opacity-40',
		refreshing.current && !refreshed && 'animate-pulse'
	]}
>
	<!-- {#if !focus?.departed}
		<div class="flex items-center gap-1">
			{#if timeUntilDeparture < 1}
				<ArrowUpRight size={20} /> Departing soon
			{:else}
				<ArrowUpRight size={20} />Departing in {timeUntilDeparture}m
			{/if}
		</div>
	{/if} -->
	{#if focus}
		<BoardItem
			href={`/board/${data.focusCrs}/t/${data.id}?to=${data.filterCrs}&backTo=/`}
			id={data.id}
			planDep={focus?.times.plan.dep ?? 'N/A'}
			rtDep={focus?.times.rt.dep ?? null}
			departed={focus.departed}
			isCancelled={focus?.isCancelled}
			focus={focus.name}
			destination={service.destination}
			platform={focus.platform}
			crs={focus.crs ?? ''}
			operator={data.service.operator}
			isToday={data.service.isToday ?? false}
			date={data.service.date}
			{connection}
			filter={filter
				? {
						name: filter.name,
						planArr: filter.times.plan.arr ?? 'N/A',
						rtArr: filter.times.rt.arr ?? null,
						isCancelled: filter.isCancelled,
						arrived: filter.arrived
					}
				: null}
		/>
	{/if}
	{#if connection && connection.schTime}
		{#if !connection?.rtTime}
			<AlertCard status="minor" class="mt-2">
				Connection to the {connection.name} may no longer be possible
			</AlertCard>
		{:else if connection.status === 'impossible'}
			<AlertCard status="major" class="mt-2">
				{#if connection.rtTime < 1}
					Connection to the {connection.name} no longer possible
				{:else}
					{connection.rtTime}m to change to the {connection.name} (likely impossible)
				{/if}
			</AlertCard>
		{:else if connection.status === 'warning'}
			<AlertCard status="minor" class="mt-2">
				{connection.rtTime}m to change to the {connection.name}
			</AlertCard>
		{/if}
	{/if}
	<Button variant="outline" class="absolute right-0 bottom-4" size="icon-sm"><X /></Button>
</div>
