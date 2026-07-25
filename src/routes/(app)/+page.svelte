<script lang="ts">
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import {
		AlertTriangle,
		Bug,
		CircleQuestionMark,
		Download,
		EllipsisVerticalIcon,
		LightbulbIcon,
		Triangle,
		User,
		TriangleAlert,
		CircleAlert,
		WifiOff,
		CloudAlert,
		Bell
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	import Install from '$lib/components/home/install.svelte';
	import SavedTrain from '$lib/components/home/saved-train.svelte';
	import TrainSearch from '$lib/components/home/train-search.svelte';
	import Github from '$lib/components/icons/github.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { pwa, saved } from '$lib/state/saved.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { iOS } from '$lib/utils.js';
	import { Accordion } from 'bits-ui';
	import TrainDiagram from '$lib/components/itinerary/train-diagram.svelte';
	import SubscriptionProvider from '$lib/components/providers/subscription-provider.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	dayjs.extend(relativeTime);

	let now = $state(dayjs());

	onMount(() => {
		setTimeout(() => {
			servicesSub.forceRefresh();
		}, 200);
	});
</script>

<svelte:head>
	<title>Where is my train?</title>
</svelte:head>

<div
	class="fixed top-0 right-0 left-0 z-10 flex h-18 w-full flex-col justify-center rounded-t-2xl border-b border-border bg-background px-4"
>
	<div class="flex items-center justify-start gap-2">
		<div class="grow text-3xl font-bold">Where is my train?</div>
		<div class="relative flex h-9 items-center">
			{#if refreshing.current}
				<Spinner />
			{:else if refreshing.error === 'Failed to fetch'}
				<div class="text-danger">
					<CloudAlert size={20} />
				</div>
			{:else if refreshing.error}
				<div class="text-red-500"><CircleAlert size={20} /></div>
			{/if}
			{#if refreshing.error === 'Failed to fetch' && saved.value.length > 0 && dayjs(now).diff(dayjs(saved.value[0].lastRefreshed), 's') > 20}
				<div
					class="absolute top-10 -right-11 rounded-md border border-danger bg-background px-1.5 py-0.5 text-xs text-nowrap text-danger"
				>
					Offline. Last refreshed {#key now.toString()}{dayjs(
							saved.value[0].lastRefreshed
						).fromNow()}{/key}
				</div>
			{/if}
		</div>

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

	<TrainSearch />
</div>
<div class="flex flex-col py-4">
	{#if saved.value.filter((item) => !item.service.arrived).length === 0}
		<div class="flex flex-col items-center justify-center gap-1 p-4 py-5 text-muted-foreground">
			<div class="font-semibold">No trains added yet</div>
			<div class="max-w-xs text-center text-sm">
				Tap the search bar above to find trains, and tap the <Bell size={16} class="inline" /> to add
				them here
			</div>
		</div>
	{:else}
		{#if saved.value.some((item) => item.service.arrived)}
			<Accordion.Root type="single" class="px-4 pb-2">
				<Accordion.Item class="group">
					<Accordion.Trigger class={['', buttonVariants({ variant: 'ghost' })]}
						><ChevronDown size={16} class="transition-all group-data-[state=open]:rotate-180" />
						Completed trains</Accordion.Trigger
					>

					<Accordion.Content class="">
						{#each saved.value.filter((item) => item.service.arrived) as item (item.id)}
							<div class="border-b border-border py-2 even:bg-muted/20">
								<svelte:boundary>
									<SubscriptionProvider
										serviceId={item.service_id}
										crs={item.focusCrs}
										filter={item.filterCrs}
									>
										{#snippet children({ onUnsubscribe })}
											<TrainDiagram {...item.service} onRemove={() => onUnsubscribe()} />
										{/snippet}
									</SubscriptionProvider>
									{#snippet failed(e)}
										<div>
											An error occurred loading this subscribed train. Try unsubscribing and
											re-subscribing.
											{e}
										</div>
									{/snippet}
								</svelte:boundary>
							</div>
						{/each}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		{/if}
		{#each saved.value as item, index (item.id)}
			<div class="px-4 even:bg-muted/20">
				<svelte:boundary>
					<SavedTrain data={item} {index} />
					{#snippet failed(e)}
						<div>
							An error occurred loading this subscribed train. Try unsubscribing and re-subscribing.
							{e}
						</div>
						<div class="flex">
							<a
								class="underline"
								href="/board/{item.focusCrs}/t/{item.service_id}?to={item.filterCrs}"
								>Visit train page</a
							>
							<Button
								variant="ghost"
								onclick={() => {
									saved.value = saved.value.filter((i) => i.id !== item.id);
								}}>Remove</Button
							>
						</div>
					{/snippet}
				</svelte:boundary>
			</div>
		{/each}
	{/if}
</div>
