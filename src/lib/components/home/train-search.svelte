<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, preloadCode } from '$app/navigation';

	import SearchIcon from '@lucide/svelte/icons/search';
	import dayjs from 'dayjs';
	import format from 'format-fuse.js';
	import Fuse from 'fuse.js';
	import { ChevronRight, Clock, X } from 'lucide-svelte';
	import { onMount, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly, scale } from 'svelte/transition';

	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import AllStations from '$lib/data/stations.json';
	import { paneHeight } from '$lib/state/map.svelte';
	import { pinned } from '$lib/state/saved.svelte';
	import { dayjsFromHHmm, t } from '$lib/utils';

	import Highlight from '../search/highlight.svelte';
	import Button from '../ui/button/button.svelte';
	import Label from '../ui/label/label.svelte';
	import Switch from '../ui/switch/switch.svelte';

	import PinnedBoardItem from './pinned-board-item.svelte';
	import Popular from './popular.svelte';

	const { send, receive } = t;

	let from: string | null = $state(null);
	let to: string | null | undefined = $state(undefined);
	let hour: string = $state(dayjs().format('HH'));
	let minute: string = $state(dayjs().format('mm'));
	let tomorrow = $state(false);

	let fromQ = $state('');
	let toQ = $state('');

	let fromInput: HTMLInputElement | null = $state(null);
	let toInput: HTMLInputElement | null = $state(null);
	let hourInput: HTMLInputElement | null = $state(null);
	let minuteInput: HTMLInputElement | null = $state(null);
	let form: HTMLFormElement | null = $state(null);

	// let fromFocused = $state(false);
	let toFocused = $state(false);
	let minuteFocused = $state(false);
	let opened = $state(false);

	const fuzzySearch = $derived(
		new Fuse(AllStations, {
			keys: ['stationName', 'crsCode'],
			includeMatches: true,
			includeScore: true
		})
	);

	const fromResults: { item: { stationName: string; crsCode: string } }[] = $derived(
		fuzzySearch.search(fromQ ?? '').slice(0, 5)
	);
	const toResults: { item: { stationName: string; crsCode: string } }[] = $derived(
		fuzzySearch.search(toQ ?? '').slice(0, 5)
	);
	const fromFormatted = $derived(browser ? format(fromResults) : []);
	const toFormatted = $derived(browser ? format(toResults) : []);

	const href = $derived.by(() => {
		if (from) {
			const offset = dayjsFromHHmm(`${hour}:${minute}`)
				.add(tomorrow ? 1 : 0, 'day')
				.diff(dayjs(), 'minute');
			if (to && hour == dayjs().format('HH') && minute == dayjs().format('mm') && !tomorrow) {
				return `/board/${from}?to=${to}`;
			} else if (to) {
				return `/board/${from}?offset=${offset}&to=${to}`;
			} else if (hour == dayjs().format('HH') && minute == dayjs().format('mm') && !tomorrow) {
				return `/board/${from}`;
			} else {
				return `/board/${from}?offset=${offset}`;
			}
		} else {
			return `#`;
		}
	});

	$effect(() => {
		if (href !== '#') {
			preloadCode(href);
		}
	});

	onMount(() => {
		const interval = setInterval(() => {
			if (opened) {
				window.scrollTo(0, 0);
			}
		}, 50);
		return () => clearInterval(interval);
	});
</script>

{#if opened}
	<form
		transition:scale={{ start: 0.9, opacity: 0, duration: 200 }}
		bind:this={form}
		onblur={() => (opened = false)}
		onsubmit={(e) => {
			console.log(e);
			e.preventDefault();

			if (minuteFocused && minute.length === 2) {
				goto(href);
			} else if ((toFormatted.length > 0 && !to) || (toFocused && toResults.length === 0 && from)) {
				if (toFormatted.length > 0) {
					to = toResults[0].item.crsCode;
					toQ = toResults[0].item.crsCode;
				}
				hourInput?.select();
			} else if (fromFormatted.length > 0 && !from) {
				from = fromResults[0].item.crsCode;
				fromQ = fromResults[0].item.crsCode;
				tick().then(() => {
					toInput?.focus();
				});
			} else if (hour.length === 2 || parseInt(hour) < 10) {
				hour = hour.padStart(2, '0');
				minuteInput?.select();
			} else if (from && to && minuteFocused) {
				goto(href);
			}
		}}
		class={[opened ? 'fixed inset-0 z-1000 rounded-t-2xl bg-background p-4' : '']}
	>
		<div class="-mb-2 flex items-center gap-2">
			<Button variant="outline" size="icon" onclick={() => (opened = false)}><X /></Button>
			<div class="text-xl font-semibold">Find trains...</div>
		</div>

		<div class="flex h-6 items-end justify-end pb-2">
			<div class="flex items-center gap-2">
				<Switch bind:checked={tomorrow} id="tomorrow"></Switch>
				<Label for="tomorrow">Tomorrow</Label>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<div class="w-full" in:receive={{ key: 'find-trains' }} out:send={{ key: 'find-trains' }}>
				<InputGroup.Root class="h-10 gap-0">
					<InputGroup.Input
						bind:ref={fromInput}
						bind:value={fromQ}
						onfocus={async () => {
							await tick();
							paneHeight.break = 'top';
							opened = true;
							// fromFocused = true;
							fromQ = '';
							from = null;
							window.scrollTo({ top: 0 });
						}}
						onkeydown={() => {
							from = null;
						}}
						onblur={async () => {
							await tick();
							// fromFocused = false;
						}}
						autocorrect="off"
						placeholder={[opened ? 'Search for a station...' : 'Find trains...']}
						class={['px-0', from && fromQ === from ? 'w-14 max-w-14 font-semibold' : '']}
					/>
					<div class={[from ? 'opacity-100' : 'hidden ']}>
						<ChevronRight size={20} />
					</div>
					<InputGroup.Input
						class={[
							'px-0',
							from ? 'opacity-100' : 'hidden ',
							to && toQ === to ? ' font-semibold' : ''
						]}
						bind:ref={toInput}
						bind:value={toQ}
						onfocus={async () => {
							await tick();
							opened = true;
							toFocused = true;
							toQ = '';
							to = null;
							window.scrollTo({ top: 0 });
						}}
						onkeydown={(e: KeyboardEvent) => {
							console.log(e.keyCode);
							if (e.keyCode === 8 && toQ.length === 0) {
								e.preventDefault();
								fromInput?.select();
							}
							to = null;
						}}
						autocorrect="off"
						onblur={() => (toFocused = false)}
						placeholder="(optional)"
					/>
					<div class={[from ? 'opacity-100' : 'hidden ']}>
						<Clock size={18} />
					</div>

					<InputGroup.Input
						pattern="\d*"
						class={['max-w-8 min-w-8 px-0', from ? 'opacity-100' : 'hidden ']}
						bind:value={
							() => hour.toString(),
							(v) => {
								const num = v.slice(0, 2).replaceAll(/\D/g, '');
								let maxed = num;
								if (parseInt(num || '0') > 24) {
									maxed = '24';
								} else if (parseInt(num || '0') < 0) {
									maxed = '00';
								}

								hour = maxed.toString();

								if (maxed.length === 2) {
									minuteInput?.select();
								}
							}
						}
						onkeydown={(e: KeyboardEvent) => {
							console.log(e.keyCode);
							if (e.keyCode === 8 && hour.length === 0) {
								e.preventDefault();
								toInput?.select();
							}
						}}
						bind:ref={hourInput}
						maxlength="2"
						placeholder="hh"
					/>
					<div class={[from ? 'opacity-100' : 'hidden ']}>:</div>
					<InputGroup.Input
						pattern="\d*"
						class={['mr-1 -ml-1 max-w-8 min-w-8 px-0', from ? 'opacity-100' : 'hidden ']}
						bind:value={
							() => minute.toString(),
							(v) => {
								const num = v.slice(0, 2).replaceAll(/\D/g, '');
								let maxed = num;
								if (parseInt(num || '0') > 59) {
									maxed = '59';
								} else if (parseInt(num || '0') < 0) {
									maxed = '00';
								}

								minute = maxed.toString();
							}
						}
						onkeydown={(e: KeyboardEvent) => {
							console.log(e.keyCode);
							if (e.keyCode === 8 && minute.length === 0) {
								e.preventDefault();
								hourInput?.select();
							}
						}}
						bind:ref={minuteInput}
						onfocus={() => (minuteFocused = true)}
						onblur={() => (minuteFocused = false)}
						maxlength="2"
						max={59}
						min={0}
						placeholder="mm"
					/>
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
				</InputGroup.Root>
			</div>
			{#if from}
				<Button {href} size="lg" variant="default">Go</Button>
			{/if}
		</div>
		<Button type="submit" class="hidden"></Button>
		{#if opened}
			<div class="py-4">
				{#if !to && from !== null}
					{#if toFormatted.length > 0}
						{#each toFormatted as result, i (i)}
							<button
								type="button"
								onclick={() => {
									to = toResults[i].item.crsCode;
									toQ = toResults[i].item.crsCode;
									hourInput?.select();
								}}
								class="flex h-10 w-full items-center border-b border-border px-2 text-left last:border-none"
							>
								<div class="w-12 text-lg font-semibold">
									<Highlight value={(result as { crsCode: string }).crsCode} />
								</div>
								<div class="text-sm">
									<Highlight value={(result as { stationName: string }).stationName} />
								</div>
							</button>
						{/each}
					{:else}
						<Popular crs={from}>
							{#snippet children(name, crs)}
								<button
									type="button"
									onclick={() => {
										to = crs;
										toQ = crs;
										hourInput?.select();
									}}
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
				{:else if fromFormatted.length > 0 && !from}
					{#each fromFormatted as result, i (i)}
						<button
							type="button"
							onclick={() => {
								from = fromResults[i].item.crsCode;
								fromQ = fromResults[i].item.crsCode;
								tick().then(() => toInput?.focus());
							}}
							class="flex h-10 w-full items-center border-b border-border px-2 text-left last:border-none"
						>
							<div class="w-12 text-lg font-semibold">
								<Highlight value={(result as { crsCode: string }).crsCode} />
							</div>
							<div class="text-sm">
								<Highlight value={(result as { stationName: string }).stationName} />
							</div>
						</button>
					{/each}
				{:else if pinned.value.length === 0}
					<div
						class="flex items-center border-t border-border px-4 py-2 text-sm text-muted-foreground"
					>
						No pinned boards. Tap the pin on a board page to pin it here.
					</div>
				{:else}
					{#each pinned.value as item (item.fromCrs + item.toCrs)}
						<div
							class="border-b border-border last:border-none"
							transition:fly={{ duration: 200, x: -100 }}
							animate:flip={{ duration: 200 }}
						>
							<PinnedBoardItem
								{...item}
								onselect={(f, t) => {
									fromQ = f;
									from = f;
									toQ = t ?? '';
									to = t;
									tick().then(() => hourInput?.select());
								}}
							/>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</form>
{:else}
	<div in:receive={{ key: 'find-trains' }} out:send={{ key: 'find-trains' }}>
		<Button
			variant="outline"
			onclick={() => {
				paneHeight.break = 'top';
				opened = true;
				tick().then(() => {
					fromInput?.focus();
				});
			}}
			class="h-10 w-full justify-start text-muted-foreground"
		>
			<SearchIcon class="text-foreground" />
			Find trains...
		</Button>
	</div>
{/if}
