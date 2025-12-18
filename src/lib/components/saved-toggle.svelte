<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { TrainService } from '$lib/types';
	import { Bell, BellOff, BellRing, BookmarkIcon, X } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';
	import { Spinner } from './ui/spinner/index';
	import dayjs from 'dayjs';

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
		saved.value = [
			...saved.value,
			{
				id: rid,
				focusCrs: crs,
				filterCrs: filter,
				service,
				subscriptionId: subscriptionId
			}
		].toSorted((a, b) => {
			const aFocus = a.service.callingPoints.find((cp) => cp.order === 'focus');
			const bFocus = b.service.callingPoints.find((cp) => cp.order === 'focus');
			if (!aFocus || !bFocus) return 0;
			const diff = dayjs(aFocus?.times.plan.dep).diff(dayjs(bFocus?.times.plan.dep));
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
		const focus = service.callingPoints.findIndex((cp) => cp.crs === crs);
		return focus >= 0 ? service.callingPoints.slice(focus + 1) : service.callingPoints;
	});

	const firstAfterCallingPointCrs = $derived.by(() => afterCallingPoints[0]?.crs);
</script>

{#if saved.value.some((s) => s.id === rid)}
	<button onclick={() => remove()} class="relative">
		{#if saved.value.find((s) => s.id === rid)?.subscriptionId}
			<BellRing fill="currentColor" />
		{:else}
			<BookmarkIcon fill="currentColor" />
			<div
				class="absolute -right-1 -bottom-1 rounded-full p-0.5"
				style:background={service.operator.color}
			>
				<BellOff size={12} fill="currentColor" />
			</div>
		{/if}
	</button>
	{#if failedToSubscribe}
		<div
			class="bg-background text-foreground border-border absolute top-14 right-4 z-[20] flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs drop-shadow"
		>
			Failed to setup notifications
			<button onclick={() => (failedToSubscribe = false)}><X size={14} /></button>
		</div>
	{/if}
{:else if filter || (afterCallingPoints.length === 1 && firstAfterCallingPointCrs)}
	<button class="" onclick={() => save(filter ?? firstAfterCallingPointCrs!)}>
		{#if loading}
			<Spinner class="size-6" />
		{:else}
			<Bell />
		{/if}
	</button>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			>{#if loading}
				<Spinner size="size-6" />
			{:else}
				<Bell />
			{/if}</DropdownMenu.Trigger
		>
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
{/if}
