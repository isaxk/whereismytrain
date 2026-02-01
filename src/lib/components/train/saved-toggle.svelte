<script lang="ts">
	import dayjs from 'dayjs';
	import { Bell, BellOff, BellRing, BookmarkIcon, X } from 'lucide-svelte';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';
	import {
		localStore,
		parseSavedInfo,
		pwa,
		saved,
		setSavedTrainData
	} from '$lib/state/saved.svelte';
	import type { TrainService, SavedTrain as SavedTrainType } from '$lib/types';
	import { iOS } from '$lib/utils';

	import Install from '../home/install.svelte';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import { Spinner } from '../ui/spinner/index';

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

	const existingOnRoute = $derived(
		saved.value.find((t) => t.focusCrs === crs && t.filterCrs === filter && t.service_id !== rid)
	);

	async function save(filter: string) {
		loading = true;

		const serviceInfo = parseSavedInfo(service);

		if (!serviceInfo) return;

		let newItem: SavedTrainType = {
			id: crypto.randomUUID(),
			service_id: rid,
			focusCrs: crs,
			filterCrs: filter,
			service: serviceInfo,
			subscriptionId: null,
			date: service.date,
			originalArrival:
				service.callingPoints.find((cp) => cp.order === 'filter')?.times.plan.arr ?? null
		};
		const subscriptionId = await subscribeToTrain(
			rid,
			focus,
			filter,
			service.destination.map((d) => d.name).join(', ')
		);
		// console.log('subscriptionId', subscriptionId);
		if (subscriptionId === null) {
			failedToSubscribe = true;
			console.log(failedToSubscribe);
		} else {
			failedToSubscribe = false;
		}
		setSavedTrainData(rid, serviceInfo);
		saved.value = [...saved.value, { ...newItem, subscriptionId }].toSorted((a, b) => {
			const diff = dayjs(a.date).diff(dayjs(b.date));
			// console.log('diff', diff);
			return diff === 0 ? 0 : diff > 0 ? 1 : -1;
		});
		loading = false;
	}

	function saveAndReplace(filter: string) {
		if (!existingOnRoute) {
			save(filter);
			return;
		}
		unsubscribeToTrain(existingOnRoute.subscriptionId!);
		saved.value = saved.value.filter((s) => s.id !== existingOnRoute.id);
		save(filter);
	}

	function remove() {
		const subscriptionId = saved.value.find((s) => s.service_id === rid)?.subscriptionId;
		if (subscriptionId) {
			unsubscribeToTrain(subscriptionId);
		}
		saved.value = saved.value.filter((s) => s.service_id !== rid);
	}

	const afterCallingPoints = $derived.by(() => {
		const withArrivals = service.callingPoints.filter((cp) => cp.times.plan.arr);
		const focus = withArrivals.findIndex((cp) => cp.crs === crs);
		return focus >= 0 ? withArrivals.slice(focus + 1) : withArrivals;
	});

	const firstAfterCallingPointCrs = $derived.by(() => afterCallingPoints[0]?.crs);

	const promptDismissed = localStore<boolean>('saved-prompt-dismissed', false);
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
{:else if saved.value.some((s) => s.service_id === rid)}
	<Button
		size="icon"
		class="relative bg-input/30 hover:bg-input/50"
		variant="outline"
		onclick={() => remove()}
	>
		{#if saved.value.find((s) => s.service_id === rid)?.subscriptionId}
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
			class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
		>
			Failed to setup notifications
			<button onclick={() => (failedToSubscribe = false)}><X size={14} /></button>
		</div>
	{/if}
{:else if filter || (afterCallingPoints.length === 1 && firstAfterCallingPointCrs)}
	{#if existingOnRoute}
		<Dialog.Root>
			<Dialog.Trigger
				class={[
					buttonVariants({ variant: 'outline', size: 'icon' }),
					'bg-input/30 hover:bg-input/50'
				]}
			>
				{#if loading}
					<Spinner class="size-6" />
				{:else}
					<Bell />
				{/if}
			</Dialog.Trigger>
			<Dialog.Content class="bg-background">
				<Dialog.Title class="text-lg font-semibold">Replace train?</Dialog.Title>
				<Dialog.Description class="text-sm text-muted-foreground">
					You already have a saved train for this route today.
				</Dialog.Description>
				<Dialog.Footer>
					<Dialog.Close
						onclick={() => saveAndReplace(filter ?? firstAfterCallingPointCrs!)}
						class={buttonVariants({ variant: 'default' })}>Replace</Dialog.Close
					>
					<Dialog.Close
						onclick={() => save(filter ?? firstAfterCallingPointCrs!)}
						class={buttonVariants({ variant: 'secondary' })}>Add too</Dialog.Close
					>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
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
	{/if}
	{#if !promptDismissed.value}
		<div
			class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
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
			class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
		>
			Receive notifications for this train?
			<button onclick={() => (promptDismissed.value = true)}><X size={14} /></button>
		</div>
	{/if}
{/if}
