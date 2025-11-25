<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '$lib/components/search.svelte';
	import { mapData, paneHeight } from '$lib/state/map.svelte';
	import { ChevronRight } from 'lucide-svelte';
	import AllStations from '$lib/data/stations.json';

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
</script>

<div class="">
	<div class="border-b-border rounded-t-xl border-b p-4 pt-6">
		<div class="text-3xl font-bold">Where is my train?</div>
		<div class="flex *:text-blue-400 hover:underline">
			<a href="/about">About & data sources</a>
		</div>
	</div>

	<div class="p-4">
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
				from && from !== to ? 'bg-primary text-primary-invert' : 'bg-foreground-muted text-white'
			]}
			onclick={() => {
				paneHeight.break = 'middle';
			}}
			href={from && from !== to ? (to ? `/board/${from}?to=${to}` : `/board/${from}`) : '#'}>Go</a
		>
	</div>
</div>
