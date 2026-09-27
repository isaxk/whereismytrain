<script lang="ts">
	import {
		AlertTriangle,
		ArrowLeftRight,
		CircleMinus,
		EllipsisVertical,
		SearchIcon,
		Trash,
		TriangleAlertIcon,
		X
	} from '@lucide/svelte/icons';
	import { useConvexClient } from 'convex-svelte';
	import dayjs from 'dayjs';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { fly } from 'svelte/transition';

	import { parseSavedInfo } from '$lib/shared/service';
	import { getSavedTrainData, saved, setSavedTrainData } from '$lib/state/saved.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { SavedTrain, SavedTrainServiceInfo } from '$lib/types';

	import TrainDiagram from '../itinerary/train-diagram.svelte';
	import SubscriptionProvider from '../providers/subscription-provider.svelte';
	import Search from '../search/search.svelte';
	import AlertCard from '../ui/alert-card.svelte';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import * as Dialog from '../ui/dialog';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import Spinner from '../ui/spinner/spinner.svelte';

	import Connection from './connection.svelte';
	import { goto } from '$app/navigation';

	let { data, index }: { data: SavedTrain; index: number } = $props();

	let service: SavedTrainServiceInfo | null = $state(data.service);
	let serviceId = $state(data.service_id);

	let showMissedDialog = $state(false);

	const refreshed = $derived.by(() => {
		if (service && service?.refreshedAt && now.diff(dayjs(service.refreshedAt), 's') > 25) {
			return false;
		}
		return true;
	});

	$effect(() => {
		if (data.service_id !== serviceId) {
			serviceId = data.service_id;
			untrack(() => {
				service = data.service;
			});
		}
	});

	onMount(() => {
		getSavedTrainData(data.service_id).then((data) => {
			if (data) {
				service = data;
				console.log('result from indexedDB', data);
				saved.value[index].service = data;
			}
		});
	});

	let unsubscribe: () => void;
	let oldId: string | null = null;

	explicitEffect(
		() => {
			if (oldId === data.service_id) {
				return;
			}
			oldId = data.service_id;
			console.log('effect triggered for: data.service_id', data.service_id);
			unsubscribe?.();

			unsubscribe = servicesSub.subscribe(data.service_id, data.focusCrs, data.filterCrs, (s) => {
				console.log('subscription result', data.service_id);
				if (s && s.rid === data.service_id) {
					const serviceInfo = parseSavedInfo(s);

					if (!serviceInfo) return;

					saved.value[index].service = serviceInfo;

					service = serviceInfo;

					setSavedTrainData(data.service_id, serviceInfo);
				}
			});
		},
		() => [data.service_id]
	);

	onMount(() => {
		if (dayjs().diff(dayjs(data.service.planArr), 'h') > 6) {
			saved.value = saved.value.filter((_, i) => i !== index);
		}
		const interval = setInterval(() => {
			now = dayjs();
		}, 1000);
		if (dayjs().diff(dayjs(data.date), 'h') > 24) {
			saved.value = saved.value.filter((_, i) => i !== index);
			// return;
		}
		return () => {
			clearInterval(interval);
		};
	});

	onDestroy(() => {
		unsubscribe?.();
	});

	let now = $state(dayjs());

	let clientHeight = $state(176);
</script>

{#if !service?.arrived}
	<SubscriptionProvider serviceId={data.service_id} crs={data.filterCrs} filter={data.filterCrs}>
		{#snippet children({ onUnsubscribe })}
			{#if service}
				<div
					style:min-height="{clientHeight}px"
					class={[
						'relative py-4 transition-all duration-300',
						(!refreshed && !refreshing.current) || refreshing.error ? 'opacity-40' : 'opacity-100',
						!refreshed && refreshing.current && !refreshing.error ? 'animate-pulse' : ''
					]}
				>
					<div>
						{#key serviceId}
							<TrainDiagram
								{...service}
								id={serviceId}
								onRemove={onUnsubscribe}
								showDate={!dayjs(service.rtDep ?? service.planDep).isSame(dayjs(), 'day') &&
									!saved.value.some(
										(item, i) =>
											i < index &&
											!dayjs(item.service.rtDep ?? item.service.planDep).isSame(dayjs(), 'day')
									)}
							>
								{#snippet menu()}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class={[buttonVariants({ variant: 'outline', size: 'icon-sm' })]}
											><EllipsisVertical /></DropdownMenu.Trigger
										>
										<DropdownMenu.Content>
											<DropdownMenu.Item
												onclick={() =>
													goto(
														`/board/${data.focusCrs}/?to=${data.filterCrs}&time=${dayjs(data.service.planDep).format('HHmm')}`
													)}
											>
												<ArrowLeftRight />
												Alternatives
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => onUnsubscribe()} variant="destructive">
												<CircleMinus />
												Remove
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/snippet}
								{#snippet cancelled()}
									<Button
										onclick={() =>
											goto(
												`/board/${data.focusCrs}/?to=${data.filterCrs}&time=${dayjs(data.service.planDep).format('HHmm')}`
											)}
									>
										<ArrowLeftRight />
										Alternatives
									</Button>
								{/snippet}
							</TrainDiagram>
						{/key}
						<!-- <div style:min-height="{clientHeight}px"></div> -->

						<!-- {#if !service.isCancelled && !service.isCancelledAtFilter} -->
						<div class="pt-6">
							<Connection
								crs={service.filter}
								originalArr={data.originalArrival}
								planArr={service.planArr}
								rtArr={service.rtArr}
							/>
						</div>
						<!-- {:else}
							<div class="h-6"></div>
						{/if} -->
					</div>
				</div>
			{/if}
		{/snippet}
	</SubscriptionProvider>
{/if}
