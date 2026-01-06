<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { SavedTrain } from '$lib/types';
	import {
		AlertTriangle,
		ArrowUpRight,
		BellOff,
		Bus,
		Check,
		ClockAlert,
		EllipsisVertical,
		GitCompareArrowsIcon,
		Trash,
		TriangleAlertIcon,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import BoardItem from '$lib/components/board/board-item.svelte';
	import { refreshing, servicesSub } from '$lib/state/services-subscriber.svelte';
	import { unsubscribeToTrain } from '$lib/notifications';
	import { derived } from 'svelte/store';
	import dayjs from 'dayjs';
	import { dayjsFromHHmm } from '$lib/utils';
	import AlertCard from '../ui/alert-card.svelte';
	import { londonTerminals } from '$lib/data/favourites';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import AlternativeConnection from './alternative.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';
	import ChangeNotifier from '../board/change-notifier.svelte';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import * as Dialog from '../ui/dialog';
	import * as Item from '../ui/item';
	import * as Card from '../ui/card';
	import { operatorList } from '$lib/data/operators';
	import Input from '../ui/input/input.svelte';

	let { data, index }: { data: SavedTrain; index: number } = $props();

	let service = $derived(data.service);
	let lastRefreshed = $state(null);

	let showMissedDialog = $state(false);

	const refreshed = $derived.by(() => {
		// console.log(Date.now() - data.lastRefreshed);
		if (data.lastRefreshed && Date.now() - data.lastRefreshed > 20000) {
			return false;
		}
		return true;
	});

	async function refetch() {
		const res = await fetch(`/api/service/${data.service_id}/${data.focusCrs}`);
		if (res.ok) {
			const s = await res.json();
			if (s) {
				service = s;
				if (saved.value.find((s) => s.id === data.id)) {
					saved.value.find((s) => s.id === data.id)!.service = s;
				}
			} else {
				saved.value = saved.value.filter((s) => s.id !== data.id);
			}
		} else {
			return null;
		}
	}

	function remove() {
		if (data.subscriptionId) {
			unsubscribeToTrain(data.subscriptionId);
		}
		saved.value = saved.value.filter((s) => s.id !== data.id);
	}

	let unsubscribe: () => void;

	explicitEffect(
		() => {
			console.log('effect triggered for: data.service_id', data.service_id);
			unsubscribe?.();

			unsubscribe = servicesSub.subscribe(data.service_id, data.focusCrs, data.filterCrs, (s) => {
				if (s) {
					service = s;
					const item = saved.value.findIndex((s) => s.id === data.id);
					if (item !== -1) {
						saved.value[item] = {
							...saved.value[item],
							service: s,
							lastRefreshed: Date.now()
						};
					}
				}
			});
			const interval = setInterval(() => {
				now = dayjs();
			}, 100);
			return () => {
				console.log('cleaning up effect');
				unsubscribe?.();
				clearInterval(interval);
			};
		},
		() => [data.service_id]
	);

	const focus = $derived(service?.callingPoints?.find((cp) => cp.order === 'focus'));
	const filter = $derived(service?.callingPoints?.find((cp) => cp.order === 'filter'));

	const duration = $derived.by(() => {
		if (!focus || !filter) return null;

		let diff = dayjsFromHHmm(filter.times.plan.arr!).diff(
			dayjsFromHHmm(focus.times.plan.dep!),
			'minutes'
		);

		if (filter.times.rt.arr && filter.times.rt.dep) {
			diff = dayjsFromHHmm(filter.times.rt.arr!).diff(
				dayjsFromHHmm(focus.times.rt.dep!),
				'minutes'
			);
		}

		if (diff >= 60) {
			return `${Math.floor(diff / 60)}h ${diff % 60}m`;
		} else {
			return `${diff}m`;
		}
	});

	let now = $state(dayjs());

	const timeUntilDeparture = $derived(focus ? dayjs(focus.rtDepDate).diff(now, 'minute') : 0);

	const connection = $derived.by(() => {
		if (!filter || focus?.isCancelled || filter?.isCancelled) return null;

		let connection = saved.value.find((s) => {
			if (s.focusCrs !== filter.crs) return false;

			console.log('connection');

			const connectionFocus = s.service.callingPoints.find((cp) => cp.crs === s.focusCrs);
			console.log('connectionFocus', connectionFocus);
			if (connectionFocus) {
				const schDiff =
					connectionFocus.times.plan.dep && filter.times.plan.arr
						? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
								dayjsFromHHmm(data.originalArrival ?? filter.times.plan.arr),
								'minute'
							)
						: null;
				const schDiffWithNew =
					connectionFocus.times.plan.dep && filter.times.plan.arr
						? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
								dayjsFromHHmm(filter.times.plan.arr),
								'minute'
							)
						: null;
				console.log(schDiff);
				if (
					(schDiff && schDiff < 90 && schDiff > 1) ||
					(schDiffWithNew && schDiffWithNew < 90 && schDiffWithNew > 1)
				)
					return true;
			}
			return false;
		});
		if (!connection) {
			connection = saved.value.find((s) => {
				// if (s.id === service.rid) return false;

				const acrossLondon =
					londonTerminals.includes(s.focusCrs) &&
					londonTerminals.includes(filter.crs ?? '') &&
					s.focusCrs !== filter.crs;

				if (s.focusCrs !== filter.crs && !acrossLondon) return false;

				console.log('connection');

				const connectionFocus = s.service.callingPoints.find((cp) => cp.crs === s.focusCrs);
				console.log('connectionFocus', connectionFocus);
				if (connectionFocus) {
					const schDiff =
						connectionFocus.times.plan.dep && filter.times.plan.arr
							? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
									dayjsFromHHmm(data.originalArrival ?? filter.times.plan.arr),
									'minute'
								)
							: null;

					const schDiffWithNew =
						connectionFocus.times.plan.dep && filter.times.plan.arr
							? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
									dayjsFromHHmm(filter.times.plan.arr),
									'minute'
								)
							: null;
					console.log(schDiff);
					if (
						(schDiff && schDiff < (acrossLondon ? 180 : 90) && schDiff > (acrossLondon ? 10 : 1)) ||
						(schDiffWithNew &&
							schDiffWithNew < (acrossLondon ? 180 : 90) &&
							schDiffWithNew > (acrossLondon ? 10 : 1))
					)
						return true;
				}
				return false;
			});
		}

		if (!connection) return null;

		const acrossLondon =
			londonTerminals.includes(connection.focusCrs) &&
			londonTerminals.includes(filter.crs ?? '') &&
			connection.focusCrs !== filter.crs;
		console.log('acrossLondon', acrossLondon);
		const connectionFocus = connection.service.callingPoints.find(
			(cp) => cp.crs === connection.focusCrs
		);
		if (connectionFocus) {
			const schDiff =
				connectionFocus.times.plan.dep && filter.times.plan.arr
					? dayjsFromHHmm(connectionFocus.times.plan.dep).diff(
							dayjsFromHHmm(data.originalArrival ?? filter.times.plan.arr),
							'minute'
						)
					: null;
			const rtDiff =
				connectionFocus.times.rt.dep && filter.times.rt.arr
					? dayjsFromHHmm(connectionFocus.times.rt.dep).diff(
							dayjsFromHHmm(filter.times.rt.arr),
							'minute'
						)
					: null;

			let status = 'ok';
			if (!rtDiff || !schDiff) {
				status = 'warning';
			} else if (acrossLondon) {
				console.log(rtDiff);
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

			if (rtDiff && schDiff) {
				return {
					rid: connection.service_id,
					rtTime: rtDiff,
					schTime: schDiff,
					name: `${connectionFocus.times.plan.dep}`,
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
					rtTime: null,
					name: `${connectionFocus.times.plan.dep}`,
					status,
					acrossLondon,
					from: connection.focusCrs,
					to: connection.filterCrs,
					connectionIndex
				};
			}
		}

		return null;
	});

	$inspect('service', data);
</script>

{#snippet connectionAlternative(title, train, acrossLondon, switchTo, switching)}
	<div class="flex items-center">
		<div>
			<div class="font-semibold">
				{title}
			</div>
			<div class="py-0.5 font-normal underline">
				{train}
			</div>
			<div class="flex flex-col gap-0.5 py-0.5 text-[10px] text-muted-foreground">
				<div>Please check your ticket is valid on this service.</div>

				<a href="https://www.nationalrail.co.uk/journey-planner/">
					The <span class="underline">National Rail journey planner</span> may give more accurate information
					about connections across London, or provide faster alternative routes.
				</a>
			</div>
		</div>
		<div class="flex min-w-24 justify-end">
			<Button onclick={switchTo}
				>{#if switching}
					<Spinner />
				{:else}
					Switch
				{/if}</Button
			>
		</div>
	</div>
{/snippet}

<div
	class={[
		'relative py-3 transition-all duration-300',
		!refreshed && 'opacity-40',
		refreshing.current && !refreshed && 'animate-pulse'
	]}
>
	<!-- {#if !focus?.departed}
		<div class="flex items-center gap-1">
			{#if timeUntilDeparture < 1}
				<ArrowUpRight size={20} /> Departing soon
			{:else}
				<ArrowUpRight size={20} />Departing in {timeUntilDeparture}m
			{/if}
		</div>
	{/if} -->
	{#key data.service_id}
		{#if focus && filter}
			<!-- <BoardItem
				href={`/board/${data.focusCrs}/t/${data.service_id}?to=${data.filterCrs}&backTo=/`}
				id={data.service_id}
				planDep={focus?.times.plan.dep ?? 'N/A'}
				rtDep={focus?.times.rt.dep ?? null}
				departed={focus.departed}
				isCancelled={focus?.isCancelled}
				focus={focus.name}
				destination={service.destination}
				platform={focus.platform}
				crs={focus.crs ?? ''}
				operator={data.service.operator}
				isToday={data.service.isToday ?? false}
				date={data.service.date}
				{connection}
				filter={filter
					? {
							name: filter.name,
							planArr: filter.times.plan.arr ?? 'N/A',
							rtArr: filter.times.rt.arr ?? null,
							isCancelled: filter.isCancelled,
							arrived: filter.arrived
						}
					: null}
			/> -->

			<a href={`/board/${data.focusCrs}/t/${data.service_id}?to=${data.filterCrs}&backTo=/`}>
				<div class="flex h-16 items-center">
					<div class="flex min-w-12 flex-col items-end">
						{#if focus.isCancelled}
							<div class="text-base/4 text-danger">{focus.times.plan.dep}</div>
						{:else if focus.delay === null}
							<div class="text-base/4">{focus.times.plan.dep}</div>
							<div class="text-xs/3 text-warning">Delayed</div>
						{:else if focus.delay < 1}
							<div class="text-good">
								{focus.times.plan.dep}
							</div>
						{:else}
							<div class="text-sm/4">{focus.times.plan.dep}</div>
							<div class="text-sm/3 text-warning">{focus.times.rt.dep}</div>
						{/if}
					</div>
					<div class="flex h-16 min-w-10 flex-col items-center justify-center">
						<div class="w-1.5 grow"></div>
						<div class="flex h-1.5 min-w-4" style:background={service.operator.color}></div>
						<div class="w-1.5 grow" style:background={service.operator.color}></div>
					</div>

					<div class="min-w-0 grow">
						<div class="flex">
							<div class="grow text-base/6 font-medium">
								{focus.name}
							</div>
							<ChangeNotifier
								changed={false}
								class={[
									'-mr-1 items-center justify-center gap-1 px-1 text-right text-base/5',
									focus.platform === 'BUS' && 'text-sm text-warning'
								]}
							>
								{#if focus.platform === 'BUS'}
									<Bus size={16} /> Bus service
								{:else}
									<span class="text-xs/4 text-muted-foreground sm:text-xs/6">Platform </span>

									{focus.platform !== 'BUS' ? (focus.platform ?? '-') : ''}
								{/if}
							</ChangeNotifier>
						</div>
						<div class="flex w-full items-center gap-1 truncate text-xs/4 text-muted-foreground">
							<div
								class="h-max w-max rounded-sm px-1.5 py-0.5 text-[10px]/3 text-white"
								style:background={service.operator.color}
							>
								{service.operator.name}
							</div>

							{#if focus.isCancelled}
								<div class="text-xs/3 font-medium text-danger">Cancelled</div>
							{:else}
								<div class="min-w-0 grow truncate">
									to
									{service.destination.map((d) => d.name).join(', ')}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex h-5 items-center">
					<div class="w-12"></div>
					<div class="flex h-5 w-10 flex-col items-center justify-center">
						<div class="w-1.5 grow" style:background={service.operator.color}></div>
					</div>
					<div class="grow text-xs">
						{duration}
					</div>
				</div>
				<div class="flex h-12 items-center">
					<div class="flex w-12 flex-col items-end">
						{#if filter.isCancelled}
							<div class="text-base/4 text-danger">{filter.times.plan.arr}</div>
						{:else if filter.arrivalDelay === null}
							<div class="text-base/4">{filter.times.plan.arr}</div>
							<div class="text-xs/3 text-warning">Delayed</div>
						{:else if filter.arrivalDelay < 1}
							<div class="text-good">
								{filter.times.plan.arr}
							</div>
						{:else}
							<div class="text-sm/4">{filter.times.plan.arr}</div>
							<div class="text-sm/3 text-warning">{filter.times.rt.arr}</div>
						{/if}
					</div>
					<div class="flex h-full w-10 flex-col items-center justify-center">
						<div class="w-1.5 grow" style:background={service.operator.color}></div>
						<div class="flex h-1.5 min-w-4" style:background={service.operator.color}></div>

						<div class="w-1.5 grow"></div>
					</div>
					<div class="grow font-medium">
						<div class="text-base/5">
							{filter.name}
						</div>
						{#if filter.isCancelled && !focus.isCancelled}
							<div class="text-xs/4 font-medium text-danger">Cancelled</div>
						{/if}
					</div>
				</div>
			</a>
			{#if connection?.status === 'ok'}
				<div class="relative h-5">
					<div class="absolute -top-2 right-0 left-0 flex h-18 items-center">
						<div class="w-12"></div>
						<div class="flex h-16 w-10 flex-col items-center justify-center gap-0.5">
							<div class="w-px grow rounded-full bg-muted-foreground"></div>
							<GitCompareArrowsIcon size={15} />
							<div class="w-px grow rounded-full bg-muted-foreground"></div>
						</div>
						<div class="grow text-xs">
							{connection.rtTime}m to change
						</div>
					</div>
				</div>
			{:else if !connection}
				<div class="relative h-1">
					<div class="absolute top-5 right-0 left-0 h-px border-b border-border"></div>
				</div>
			{/if}
		{/if}
	{/key}
	{#if focus?.isCancelled || filter?.isCancelled}
		<AlternativeConnection
			from={data.focusCrs}
			to={data.filterCrs}
			time={focus?.times.plan.dep}
			{index}
			existingRid={data.service_id}
		>
			{#snippet children(service, switchTo, switching)}
				{#if service}
					<AlertCard status="major" class="mt-0 font-normal" Icon={X}>
						<div class="flex items-center">
							<div>
								<div class="font-semibold">
									This service was cancelled, but an alternative was found.
								</div>
								<div class="py-0.5 font-normal underline">
									{service.times.plan.dep} to {service.destination?.map((d) => d.name).join(', ')} (Exp.
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
	{/if}
	{#if connection && connection.schTime}
		{#if !connection?.rtTime}
			<AlternativeConnection
				from={connection.from}
				to={connection.to}
				time={filter?.times.rt.arr}
				index={connection.connectionIndex}
				existingRid={connection.rid}
				allowance={connection.schTime}
			>
				{#snippet children(service, switchTo, switching)}
					<AlertCard status="minor" class="mt-2 font-normal" Icon={GitCompareArrowsIcon}>
						{#if service}
							{@render connectionAlternative(
								`Connection to the ${connection.name} may no longer be possible.`,
								`${service.times.plan.dep} to ${service.destination?.map((d) => d.name).join(', ')} (Exp. ${service.times.rt.dep === service.times.plan.dep ? 'On time' : service.times.rt.dep})`,
								connection.acrossLondon,
								switchTo,
								switching
							)}
						{:else}
							<div class="font-semibold">
								Connection {#if connection.acrossLondon}(via Tube){/if} to the {connection.name} may
								no longer be possible.
							</div>
						{/if}
					</AlertCard>
				{/snippet}
			</AlternativeConnection>
		{:else if connection.status === 'impossible'}
			<AlternativeConnection
				from={connection.from}
				to={connection.to}
				time={filter?.times.rt.arr}
				index={connection.connectionIndex}
				existingRid={connection.rid}
				allowance={connection.schTime}
			>
				{#snippet children(service, switchTo, switching)}
					<AlertCard status="major" class="mt-2 font-normal" Icon={GitCompareArrowsIcon}>
						{#if service}
							{#if connection.rtTime < 1}
								{@render connectionAlternative(
									`Connection to the ${connection.name} no longer possible, but an alternative was found.`,
									`${service.times.plan.dep} to ${service.destination?.map((d) => d.name).join(', ')} (Exp. ${service.times.rt.dep === service.times.plan.dep ? 'On time' : service.times.rt.dep})`,
									connection.acrossLondon,
									switchTo,
									switching
								)}
							{:else}
								{@render connectionAlternative(
									`Only ${connection.rtTime}m to change to the ${connection.name}, but an alternative was found.`,
									`${service.times.plan.dep} to ${service.destination?.map((d) => d.name).join(', ')} (Exp. ${service.times.rt.dep === service.times.plan.dep ? 'On time' : service.times.rt.dep})`,
									connection.acrossLondon,
									switchTo,
									switching
								)}
							{/if}
						{:else}
							<div class="font-semibold">
								{#if connection.rtTime < 1}
									Connection to the {connection.name} no longer possible.
								{:else}
									Only {connection.rtTime}m to change to the
									{connection.name}.
								{/if}
							</div>
						{/if}
					</AlertCard>
				{/snippet}
			</AlternativeConnection>
		{:else if connection.status === 'warning'}
			<AlertCard status="minor" class="mt-2" Icon={GitCompareArrowsIcon}>
				{connection.rtTime}m to change to the {connection.name}
			</AlertCard>
		{:else if connection.status === 'alternative'}
			<AlternativeConnection
				from={connection.from}
				to={connection.to}
				time={filter?.times.rt.arr}
				index={connection.connectionIndex}
				existingRid={connection.rid}
				allowance={connection.schTime}
			>
				{#snippet children(service, switchTo, switching)}
					<AlertCard status="minor" class="mt-2 font-normal" Icon={GitCompareArrowsIcon}>
						{#if service}
							{@render connectionAlternative(
								`${connection.rtTime}m to change to the ${connection.name}, you may want to switch to this alternative.`,
								`${service.times.plan.dep} to ${service.destination?.map((d) => d.name).join(', ')} (Exp. ${service.times.rt.dep === service.times.plan.dep ? 'On time' : service.times.rt.dep})`,
								connection.acrossLondon,
								switchTo,
								switching
							)}
						{:else}
							<div class="font-semibold">
								{connection.rtTime}m to change to the {connection.name}
							</div>
						{/if}
					</AlertCard>
				{/snippet}
			</AlternativeConnection>
		{/if}
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
			<div>
				If you have an "Advance" ticket, you will need to buy a new ticket. However, if this is a
				connecting train you will be entitled to take the next train (this includes split tickets).
				Most other tickets will be valid on the next train(s).
			</div>
			<div>
				<AlternativeConnection
					from={data.focusCrs}
					to={data.filterCrs}
					time={dayjs(data.service.date).format('HH:mm')}
					allowance={10}
					existingRid={data.service_id}
					{index}
				>
					{#snippet children(service, switchTo, switching, failed)}
						<Item.Root variant="outline">
							{#if failed}
								<div>
									<Item.Title>Could not find an alternative</Item.Title>
									<Item.Description
										><a
											class="block"
											href="/board/{data.focusCrs}?to={data.filterCrs}&offset={dayjs(
												data.service.date
											)
												.add(15, 'minutes')
												.diff(dayjs(), 'minute')}">Make a search</a
										>
										<a href="https://www.nationalrail.co.uk"
											>or use the national rail journey planner</a
										></Item.Description
									>
								</div>
							{:else if service}
								<div class="w-full">
									<Item.Title>An alternative was found</Item.Title>
									<Item.Description class="grow text-foreground">
										<div>
											<BoardItem
												class="h-18 pt-2"
												id={service.rid}
												href="#"
												crs={data.focusCrs}
												rtDep={service.times.rt.dep}
												planDep={service.times.plan.dep}
												destination={service.destination}
												isCancelled={service.isCancelled}
												departed={service.departed}
												platform={service.platform}
												operator={service.operator}
											></BoardItem>
										</div>
									</Item.Description>
								</div>
								<Item.Actions class="w-full">
									<Button
										variant="default"
										class="w-full"
										onclick={() => switchTo().then(() => (showMissedDialog = false))}
									>
										{#if switching}
											<Spinner />
										{:else}
											Switch
										{/if}
									</Button>
								</Item.Actions>
							{:else}
								<Item.Title><Spinner /> Searching for an alternative</Item.Title>
							{/if}
						</Item.Root>
					{/snippet}
				</AlternativeConnection>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
