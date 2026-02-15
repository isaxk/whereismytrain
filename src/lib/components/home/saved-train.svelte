<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import dayjs from 'dayjs';
	import { EllipsisVertical, Trash, TriangleAlertIcon, X } from 'lucide-svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { fly } from 'svelte/transition';

	import tube from '$lib/assets/tube.svg';
	import Tubeicon from '$lib/assets/tubeicon.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { londonTerminals } from '$lib/data/favourites';
	import { unsubscribeToTrain } from '$lib/notifications';
	import { parseSavedInfo } from '$lib/shared/service';
	import { getSavedTrainData, saved, setSavedTrainData } from '$lib/state/saved.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { SavedTrain, SavedTrainServiceInfo } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';

	import { api } from '../../../convex/_generated/api';
	import TrainDiagram from '../itinerary/train-diagram.svelte';
	import AlternativeProvider from '../providers/alternative-provider.svelte';
	import SubscriptionProvider from '../providers/subscription-provider.svelte';
	import AlertCard from '../ui/alert-card.svelte';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import ChangeNotifier from '../ui/change-notifier.svelte';
	import * as Dialog from '../ui/dialog';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import Spinner from '../ui/spinner/spinner.svelte';

	import AlternativeDisplay from './alternative-display.svelte';
	import AlternativeConnection from './alternative-provider.svelte';
	import Connection from './connection.svelte';

	let { data, index }: { data: SavedTrain; index: number } = $props();

	const convex = useConvexClient();

	let service: SavedTrainServiceInfo | null = $state(data.service);
	let serviceId = $state(data.service_id);

	let showMissedDialog = $state(false);

	const refreshed = $derived.by(() => {
		// console.log(now - data.lastRefreshed);
		// console.log('diff', now.diff(dayjs(data.lastRefreshed), 's'));
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
		const interval = setInterval(() => {
			now = dayjs();
		}, 1000);
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

<SubscriptionProvider serviceId={data.service_id} crs={data.filterCrs} filter={data.filterCrs}>
	{#snippet children({ onUnsubscribe })}
		{#if service}
			<div
				style:min-height="{clientHeight}px"
				class={[
					'relative py-6 transition-all duration-300',
					(!refreshed && !refreshing.current) || refreshing.error ? 'opacity-40' : 'opacity-100',
					!refreshed && refreshing.current && !refreshing.error ? 'animate-pulse' : ''
				]}
			>
				<div>
					{#key serviceId}
						<a
							bind:clientHeight
							class="absolute top-0 right-0 left-0"
							out:fly={{ duration: 200, y: 15 }}
							in:fly={{ duration: 200, y: -15, delay: 201 }}
							href={`/board/${data.focusCrs}/t/${data.service_id}?to=${data.filterCrs}&backTo=/`}
						>
							<TrainDiagram
								{...service}
								showDate={!dayjs(service.rtDep ?? service.planDep).isSame(dayjs(), 'day') &&
									!saved.value.some(
										(item, i) =>
											i < index &&
											!dayjs(item.service.rtDep ?? item.service.planDep).isSame(dayjs(), 'day')
									)}
							/>
						</a>
					{/key}
					<div style:min-height="{clientHeight}px"></div>

					{#if !service.isCancelled && !service.isCancelledAtFilter}
						<Connection
							crs={service.filter}
							originalArr={data.originalArrival}
							planArr={service.planArr}
							rtArr={service.rtArr}
						/>
					{/if}
				</div>

				{#if service.isCancelled || service.isCancelledAtFilter}
					<div class="z-100">
						<AlternativeProvider
							allowance={5}
							existingRid={data.service_id}
							from={data.focusCrs}
							to={data.filterCrs}
							time={dayjs(service.planDep).format('HH:mm')}
						>
							{#snippet children({ item, serviceId })}
								{#if item && serviceId}
									<SubscriptionProvider {serviceId} crs={data.focusCrs} filter={data.filterCrs}>
										{#snippet children({ loading, onSwitchFrom })}
											<AlertCard status="major" class="z-[1000] -mt-4 font-normal" Icon={X}>
												<div class="flex items-center gap-2">
													<div class="grow">
														<div class="font-semibold">
															This service was cancelled, but an alternative was found.
														</div>
														<div class="py-0.5 font-normal underline">
															{item.times.plan.dep} to {item.destination
																?.map((d) => d.name)
																.join(', ')}
															(Exp.
															{item.times.rt.dep})
														</div>
														<div class="py-0.5 text-[10px] text-muted-foreground">
															<div>Please check your ticket is valid on this service.</div>
														</div>
													</div>

													<div class="">
														<Button class="w-20" onclick={() => onSwitchFrom(data.id)}>
															{#if loading}
																<Spinner />
															{:else}
																Switch
															{/if}</Button
														>
													</div>
												</div>
											</AlertCard>
										{/snippet}
									</SubscriptionProvider>
								{/if}
							{/snippet}
						</AlternativeProvider>
					</div>
				{/if}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={[
							'absolute top-22 right-0',
							buttonVariants({ variant: 'outline', size: 'icon' })
						]}
					>
						<EllipsisVertical />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={() => (showMissedDialog = true)}>
							<TriangleAlertIcon /> Missed, what now?
						</DropdownMenu.Item>

						<DropdownMenu.Item onclick={onUnsubscribe} variant="destructive"
							><Trash /> Remove</DropdownMenu.Item
						>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Dialog.Root bind:open={showMissedDialog}>
					<Dialog.Content>
						<Dialog.Title>Missed train, what now?</Dialog.Title>
						<Dialog.Description>
							If you have an "Advance" ticket, you will need to buy a new ticket. However, if this
							is a connecting train you will be entitled to take the next train (this includes split
							tickets). Most other tickets will be valid on the next train(s).
						</Dialog.Description>
						<div class="h-56">
							<AlternativeProvider
								time={dayjs(data.service.planDep).format('HH:mm')}
								allowance={10}
								from={data.focusCrs}
								to={data.filterCrs}
								existingRid={data.service_id}
							>
								{#snippet children({ loading, failed, item, serviceId })}
									{#if item && serviceId}
										<SubscriptionProvider {serviceId} crs={data.focusCrs} filter={data.filterCrs}>
											{#snippet children({ loading, onSwitchFrom })}
												<AlternativeDisplay
													state="complete"
													switching={loading}
													outline
													from={data.focusCrs}
													to={data.filterCrs}
													time={dayjs(data.service.planDep).add(10, 'minutes').format('HHmm')}
													service={item}
													showDescription={false}
													onSwitch={() => {
														onSwitchFrom(data.id).then(() => {
															showMissedDialog = false;
														});
													}}
												></AlternativeDisplay>
											{/snippet}
										</SubscriptionProvider>
									{:else}
										<AlternativeDisplay
											outline
											showDescription
											from={data.focusCrs}
											to={data.filterCrs}
											time={dayjs(data.service.planDep).add(10, 'minutes').format('HHmm')}
											state={failed ? 'failed' : 'loading'}
										/>
									{/if}
								{/snippet}
							</AlternativeProvider>
						</div>
					</Dialog.Content>
				</Dialog.Root>
				<!-- {/key} -->
			</div>
		{/if}
	{/snippet}
</SubscriptionProvider>
