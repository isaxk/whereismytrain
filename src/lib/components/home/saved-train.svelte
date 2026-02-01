<script lang="ts">
	import dayjs from 'dayjs';
	import {
		Bus,
		EllipsisVertical,
		GitCompareArrowsIcon,
		Trash,
		TriangleAlertIcon,
		X
	} from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	import tube from '$lib/assets/tube.svg';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { londonTerminals } from '$lib/data/favourites';
	import { unsubscribeToTrain } from '$lib/notifications';
	import {
		getSavedTrainData,
		parseSavedInfo,
		saved,
		setSavedTrainData
	} from '$lib/state/saved.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { SavedTrain, SavedTrainServiceInfo } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';

	import AlertCard from '../ui/alert-card.svelte';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import ChangeNotifier from '../ui/change-notifier.svelte';
	import * as Dialog from '../ui/dialog';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import Spinner from '../ui/spinner/spinner.svelte';

	import AlternativeDisplay from './alternative-display.svelte';
	import AlternativeConnection from './alternative-provider.svelte';
	import Tubeicon from '$lib/assets/tubeicon.svelte';
	import TrainDiagram from '../itinerary/train-diagram.svelte';
	import { onMount, untrack } from 'svelte';

	let { data, index }: { data: SavedTrain; index: number } = $props();

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

	function remove() {
		if (data.subscriptionId) {
			unsubscribeToTrain(data.subscriptionId);
		}
		saved.value = saved.value.filter((s) => s.id !== data.id);
	}

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
				if (s) {
					const serviceInfo = parseSavedInfo(s);

					if (!serviceInfo) return;

					saved.value[index].service = serviceInfo;

					service = serviceInfo;

					setSavedTrainData(data.service_id, serviceInfo);
				}
			});
			const interval = setInterval(() => {
				now = dayjs();
			}, 1000);
			return () => {
				// console.log('cleaning up effect');
				unsubscribe?.();
				clearInterval(interval);
			};
		},
		() => [data.service_id]
	);

	// const duration = $derived.by(() => {
	// 	if (!focus || !filter) return null;

	// 	let arrival = dayjsFromHHmm(filter.times.plan.arr!);
	// 	let departure = dayjsFromHHmm(focus.times.plan.dep!);

	// 	if (filter.times.rt.arr && focus.times.rt.dep) {
	// 		arrival = dayjsFromHHmm(filter.times.rt.arr);
	// 		departure = dayjsFromHHmm(focus.times.rt.dep);
	// 	}

	// 	if (arrival.isBefore(departure)) {
	// 		arrival = arrival.add(1, 'day');
	// 	}

	// 	let diff = arrival.diff(departure, 'minutes');

	// 	if (diff >= 60) {
	// 		return `${Math.floor(diff / 60)}h ${diff % 60}m`;
	// 	} else {
	// 		return `${diff}m`;
	// 	}
	// });

	// const remaining = $derived.by(() => {
	// 	if (!focus || !filter) return null;

	// 	let arrival = dayjsFromHHmm(filter.times.plan.arr!);

	// 	if (filter.times.rt.arr && focus.times.rt.dep) {
	// 		arrival = dayjsFromHHmm(filter.times.rt.arr);
	// 	}

	// 	const diff = arrival.diff(now, 'minutes');
	// 	if (diff < 0) {
	// 		return null;
	// 	} else if (diff === 60) {
	// 		return `${Math.floor(diff / 60)}h`;
	// 	} else if (diff > 60) {
	// 		return `${Math.floor(diff / 60)}h ${diff % 60}m`;
	// 	} else {
	// 		return `${diff}m`;
	// 	}
	// });

	let now = $state(dayjs());

	// const timeUntilDeparture = $derived(focus ? dayjs(focus.rtDepDate).diff(now, 'minute') : 0);

	const connection = $derived.by(() => {
		if (service === null || service.isCancelled || service.isCancelledAtFilter) return null;

		let connection = saved.value.find((connection) => {
			if (connection.focusCrs !== service?.filter) return false;

			// console.log('connection');

			const schDiff =
				connection.service.planDep && service.planArr
					? dayjs(connection.service.planDep).diff(
							dayjs(data.originalArrival ?? service.planArr),
							'minute'
						)
					: null;
			const schDiffWithNew =
				connection.service.planDep && service.planArr
					? dayjs(connection.service.planDep).diff(dayjs(service.planArr), 'minute')
					: null;
			// console.log(schDiff);
			if (
				(schDiff && schDiff < 90 && schDiff > 1) ||
				(schDiffWithNew && schDiffWithNew < 90 && schDiffWithNew > 1)
			) {
				return true;
			}
			return false;
		});
		if (!connection) {
			connection = saved.value.find((connection) => {
				// if (s.id === service.rid) return false;

				const acrossLondon =
					londonTerminals.includes(connection.focusCrs) &&
					londonTerminals.includes(service.filter ?? '') &&
					connection.focusCrs !== service.filter;

				if (connection.focusCrs !== service.filter && !acrossLondon) return false;

				// console.log('connection');

				const schDiff =
					connection.service.planDep && service.planArr
						? dayjs(connection.service.planDep).diff(
								dayjs(data.originalArrival ?? service.planArr),
								'minute'
							)
						: null;
				const schDiffWithNew =
					connection.service.planDep && service.planArr
						? dayjs(connection.service.planDep).diff(dayjs(service.planArr), 'minute')
						: null;
				// console.log(schDiff);
				if (
					(schDiff && schDiff < 90 && schDiff > 1) ||
					(schDiffWithNew && schDiffWithNew < 90 && schDiffWithNew > 1)
				) {
					return true;
				}
				return false;
			});
		}

		if (!connection) return null;

		const acrossLondon =
			londonTerminals.includes(connection.focusCrs) &&
			londonTerminals.includes(service.filter ?? '') &&
			connection.focusCrs !== service.filter;
		const schDiff =
			connection.service.planDep && service.planArr
				? dayjs(connection.service.planDep).diff(
						dayjs(data.originalArrival ?? service.planArr),
						'minute'
					)
				: null;
		const newSchDiff =
			connection.service.planDep && service.planArr
				? dayjs(connection.service.planDep).diff(dayjs(service.planArr), 'minute')
				: null;

		const rtDiff =
			connection.service.rtDep && service.rtArr
				? dayjs(connection.service.rtDep).diff(dayjs(service.rtArr), 'minute')
				: null;

		let status = 'ok';
		if (!rtDiff || !schDiff) {
			status = 'warning';
		} else if (acrossLondon) {
			// console.log(rtDiff);
			if (acrossLondon && rtDiff <= 20) {
				status = 'impossible';
			} else if (acrossLondon && rtDiff <= 30) {
				status = 'alternative';
			}
		} else if (schDiff <= 5) {
			if (rtDiff < 1) {
				status = 'impossible';
			} else if (rtDiff < 4) {
				status = 'alternative';
			}
		} else if (schDiff <= 10) {
			if (rtDiff < 1) {
				status = 'impossible';
			} else if (rtDiff <= 5) {
				status = 'alternative';
			} else if (rtDiff <= 7) {
				status = 'warning';
			}
		} else if (rtDiff < schDiff) {
			if (rtDiff < 1) {
				status = 'impossible';
			} else if (rtDiff <= 5) {
				status = 'alternative';
			} else if (rtDiff <= 10) {
				status = 'warning';
			}
		}

		const connectionIndex = saved.value.findIndex((saved) => saved.id === connection.id);

		if (rtDiff !== null && schDiff) {
			return {
				rid: connection.service_id,
				rtTime: rtDiff,
				schTime: schDiff,
				newSchDiff: newSchDiff,
				name: `${connection.service.planDep}`,
				status,
				acrossLondon,
				from: connection.focusCrs,
				to: connection.filterCrs,
				connectionIndex
			};
		} else if (schDiff) {
			return {
				rid: connection.service_id,
				schTime: schDiff,
				newSchDiff: newSchDiff,
				rtTime: null,
				name: `${connection.service.planDep}`,
				status,
				acrossLondon,
				from: connection.focusCrs,
				to: connection.filterCrs,
				connectionIndex
			};
		}

		return null;
	});

	let clientHeight = $state(176);
</script>

{#if service}
	<div
		style:min-height="{clientHeight}px"
		class={[
			'relative py-3 transition-all duration-300',
			(!refreshed && !refreshing.current) || refreshing.error ? 'opacity-40' : 'opacity-100',
			!refreshed && refreshing.current && !refreshing.error ? 'animate-pulse' : ''
		]}
	>
		{#key serviceId}
			<div
				bind:clientHeight
				class="absolute top-0 right-0 left-0 py-5"
				out:fly={{ duration: 200, y: 15 }}
				in:fly={{ duration: 200, y: -15, delay: 201 }}
			>
				<a href={`/board/${data.focusCrs}/t/${data.service_id}?to=${data.filterCrs}&backTo=/`}>
					<TrainDiagram
						{...service}
						showDate={!dayjs(service.rtDep).isSame(dayjs(), 'day') &&
							!saved.value.some(
								(item, i) => i < index && !dayjs(item.service.rtDep).isSame(dayjs(), 'day')
							)}
					/>
				</a>
				{#if connection?.status === 'ok'}
					<div class="relative h-5">
						<div class="absolute -top-3.5 right-0 left-0 flex min-h-24 items-center">
							<div class="w-12"></div>
							<div class="flex h-20 w-10 flex-col items-center justify-center gap-0.5">
								<div class="w-px grow rounded-full bg-muted-foreground"></div>
								{#if connection.acrossLondon}
									<div class="h-6 w-6 p-1">
										<Tubeicon />
									</div>
								{:else}
									<GitCompareArrowsIcon size={15} />
								{/if}
								<div class="w-px grow rounded-full bg-muted-foreground"></div>
							</div>
							<div class="grow text-xs">
								{#if connection.newSchDiff !== connection.rtTime}
									<span class="line-through opacity-80">{connection.newSchDiff}m</span>
								{/if}
								{connection.rtTime}m to change {#if connection.acrossLondon}via Underground{/if}
							</div>
						</div>
					</div>
				{:else if connection && connection?.status !== 'ok'}
					<div class="relative h-5">
						<div
							class={[
								'absolute -top-3.5 right-0 left-0 flex h-24 items-center',
								{
									'text-amber-500':
										connection?.status === 'warning' || connection.status === 'alternative',

									'text-red-500': connection?.status === 'impossible'
								}
							]}
						>
							<div class="w-12"></div>
							<div class={['flex h-20 w-10 flex-col items-center justify-center gap-0.5']}>
								<div
									class={[
										'w-px grow rounded-full',
										{
											'bg-amber-500':
												connection?.status === 'warning' || connection.status === 'alternative',

											'bg-red-500': connection?.status === 'impossible'
										}
									]}
								></div>
								{#if connection.acrossLondon}
									<div class="h-6 w-6 p-1">
										<Tubeicon />
									</div>
								{:else}
									<GitCompareArrowsIcon size={15} />
								{/if}
								<div
									class={[
										'w-px grow rounded-full',
										{
											'bg-amber-500':
												connection?.status === 'warning' || connection.status === 'alternative',

											'bg-red-500': connection?.status === 'impossible'
										}
									]}
								></div>
							</div>
							<div class="grow text-xs">
								{#if connection.status === 'impossible'}
									<div class="line-through opacity-80">
										{(connection.newSchDiff ?? 0) < 0 ? connection.schTime : connection.newSchDiff}m
										to change
									</div>
									Change not possible
								{:else}
									<span class="line-through opacity-80">{connection.newSchDiff}m</span>
									{connection.rtTime}m to change
								{/if}
							</div>
							{#if connection.status === 'impossible' || connection.status === 'alternative' || connection.status === 'warning'}
								<Popover.Root>
									<Popover.Trigger
										class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'z-10']}
										>Find alternative
									</Popover.Trigger>
									<Popover.Content class="min-h-56 w-sm max-w-full p-0">
										<AlternativeConnection
											from={connection.from}
											to={connection.to}
											time={dayjs(service.rtArr).format('HH:mm') ?? null}
											allowance={Math.max(
												connection.acrossLondon ? 15 : 2, // The minimum allowance
												Math.min(
													connection.acrossLondon ? 45 : 8, // The maximum allowance
													connection.newSchDiff && connection.newSchDiff > 1
														? Math.min(connection.newSchDiff, connection.schTime)
														: (connection.schTime ?? 0)
												)
											)}
											existingRid={connection.rid}
											index={connection.connectionIndex}
										>
											{#snippet children(newService, switchTo, switching, failed)}
												<AlternativeDisplay
													service={newService}
													{switchTo}
													{switching}
													{failed}
													from={connection.from}
													to={connection.to}
													time={dayjs(
														service?.rtArr ?? service?.planArr ?? dayjs().format('HH:mm')
													).format('HHmm')}
												/>
											{/snippet}
										</AlternativeConnection>
									</Popover.Content>
								</Popover.Root>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if service.isCancelled || service.isCancelledAtFilter}
				<div class="z-100 -mb-8 pt-36">
					<AlternativeConnection
						from={data.focusCrs}
						to={data.filterCrs}
						time={service.planDep ?? null}
						{index}
						existingRid={data.service_id}
						allowance={5}
					>
						{#snippet children(service, switchTo, switching)}
							{#if service}
								<AlertCard status="major" class="z-[1000] mt-0 font-normal" Icon={X}>
									<div class="flex items-center">
										<div>
											<div class="font-semibold">
												This service was cancelled, but an alternative was found.
											</div>
											<div class="py-0.5 font-normal underline">
												{service.times.plan.dep} to {service.destination
													?.map((d) => d.name)
													.join(', ')}
												(Exp.
												{service.times.rt.dep})
											</div>
											<div class="py-0.5 text-[10px] text-muted-foreground">
												<div>Please check your ticket is valid on this service.</div>
											</div>
										</div>
										<Button onclick={switchTo}
											>{#if switching}
												<Spinner />
											{:else}
												Switch
											{/if}</Button
										>
									</div>
								</AlertCard>
							{/if}
						{/snippet}
					</AlternativeConnection>
				</div>
			{/if}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={['absolute top-26 right-0', buttonVariants({ variant: 'outline', size: 'icon' })]}
				>
					<EllipsisVertical />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item onclick={() => (showMissedDialog = true)}>
						<TriangleAlertIcon /> Missed, what now?
					</DropdownMenu.Item>

					<DropdownMenu.Item onclick={() => remove()} variant="destructive"
						><Trash /> Remove</DropdownMenu.Item
					>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Dialog.Root bind:open={showMissedDialog}>
				<Dialog.Content>
					<Dialog.Title>Missed train, what now?</Dialog.Title>
					<Dialog.Description>
						If you have an "Advance" ticket, you will need to buy a new ticket. However, if this is
						a connecting train you will be entitled to take the next train (this includes split
						tickets). Most other tickets will be valid on the next train(s).
					</Dialog.Description>
					<div>
						<AlternativeConnection
							from={data.focusCrs}
							to={data.filterCrs}
							time={dayjs(data.service.planDep).format('HH:mm')}
							allowance={10}
							existingRid={data.service_id}
							{index}
						>
							{#snippet children(service, switchTo, switching, failed)}
								<AlternativeDisplay
									showDescription={false}
									outline
									{service}
									switchTo={() => {
										// showMissedDialog = false;
										switchTo().then(() => {
											showMissedDialog = false;
										});
									}}
									{switching}
									{failed}
									from={data.focusCrs}
									to={data.filterCrs}
									time={dayjs(data.service.date).add(15, 'minutes').format('HHmm')}
								/>
							{/snippet}
						</AlternativeConnection>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		{/key}
	</div>
{/if}
