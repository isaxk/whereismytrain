<script lang="ts">
	import Input from '../ui/input/input.svelte';
	import AllStations from '$lib/data/stations.json';
	import Fuse from 'fuse.js';
	import format from 'format-fuse.js';
	import { browser } from '$app/environment';
	import Highlight from '../search/highlight.svelte';
	import { tick } from 'svelte';

	let {
		value = $bindable(null),
		placeholder = ''
	}: {
		value: string | null;
		placeholder: string;
	} = $props();

	let focused = $state(false);
	let q = $state('');

	const fuzzySearch = $derived(
		new Fuse(AllStations, {
			keys: ['stationName', 'crsCode'],
			includeMatches: true,
			includeScore: true
		})
	);

	const results: { item: { stationName: string; crsCode: string } }[] = $derived(
		fuzzySearch.search(q ?? '').slice(0, 5)
	);
	const formatted = $derived(browser ? format(results) : []);
</script>

<form class="relative w-full">
	<Input
		class={!focused && value ? 'text-transparent placeholder:opacity-0' : ''}
		bind:value={q}
		{placeholder}
		onfocus={() => {
			q = '';
			value = null;
			focused = true;
		}}
		onblur={() => {
			setTimeout(() => {
				focused = false;
			}, 250);
		}}
	/>
	{#if !focused && value}
		<div
			class="pointer-events-none absolute inset-2 z-50 flex items-center gap-1 rounded px-1 font-semibold"
		>
			{value} -
			<span class="text-xs font-normal">
				{AllStations.find((station) => station.crsCode === value)?.stationName}</span
			>
		</div>
	{/if}
	{#if focused}
		<div
			class="absolute top-10 z-60 min-h-max w-full rounded-lg border border-border bg-background drop-shadow"
		>
			{#each formatted as item, i (i)}
				<button
					type={i === 0 ? 'submit' : 'button'}
					onclick={() => {
						value = results[i].item.crsCode;
						q = results[i].item.crsCode;
						focused = false;
					}}
					class="flex h-10 w-full items-center border-b border-border px-2 text-left last:border-none"
				>
					<div class="w-12 text-lg font-semibold">
						<Highlight value={item.crsCode} />
					</div>
					<div class="text-sm">
						<Highlight value={item.stationName} />
					</div>
				</button>{/each}
		</div>
	{/if}
</form>
