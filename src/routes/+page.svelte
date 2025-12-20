<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '$lib/components/search/search.svelte';
	import { mapData, paneHeight } from '$lib/state/map.svelte';
	import { BellRing, ChevronRight, Pin, X } from 'lucide-svelte';
	import AllStations from '$lib/data/stations.json';
	import { pinned, saved } from '$lib/state/saved.svelte';
	import SavedTrain from '$lib/components/home/saved-train.svelte';
	import { onMount } from 'svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Button from '$lib/components/ui/button/button.svelte';
	import PinnedBoardItem from '$lib/components/home/pinned-board-item.svelte';

	let from = $state(null);
	let to = $state(null);

	onMount(() => {
		const clear = servicesSub.init();
		setTimeout(() => {
			servicesSub.forceRefresh();
		}, 200);
		return () => clear();
	});
</script>

<svelte:head>
	<title>Where is my train?</title>
</svelte:head>

<div class="flex w-full flex-col">
	<div class="border-b-border bg-background sticky top-0 z-20 rounded-t-xl p-4 pt-6">
		<div class="text-3xl font-bold">Where is my train?</div>
		<div class="flex gap-2 *:text-blue-400 *:underline">
			<a href="/about">About & Data Sources</a>
			<a href="https://github.com/isaxk/whereismytrain">GitHub</a>
			<a href="https://www.isaxk.com">isaxk.com</a>
		</div>
	</div>

	<div class="border-b-border bg-muted/40 w-full border-y p-4">
		<div class="grid w-full max-w-full grid-cols-[1fr_32px_1fr] items-center gap-2 pb-4">
			<Search class="" key="from" bind:selected={from}></Search>
			<div class="flex justify-center">
				<ChevronRight />
			</div>
			<Search class="" key="to" bind:selected={to}></Search>
		</div>
		<a
			aria-disabled={from && from !== to}
			onclick={() => {
				paneHeight.break = 'middle';
			}}
			href={from && from !== to ? (to ? `/board/${from}?to=${to}&offset=0` : `/board/${from}?offset=0`) : '#'}
		>
			<Button class="w-full">Go</Button>
		</a>
	</div>
	<div class="w-full pt-4">
		<div class="flex items-center gap-2 px-4 py-4">
			<Pin size={20} />
			<div class="grow text-2xl font-medium">Pinned boards</div>
		</div>
		<div class="border-border flex w-full flex-col border-b">
			{#if pinned.value.length === 0}
				<div
					class="text-muted-foreground border-border flex items-center border-t px-4 py-2 text-sm"
				>
					No pinned boards. Tap the pin on a board page to pin it here.
				</div>
			{:else}
				{#each pinned.value as item (item.fromCrs + item.toCrs)}
					<div
						class="odd:bg-muted/20 border-border border-t"
						transition:fly={{ duration: 200, x: -100 }}
						animate:flip={{ duration: 200 }}
					>
						<PinnedBoardItem {...item} />
					</div>
				{/each}
			{/if}
		</div>
	</div>
	<div class="pt-4">
		<div class="flex items-center gap-2 px-4 py-4">
			<BellRing size={20} />
			<div class="grow text-2xl font-medium">Subscribed trains</div>
			{#if refreshing.current}
				<Spinner />
			{/if}
		</div>
		<div class="flex flex-col">
			{#if saved.value.length === 0}
				<div
					class="text-muted-foreground border-border flex items-center border-t px-4 py-2 text-sm"
				>
					No subscribed trains. Tap the bell on a service page to subscribe to it and receive
					notifications.
				</div>
			{:else}
				{#each saved.value as item (item.id + item.filterCrs + item.focusCrs + item.subscriptionId)}
					<div
						class="even:bg-muted/20 border-border border-t px-4"
						transition:fly={{ duration: 200, x: -100 }}
						animate:flip={{ duration: 200 }}
					>
						<SavedTrain data={item} />
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
