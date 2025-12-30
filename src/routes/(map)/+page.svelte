<script lang="ts">
	import { goto } from '$app/navigation';
	import Search from '$lib/components/search/search.svelte';
	import { mapData, paneHeight } from '$lib/state/map.svelte';
	import {
		ArrowUpRight,
		BellRing,
		Bug,
		ChevronRight,
		CircleHelp,
		CircleQuestionMark,
		Download,
		EllipsisIcon,
		EllipsisVerticalIcon,
		HelpCircle,
		LightbulbIcon,
		Pin,
		SearchIcon,
		Settings,
		User,
		X
	} from 'lucide-svelte';
	import AllStations from '$lib/data/stations.json';
	import { pinned, pwa, saved } from '$lib/state/saved.svelte';
	import SavedTrain from '$lib/components/home/saved-train.svelte';
	import { onMount } from 'svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import PinnedBoardItem from '$lib/components/home/pinned-board-item.svelte';
	import { Tabs } from 'bits-ui';
	import TrainSearch from '$lib/components/home/train-search.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Install from '$lib/components/home/install.svelte';
	import { iOS } from '$lib/utils.js';
	import Github from '$lib/components/icons/github.svelte';

	let { data } = $props();

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

<div
	class="fixed top-0 right-0 left-0 flex h-18 w-full flex-col justify-center rounded-t-2xl border-b border-border bg-background px-4"
>
	<div class="flex items-center justify-start gap-2">
		<div class="grow text-3xl font-bold">Where is my train?</div>
		{#if refreshing.current}
			<Spinner />
		{/if}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
				<EllipsisVerticalIcon />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<a href="/about">
					<DropdownMenu.Item>
						<CircleQuestionMark />
						About and data sources
					</DropdownMenu.Item>
				</a>
				<a href="https://github.com/isaxk/whereismytrain">
					<DropdownMenu.Item>
						<Github />
						Github
					</DropdownMenu.Item>
				</a>
				<a href="https://github.com/isaxk/whereismytrain/issues">
					<DropdownMenu.Item>
						<Bug />
						Report a bug
					</DropdownMenu.Item>
				</a>
				<a href="https://github.com/isaxk/whereismytrain/issues">
					<DropdownMenu.Item>
						<LightbulbIcon />
						Suggest a feature
					</DropdownMenu.Item>
				</a>
				<a href="https://www.isaxk.com">
					<DropdownMenu.Item>
						<User />
						isaxk.com
					</DropdownMenu.Item>
				</a>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<!-- <div class="grow"></div>
	<div><SearchIcon /></div>
	<div><Settings /></div> -->
</div>
<div class="pt-18"></div>
<div class="w-full p-4 pb-0">
	{#if !pwa.value && iOS()}
		<Item.Root variant="outline" class="mb-4">
			<Item.Content>
				<Item.Title>Install the app</Item.Title>
				<Item.Description>Get notifications for your trains, and more convenience</Item.Description>
			</Item.Content>
			<Item.Actions>
				<Install>
					{#snippet trigger()}
						<Button><Download /> Install</Button>
					{/snippet}
				</Install>
			</Item.Actions>
		</Item.Root>
	{/if}

	<!-- <div class="grid w-full max-w-full grid-cols-[1fr_32px_1fr_64px] items-center gap-2">
		<Search class="" key="from" bind:selected={from}></Search>
		<div class="flex justify-center">
			<ChevronRight />
		</div>
		<Search class="" key="to" bind:selected={to}></Search>
		<Button
			onclick={() => {
				paneHeight.break = 'middle';
			}}
			href={from && from !== to
				? to
					? `/board/${from}?to=${to}&offset=0`
					: `/board/${from}?offset=0`
				: '#'}
			class="h-12 w-full">Go</Button
		>
	</div> -->
	<TrainSearch />
</div>
<div class="flex flex-col">
	{#if saved.value.length === 0}
		<div class="flex flex-col items-center justify-center gap-1 p-4 pt-10 text-muted-foreground">
			<div class="font-semibold">No trains added yet</div>
			<div class="text-sm">Tap the search bar above to find trains</div>
		</div>
	{:else}
		{#each saved.value as item, index (item.id)}
			<div
				class="border-b border-border px-4 last:border-none even:bg-muted/20"
				transition:fly={{ duration: 200, x: -100 }}
				animate:flip={{ duration: 200 }}
			>
				<SavedTrain data={item} {index} />
			</div>
		{/each}
	{/if}
</div>

<!--
<div class="w-full pt-4">
	<div class="flex items-center gap-2 px-4 py-4">
		<Pin size={20} />
		<div class="grow text-2xl font-medium">Pinned boards</div>
	</div>
	<div class="flex w-full flex-col border-b border-border">
		{#if pinned.value.length === 0}
			<div class="flex items-center border-t border-border px-4 py-2 text-sm text-muted-foreground">
				No pinned boards. Tap the pin on a board page to pin it here.
			</div>
		{:else}
			{#each pinned.value as item (item.fromCrs + item.toCrs)}
				<div
					class="border-t border-border odd:bg-muted/20"
					transition:fly={{ duration: 200, x: -100 }}
					animate:flip={{ duration: 200 }}
				>
					<PinnedBoardItem {...item} />
				</div>
			{/each}
		{/if}
	</div>
</div> -->

<!-- <div class="flex w-full flex-col">
	<div class="sticky top-0 z-20 rounded-t-xl border-b-border bg-background p-4 pt-6">
		<div class="text-3xl font-bold">Where is my train?</div>
		<div class="flex gap-2 *:text-blue-400 *:underline">
			<a href="/about">About & Data Sources</a>
			<a href="https://github.com/isaxk/whereismytrain">GitHub</a>
			<a href="https://www.isaxk.com">isaxk.com</a>
		</div>
	</div>

	<div class="w-full border-y border-b-border bg-muted/40 p-4">
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
			href={from && from !== to
				? to
					? `/board/${from}?to=${to}&offset=0`
					: `/board/${from}?offset=0`
				: '#'}
		>
			<Button class="w-full">Go</Button>
		</a>
	</div>
	<div class="w-full pt-4">
		<div class="flex items-center gap-2 px-4 py-4">
			<Pin size={20} />
			<div class="grow text-2xl font-medium">Pinned boards</div>
		</div>
		<div class="flex w-full flex-col border-b border-border">
			{#if pinned.value.length === 0}
				<div
					class="flex items-center border-t border-border px-4 py-2 text-sm text-muted-foreground"
				>
					No pinned boards. Tap the pin on a board page to pin it here.
				</div>
			{:else}
				{#each pinned.value as item (item.fromCrs + item.toCrs)}
					<div
						class="border-t border-border odd:bg-muted/20"
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
					class="flex items-center border-t border-border px-4 py-2 text-sm text-muted-foreground"
				>
					No subscribed trains. Tap the bell on a service page to subscribe to it and receive
					notifications.
				</div>
			{:else}
				{#each saved.value as item (item.id + item.filterCrs + item.focusCrs + item.subscriptionId)}
					<div
						class="border-t border-border px-4 even:bg-muted/20"
						transition:fly={{ duration: 200, x: -100 }}
						animate:flip={{ duration: 200 }}
					>
						<SavedTrain data={item} />
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div> -->
