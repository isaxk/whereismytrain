<script lang="ts">
	import { localStore, pwa, saved } from '$lib/state/saved.svelte';
	import type { TrainService, SavedTrain as SavedTrainType } from '$lib/types';
	import { Bell, BellOff, BellRing, BookmarkIcon, X } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';
	import { Spinner } from '../ui/spinner/index';
	import dayjs from 'dayjs';
	import { dayjsFromHHmm, iOS } from '$lib/utils';
	import Button from '../ui/button/button.svelte';
	import Install from '../home/install.svelte';

	let {
		service,
		crs,
		rid,
		filter,
		focus
	}: {
		service: TrainService;
		crs: string;
		rid: string;
		filter: string | null;
		focus: string;
	} = $props();

	let loading = $state(false);
	let failedToSubscribe = $state(false);

	async function save(filter: string) {
		loading = true;
		let newItem: SavedTrainType = {
			id: rid,
			focusCrs: crs,
			filterCrs: filter,
			service,
			lastRefreshed: Date.now()
		};
		const subscriptionId = await subscribeToTrain(
			rid,
			focus,
			filter,
			service.destination.map((d) => d.name).join(', ')
		);
		console.log('subscriptionId', subscriptionId);
		if (subscriptionId === null) {
			failedToSubscribe = true;
			console.log(failedToSubscribe);
		}
		saved.value = [...saved.value, { ...newItem, subscriptionId }].toSorted((a, b) => {
			const aFocus = a.service.callingPoints.find((cp) => cp.order === 'focus');
			const bFocus = b.service.callingPoints.find((cp) => cp.order === 'focus');
			if (!aFocus || !bFocus) return 0;

			if (!aFocus?.times.plan.dep || !bFocus?.times.plan.dep) return 0;
			const diff = dayjs(a.service.date).diff(b.service.date);
			console.log('diff', diff);
			return diff === 0 ? 0 : diff > 0 ? 1 : -1;
		});
		loading = false;
	}

	function remove() {
		const subscriptionId = saved.value.find((s) => s.id === rid)?.subscriptionId;
		if (subscriptionId) {
			unsubscribeToTrain(subscriptionId);
		}
		saved.value = saved.value.filter((s) => s.id !== rid);
	}

	const afterCallingPoints = $derived.by(() => {
		const withArrivals = service.callingPoints.filter((cp) => cp.times.plan.arr);
		const focus = withArrivals.findIndex((cp) => cp.crs === crs);
		return focus >= 0 ? withArrivals.slice(focus + 1) : withArrivals;
	});

	const firstAfterCallingPointCrs = $derived.by(() => afterCallingPoints[0]?.crs);

	const promptDismissed = localStore<boolean>('saved-prompt-dismissed', false);
	$inspect('promptDismissed', promptDismissed.value);
</script>

{#if !pwa.value && iOS()}
	<Install
		description="You need to install the app to track your trains and receive notifications on them. Don't worry, it doesn't take long!"
	>
		{#snippet trigger()}
			<Button size="icon" class="bg-input/30 hover:bg-input/50" variant="outline">
				<Bell />
			</Button>
		{/snippet}
	</Install>
{:else if saved.value.some((s) => s.id === rid)}
	<Button
		size="icon"
		class="relative bg-input/30 hover:bg-input/50"
		variant="outline"
		onclick={() => remove()}
	>
		{#if saved.value.find((s) => s.id === rid)?.subscriptionId}
			<BellRing fill="currentColor" />
		{:else}
			<BookmarkIcon fill="currentColor" />
			<div
				class="absolute right-0 bottom-0 scale-60 rounded-full p-0.5"
				style:background={service.operator.color}
			>
				<BellOff size={5} fill="currentColor" />
			</div>
		{/if}
	</Button>
	{#if failedToSubscribe}
		<div
			class="absolute top-14 right-4 z-[20] flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
		>
			Failed to setup notifications
			<button onclick={() => (failedToSubscribe = false)}><X size={14} /></button>
		</div>
	{/if}
{:else if filter || (afterCallingPoints.length === 1 && firstAfterCallingPointCrs)}
	<Button
		size="icon"
		variant="outline"
		class="bg-input/30 hover:bg-input/50"
		onclick={() => save(filter ?? firstAfterCallingPointCrs!)}
	>
		{#if loading}
			<Spinner class="size-6" />
		{:else}
			<Bell />
		{/if}
	</Button>
	{#if !promptDismissed.value}
		<div
			class="absolute top-14 right-4 z-[20] flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
		>
			Receive notifications for this train?
			<button onclick={() => (promptDismissed.value = true)}><X size={14} /></button>
		</div>
	{/if}
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button size="icon" class="bg-input/30 hover:bg-input/50" variant="outline">
				{#if loading}
					<Spinner size="size-6" />
				{:else}
					<Bell />
				{/if}
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Group>
				<DropdownMenu.Label>Subscribe until when?</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each afterCallingPoints as item, i (i)}
					<DropdownMenu.Item onclick={() => item.crs && save(item.crs)}
						>{item.name}</DropdownMenu.Item
					>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	{#if !promptDismissed.value}
		<div
			class="absolute top-14 right-4 z-[20] flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
		>
			Receive notifications for this train?
			<button onclick={() => (promptDismissed.value = true)}><X size={14} /></button>
		</div>
	{/if}
{/if}
