<script lang="ts">
	import { paneHeight } from '$lib/state/map.svelte';
	import { X } from 'lucide-svelte';
	import Fuse from 'fuse.js';
	import format from 'format-fuse.js';

	import { untrack, type Snippet } from 'svelte';
	import { crossfade, fade, scale } from 'svelte/transition';
	import AllStations from '$lib/data/stations.json';
	import { browser } from '$app/environment';
	import Highlight from './highlight.svelte';
	import type { TransitionEventHandler } from 'svelte/elements';

	let {
		trigger,
		key,
		class: className,
		selected = $bindable(null),
        onSelect = ()=>{},
	}: {
		trigger?: Snippet<
			[{send:typeof send, receive:typeof receive, selected: { stationName: string; crsCode: string } | null, onclick: ()=>void}]
		>;
		class?: string;
		key: string;
		selected?: string | null;
        onSelect?: (crs: string) => void,
	} = $props();

	let active = $state(false);
	let value = $state('');
	let elm: HTMLInputElement;

	const [send, receive] = crossfade({ duration: 200 });
	let beforeBreak: 'top' | 'middle' | 'bottom' | null = null;

	function openSearch() {
		active = true;
		beforeBreak = paneHeight.break !== 'bottom' ? paneHeight.break : 'middle';
		paneHeight.break = 'top';
		setTimeout(() => elm.focus(), 50);
	}

	function closeSearch() {
		active = false;
		paneHeight.break = beforeBreak ?? 'middle';
	}

	const fuzzySearch = $derived(
		new Fuse(AllStations, {
			keys: ['stationName', 'crsCode'],
			includeMatches: true,
			includeScore: true
		})
	);

	function submit(crs: string) {
		selected = crs;
        onSelect(crs);
		closeSearch();
	}

	const selectedStation = $derived(
		selected ? AllStations.find((station) => station.crsCode === selected) : null
	);

	const results: { item: { stationName: string; crsCode: string } }[] = $derived(
		fuzzySearch.search(value ?? '').slice(0, 5)
	);
	const formatted = $derived(browser ? format(results) : []);
</script>

<div class={className}>
	{#if !active}
		{#if trigger}
			{@render trigger?.({send, receive, selected: selectedStation ?? null, onclick: () => openSearch()})}
		{:else}
			<button
				out:send|global={{ key }}
				in:receive|global={{ key }}
				onclick={() => openSearch()}
				class="border w-full text-left border-border px-4 h-14 flex flex-col justify-center rounded-lg drop-shadow-sm bg-background"
			>
				{#if selectedStation}
					<div class="text-lg/5 font-semibold">{selectedStation.crsCode}</div>
					<div class="text-xs/4 text-zinc-500">
						{selectedStation.stationName}
					</div>
				{:else}
					{key}
				{/if}
			</button>
		{/if}
	{/if}
</div>

{#if active}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submit(results[0]?.item.crsCode);
		}}
		transition:fade={{ duration: 200 }}
		class={['fixed bg-background inset-0 rounded-t-xl z-10000 transition-all']}
	>
		<div class="pt-6 p-4 flex gap-2">
			<input
				bind:this={elm}
				bind:value
				autofocus
		
				out:send|global={{ key }}
				in:receive|global={{ key }}
				type="text"
				placeholder="Search for a station..."
				class="p-3 px-4 bg-background w-full border border-border rounded-lg drop-shadow-xs"
			/>
			<button class="w-10 flex items-center justify-center" onclick={() => closeSearch()}
				><X /></button
			>
		</div>
		<div class="py-4 px-2">
			{#if formatted.length}
				{#each formatted as result, i (results[i].item.crsCode)}
					<button
						type={i === 0 ? 'submit' : 'button'}
						onclick={() => submit(results[i].item.crsCode)}
						class="border-border flex h-14 w-full items-center border-b px-4 text-left last:border-none"
					>
						<div>
							<div class="text-xl">
								<Highlight value={(result as any).stationName} />
							</div>
							<div class="text-xs">
								<Highlight value={(result as any).crsCode} />
							</div>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</form>
{/if}
