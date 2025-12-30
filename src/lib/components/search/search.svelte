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
	import Popular from '../home/popular.svelte';

	let {
		trigger,
		key,
		origin = null,
		class: className,
		selected = $bindable(null),
		onSelect = () => {}
	}: {
		trigger?: Snippet<
			[
				{
					send: typeof send;
					receive: typeof receive;
					selected: { stationName: string; crsCode: string } | null;
					onclick: () => void;
				}
			]
		>;
		class?: string;
		key: string;
		selected?: string | null;
		origin?: string | null;
		onSelect?: (crs: string) => void;
	} = $props();

	let active = $state(false);
	let value = $state('');
	let elm: HTMLInputElement;

	const [send, receive] = crossfade({ duration: 200 });
	let beforeBreak: 'top' | 'middle' | 'bottom' | null = null;

	function openSearch() {
		value = '';
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

<!-- z -->
{#if !active}
	{#if trigger}
		{@render trigger?.({
			send,
			receive,
			selected: selectedStation ?? null,
			onclick: () => openSearch()
		})}
	{:else}
		<button
			out:send|global={{ key }}
			in:receive|global={{ key }}
			onclick={() => openSearch()}
			class="group/input-group flex h-12 flex-col justify-center overflow-hidden rounded-md border border-input bg-background px-4 text-left shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30"
		>
			{#if selectedStation}
				<div class="text-base/4 font-semibold">{selectedStation.crsCode}</div>
				<div class="h-max min-h-4 w-full max-w-full truncate text-xs/4 text-zinc-500">
					{selectedStation.stationName}
				</div>
			{:else}
				{key}
			{/if}
		</button>
	{/if}
{/if}

{#if active}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			submit(results[0]?.item.crsCode);
		}}
		transition:fade={{ duration: 200 }}
		class={['fixed inset-0 z-10000 rounded-t-xl bg-background transition-all']}
	>
		<div class="flex gap-2 p-4 pt-6">
			<input
				bind:this={elm}
				bind:value
				autofocus
				out:send|global={{ key }}
				in:receive|global={{ key }}
				type="text"
				placeholder="Search for a station..."
				class="w-full rounded-lg border border-border bg-background p-3 px-4 drop-shadow-xs"
			/>
			<button class="flex w-10 items-center justify-center" onclick={() => closeSearch()}
				><X /></button
			>
		</div>
		<div class="px-2">
			{#if formatted.length}
				{#each formatted as result, i (results[i].item.crsCode)}
					<button
						type={i === 0 ? 'submit' : 'button'}
						onclick={() => submit(results[i].item.crsCode)}
						class="flex h-10 w-full items-center border-b border-border px-2 text-left last:border-none"
					>
						<div class="w-12 text-lg font-semibold">
							<Highlight value={(result as any).crsCode} />
						</div>
						<div class="text-sm">
							<Highlight value={(result as any).stationName} />
						</div>
					</button>
				{/each}
			{:else if origin}
				<Popular crs={origin}>
					{#snippet children(name, crs, i)}
						<button
							type={i === 0 ? 'submit' : 'button'}
							onclick={() => submit(crs)}
							class="flex h-10 w-full items-center border-b border-border px-2 text-left last:border-none"
						>
							<div class="w-12 text-lg font-semibold">
								{crs}
							</div>

							<div class="text-sm">
								{name}
							</div>
						</button>
					{/snippet}
				</Popular>
			{/if}
		</div>
	</form>
{/if}
