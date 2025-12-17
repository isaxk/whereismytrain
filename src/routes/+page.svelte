<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '$lib/components/search.svelte';
	import { mapData, paneHeight } from '$lib/state/map.svelte';
	import { BellRing, ChevronRight } from 'lucide-svelte';
	import AllStations from '$lib/data/stations.json';
	import { saved } from '$lib/state/saved.svelte';
	import SavedTrain from '$lib/components/saved-train.svelte';
	import { onMount } from 'svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import Spinner from '$lib/components/spinner.svelte';

	let from = $state(null);
	let to = $state(null);

	// $effect(() => {
	// 	if (from && to) {
	// 		const origin = AllStations.find((s) => s.crs === from);
	// 		const destination = AllStations.find((s) => s.crs === to);
	// 		if(origin && destination)
	// 		mapData.board = [[origin?.long, origin?.lat], [destination?.long, destination?.lat]];
	// 	} else if (from) {
	// 		const origin = AllStations.find((s) => s.crs === from);
	// 		if(origin)
	// 		mapData.board = [[origin?.long, origin?.lat]];
	// 	}
	// });

	// async function refreshSavedService(id: string, focus: string, filter: string) {
	// 	const response = await fetch(`/api/service/${id}/${focus}/${filter}`);
	// 	if (response.ok) {
	// 		const data = await response.json();
	// 		if (data) {
	// 			const index = saved.value.findIndex((s) => s.id === id);
	// 			if (index !== -1) {
	// 				saved.value[index].service = data;
	// 			}
	// 		} else {
	// 			saved.value = saved.value.filter((s) => s.id !== id);
	// 		}
	// 	}
	// }

	// function refresh() {
	// 	saved.value.forEach((item) => {
	// 		refreshSavedService(item.id, item.focusCrs, item.filterCrs);
	// 	});
	// }

	onMount(() => {
		const clear = servicesSub.init();
		return () => clear();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="border-b-border bg-background sticky top-0 z-20 rounded-t-xl border-b p-4 pt-6">
		<div class="text-3xl font-bold">Where is my train?</div>
		<div class="flex *:text-blue-400 hover:underline">
			<a href="/about">About & data sources</a>
		</div>
	</div>

	<div class="border-b-border border-b px-4 pb-4">
		<div class="flex items-center gap-2 pb-4">
			<Search class="h-14 w-full" key="from" bind:selected={from}></Search>
			<div class="flex min-w-8 justify-center">
				<ChevronRight />
			</div>
			<Search class="h-14 w-full" key="to" bind:selected={to}></Search>
		</div>
		<a
			aria-disabled={from && from !== to}
			class={[
				'block rounded-lg py-2 text-center',
				from && from !== to ? 'bg-primary text-primary-invert' : 'bg-muted text-white'
			]}
			onclick={() => {
				paneHeight.break = 'middle';
			}}
			href={from && from !== to ? (to ? `/board/${from}?to=${to}` : `/board/${from}`) : '#'}>Go</a
		>
	</div>
	<div class="px-4">
		<div class="flex items-center gap-2">
			<BellRing size={20} />
			<div class="grow text-2xl font-medium">Subscribed trains</div>
			<div class="h-6">
				{#if refreshing.current}
					<Spinner />
				{/if}
			</div>
		</div>
		{#each saved.value as item}
			<SavedTrain data={item} />
		{/each}
	</div>
</div>
