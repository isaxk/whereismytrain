<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { SavedTrain } from '$lib/types';
	import { BellOff, Bus, Check, ClockAlert, Trash, X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import BoardItem from '$lib/components/board/board-item.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { unsubscribeToTrain } from '$lib/notifications';
	import { derived } from 'svelte/store';
	import dayjs from 'dayjs';

	let { data }: { data: SavedTrain } = $props();

	let service = $derived(data.service);
	let lastRefreshed = $state(null);

	const refreshed = $derived.by(() => {
		console.log(Date.now() - data.lastRefreshed);
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
		// const interval = setInterval(() => {
		// 	if (lastRefreshed && Date.now() - lastRefreshed! > 20000) {
		// 		refreshed = false;
		// 	}
		// }, 200);
		return () => {
			unsubscribe();
			// clearInterval(interval);
		};
	});

	const focus = $derived(service?.callingPoints?.find((cp) => cp.crs === data.focusCrs));
	const filter = $derived(service?.callingPoints?.find((cp) => cp.crs === data.filterCrs));
</script>

<div
	class={[
		'relative transition-all duration-300',
		!refreshed && 'opacity-40',
		refreshing.current && !refreshed && 'animate-pulse'
	]}
>
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
	<button
		onclick={remove}
		class="absolute right-0 bottom-0 flex gap-1 pr-2 pb-5 text-xs text-red-500"
		><BellOff size={15} /> Remove</button
	>
</div>
