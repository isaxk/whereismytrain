<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { SavedTrain } from '$lib/types';
	import {
		ArrowUpRight,
		BellOff,
		Bus,
		Check,
		ClockAlert,
		GitCompareArrowsIcon,
		Trash,
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
	import Button from '../ui/button/button.svelte';
	import AlternativeConnection from './alternative.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let { data, index }: { data: SavedTrain; index: number } = $props();

	let service = $derived(data.service);
	let lastRefreshed = $state(null);

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

	const focus = $derived(service?.callingPoints?.find((cp) => cp.crs === data.focusCrs));
	const filter = $derived(service?.callingPoints?.find((cp) => cp.crs === data.filterCrs));
	let now = $state(dayjs());

	const timeUntilDeparture = $derived(focus ? dayjs(focus.rtDepDate).diff(now, 'minute') : 0);

	const connection = $derived.by(() => {
		if (!filter || focus?.isCancelled || filter?.isCancelled) return null;

		const connection = saved.value.find((s) => {
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
				console.log(schDiff);
				if (schDiff && schDiff < (acrossLondon ? 120 : 90) && schDiff > (acrossLondon ? 10 : 1))
					return true;
			}
			return false;
		});
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

<div
	class={[
		'relative py-4 transition-all duration-300',
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
		{#if focus}
			<BoardItem
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
			/>
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
								<div class="font-normal underline">
									{service.times.plan.dep} to {service.destination?.map((d) => d.name).join(', ')} (Exp.
									{service.times.rt.dep})
								</div>
								<div class="text-xs text-muted-foreground">
									Please check your ticket is valid on this service
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
							<div class="flex items-center">
								<div>
									<div class="font-semibold">
										Connection {#if connection.acrossLondon}(via Tube){/if} to the {connection.name}
										may no longer be possible, but an alternative was found.
									</div>
									<div class="font-normal underline">
										{service.times.plan.dep} to {service.destination?.map((d) => d.name).join(', ')}
										(Exp.
										{service.times.rt.dep})
									</div>
									<div class="text-xs text-muted-foreground">
										Please check your ticket is valid on this service
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
							<div class="flex items-center">
								<div>
									<div class="font-semibold">
										{#if connection.rtTime < 1}
											Connection {#if connection.acrossLondon}(via Tube){/if} to the {connection.name}
											no longer possible, but an alternative was found.
										{:else}
											{connection.rtTime}m to change {#if connection.acrossLondon}(via Tube){/if} to
											the {connection.name} (likely impossible), but an alternative was found.
										{/if}
									</div>
									<div class="font-normal underline">
										{service.times.plan.dep} to {service.destination?.map((d) => d.name).join(', ')}
										(Exp.
										{service.times.rt.dep})
									</div>
									<div class="text-xs text-muted-foreground">
										Please check your ticket is valid on this service
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
						{:else}
							<div class="font-semibold">
								{#if connection.rtTime < 1}
									Connection {#if connection.acrossLondon}(via Tube){/if} to the {connection.name} no
									longer possible.
								{:else}
									{connection.rtTime}m to change {#if connection.acrossLondon}(via Tube){/if} to the
									{connection.name} (likely impossible).
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
							<div class="flex items-center">
								<div>
									<div class="font-semibold">
										Only {connection.rtTime}m to change {#if connection.acrossLondon}(via Tube){/if}
										to the {connection.name}, you may want to switch to this alternative
									</div>
									<div class="font-normal underline">
										{service?.times.plan.dep} to {service?.destination
											?.map((d) => d.name)
											.join(', ')} (Exp.
										{service?.times.rt.dep})
									</div>
									<div class="text-xs text-muted-foreground">
										Please check your ticket is valid on this service
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
						{:else}
							<div class="font-semibold">
								status='alternative'
								{connection.rtTime}m to change {#if connection.acrossLondon}(via Tube){/if} to the {connection.name}
							</div>
						{/if}
					</AlertCard>
				{/snippet}
			</AlternativeConnection>
		{/if}
	{/if}
	<Button onclick={() => remove()} variant="outline" class="absolute top-18 right-0" size="icon-sm"
		><X /></Button
	>
</div>
