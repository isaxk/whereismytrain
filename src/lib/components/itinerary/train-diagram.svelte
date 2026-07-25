<script lang="ts">
	import dayjs from 'dayjs';
	import {
		Bus,
		CircleQuestionMarkIcon,
		ClockAlert,
		Dot,
		EllipsisVertical,
		Rss,
		Trash,
		TriangleAlertIcon
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	import type { CallingPoint, Operator, SavedTrainServiceInfo, TrainService } from '$lib/types';

	import ChangeNotifier from '../ui/change-notifier.svelte';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { buttonVariants } from '../ui/button';
	import * as DropdownMenu from '../ui/dropdown-menu';

	let {
		crs,
		filter,
		planDep,
		rtDep,
		delay,
		departed,
		planArr,
		rtArr,
		arrived,
		filterDelay,
		from,
		to,
		destination,
		platform,
		isPlatformConfirmed,
		isCancelled,
		isCancelledAtFilter,
		operator,
		showDate = false,
		onRemove = () => {}
	}: SavedTrainServiceInfo & { showDate?: boolean; onRemove?: () => void } = $props();

	const planDepTime = $derived(dayjs(planDep).format('HH:mm'));
	const rtDepTime = $derived(rtDep ? dayjs(rtDep).format('HH:mm') : null);
	const planArrTime = $derived(dayjs(planArr).format('HH:mm'));
	const rtArrTime = $derived(rtArr ? dayjs(rtArr).format('HH:mm') : null);

	let now = $state(dayjs());

	const timeUntilRtDep = $derived(rtDep ? dayjs(rtDep).diff(now, 'minutes') : null);
	const timeUntilRtArr = $derived(rtArr ? dayjs(rtArr).diff(now, 'minutes') : null);

	onMount(() => {
		const interval = setInterval(() => {
			now = dayjs();
		}, 1000);

		return () => clearInterval(interval);
	});

	const duration = $derived.by(() => {
		let arrival = dayjs(planArr);
		let departure = dayjs(planDep);

		if (rtArr && rtDep) {
			arrival = dayjs(rtArr);
			departure = dayjs(rtDep);
		}

		let diff = arrival.diff(departure, 'minutes');

		if (diff > 60 && diff % 60 !== 0) {
			return `${Math.floor(diff / 60)}h ${diff % 60}m`;
		} else if (diff >= 60 && diff % 60 === 0) {
			return `${Math.floor(diff / 60)}h`;
		} else {
			return `${diff}m`;
		}
	});

	const remaining = $derived.by(() => {
		let arrival = dayjs(planArr);

		if (rtArr && rtDep) {
			arrival = dayjs(rtArr);
		}

		const diff = arrival.diff(now, 'minutes');
		if (diff < 0) {
			return null;
		} else if (diff > 60 && diff % 60 !== 0) {
			return `${Math.floor(diff / 60)}h ${diff % 60}m`;
		} else if (diff >= 60 && diff % 60 === 0) {
			return `${Math.floor(diff / 60)}h`;
		} else {
			return `${diff}m`;
		}
	});
</script>

{#if showDate}
	<div class="translate-y-2 border-b border-border px-2 pb-2 text-sm font-medium">
		{dayjs(rtDep ?? planDep).format('ddd DD MMM')}
	</div>
{/if}

<div class="relative overflow-hidden rounded-lg">
	<div class="flex min-h-6 items-center justify-center px-3">
		<div class="flex w-full flex-col justify-center px-0 py-2 text-xs">
			<ChangeNotifier
				value={destination}
				class="flex w-max items-center gap-1 truncate pr-5 text-xs/4"
			>
				<div
					class="h-max w-max rounded-sm px-1.5 py-0.5 text-[10px]/3 text-white"
					style:background={operator.color}
				>
					{operator.name}
				</div>

				<div class="min-w-0 grow truncate">
					to
					{destination}
				</div>
			</ChangeNotifier>

			<ChangeNotifier class="w-max" value="{delay}{filterDelay}{departed}{arrived}{isCancelled}">
				{#if isCancelled}
					<div class="flex items-center gap-1 text-xs/4 font-medium text-danger">
						<X size={16} /> Cancelled
					</div>
				{:else if timeUntilRtDep !== null && timeUntilRtDep < 60}
					<div class="pt-1">
						{#if arrived && filterDelay !== null && filterDelay !== 0}
							<div class="flex items-center gap-1 font-medium text-warning">
								<ClockAlert size={14} />
								<div class="flex items-center">
									Arrived
									{Math.floor(filterDelay)} min{Math.floor(filterDelay) !== 1 ? 's' : ''}
									{#if filterDelay > 0}late{:else}early{/if}
								</div>
							</div>
						{:else if arrived && filterDelay !== null && filterDelay === 0}
							<div class="flex items-center gap-1 font-medium text-good">
								<ClockAlert size={14} />
								Arrived on time
							</div>
						{:else if departed && filterDelay !== null && filterDelay !== 0 && timeUntilRtArr !== null}
							<div class="flex items-center gap-1 font-medium text-warning">
								<Rss size={14} />
								<div class="flex items-center">
									{#if timeUntilRtArr < 1}
										0 min remaining
									{:else}
										{remaining} remaining
									{/if}

									<Dot size={14} />

									<div class={[timeUntilRtArr >= 60 ? 'font-medium' : 'font-normal']}>
										Arrival {Math.floor(filterDelay)}m
										{#if filterDelay > 0}late{:else}early{/if}
									</div>
								</div>
							</div>
						{:else if departed && filterDelay === 0 && timeUntilRtArr !== null}
							<div class="flex items-center gap-1 font-medium text-good">
								<Rss size={14} />

								<div class="flex items-center">
									{#if timeUntilRtArr < 1}
										0 min remaining until arrival
									{:else}
										{remaining} remaining until arrival
									{/if}
								</div>
							</div>
						{:else if departed}
							<div class="flex items-center gap-1 font-medium">Departed</div>
						{:else if delay !== null && delay !== 0}
							<div class="flex items-center gap-1 font-medium text-warning">
								<Rss size={14} />
								<div class="flex items-center">
									{#if timeUntilRtDep < 1}
										now
										<Dot size={14} />
									{:else if timeUntilRtDep < 60}
										in {timeUntilRtDep} min{Math.floor(timeUntilRtDep) !== 1 ? 's' : ''}
										<Dot size={14} />
									{/if}

									<div class={[timeUntilRtDep >= 60 ? 'font-medium' : 'font-normal']}>
										{Math.floor(delay)} min{Math.floor(delay) !== 1 ? 's' : ''}
										{#if delay > 0}late{:else}early{/if}
									</div>
								</div>
							</div>
						{:else if delay !== null}
							<div class="flex items-center gap-1 font-medium text-good">
								<Rss size={14} />

								{#if timeUntilRtDep < 1}
									now
								{:else if timeUntilRtDep < 60}
									in {timeUntilRtDep} min{Math.floor(timeUntilRtDep) !== 1 ? 's' : ''}
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</ChangeNotifier>

			<!-- <div class="w-max text-xs">
			{#if arrived}
				<div class="text-[10px] text-muted-foreground">{duration}</div>
			{:else if departed}
				<div class="text-[10px] text-muted-foreground">
					<span class="text-foreground">{remaining}</span> / {duration} remaining
				</div>
			{:else}
				<div class="text-[10px] text-muted-foreground">{duration}</div>
			{/if}
		</div> -->
		</div>
		<div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={[buttonVariants({ variant: 'outline', size: 'icon' })]}>
					<EllipsisVertical />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<!-- <DropdownMenu.Item onclick={() => (showMissedDialog = true)}></DropdownMenu.Item> -->
					<a
						href="/board/{crs}?to={filter}&time={dayjs(planDep).add(10, 'minutes').format('HHmm')}"
					>
						<DropdownMenu.Item>
							<TriangleAlertIcon /> Alternatives
						</DropdownMenu.Item>
					</a>

					<DropdownMenu.Item onclick={onRemove} variant="destructive"
						><Trash /> Remove</DropdownMenu.Item
					>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
	<div class="pt-0">
		<div class="flex items-center  px-2">
			<div class="flex w-12 justify-end">
				<ChangeNotifier value={delay} class="flex w-max flex-col items-end text-sm tabular-nums">
					{#if isCancelled}
						<div class="text-sm/4 text-danger line-through">{planDepTime}</div>
					{:else if delay === null}
						<div class="text-sm/3 text-foreground/75">{planDepTime}</div>
						{#if departed}
							<div class="text-[10px]/3">Unknown</div>
						{:else}
							<div class="text-sm/3 font-medium text-warning">Delayed</div>
						{/if}
					{:else if planDepTime !== rtDepTime}
						<div class="text-sm/4 text-foreground/75">{planDepTime}</div>
						<div class="flex items-center gap-0.5 text-sm/3 font-medium text-warning">
							{rtDepTime}
						</div>
					{:else}
						<div class="text-sm/3">{planDepTime}</div>
						{#if dayjs(planDep)?.diff(now, 'minutes') < 5 * 60 || delay >= 1}
							<div class="flex items-center gap-0.5 text-xs font-medium text-good">On time</div>
						{/if}
					{/if}
				</ChangeNotifier>
			</div>
			<div class="flex h-10 min-w-10 flex-col items-center justify-center">
				<div class="w-1.5 grow"></div>
				<div class="flex h-1.5 min-w-4" style:background={operator.color}></div>
				<div class="w-1.5 grow" style:background={operator.color}></div>
			</div>

			<div class="min-w-0 grow">
				<div class="flex">
					<div class="grow text-base/6 font-medium">
						{from}
					</div>
					<ChangeNotifier
						value={platform}
						class={[
							'-mr-1 flex items-center justify-center gap-1 px-1 text-right text-base/5',
							platform === 'BUS' && 'text-sm text-warning',
							!isPlatformConfirmed && 'text-muted-foreground'
						]}
					>
						{#if platform === 'BUS'}
							<Bus size={16} /> Bus
						{:else}
							<span class="text-xs/4 text-muted-foreground sm:text-xs/6">Platform </span>

							{#if platform}
								{platform !== 'BUS' ? (platform ?? '-') : ''}
							{/if}
							{#if !platform || !isPlatformConfirmed}
								<CircleQuestionMarkIcon size={16} />
							{/if}
						{/if}
					</ChangeNotifier>
				</div>
			</div>
		</div>
		<!-- <div class="flex h-2 items-center px-2">
		<div class="w-12"></div>
		<div class="flex h-full w-10 flex-col items-center justify-center">
			<div class="w-1.5 grow" style:background={operator.color}></div>
		</div>
	</div> -->

		<div class="flex h-16 items-center px-2">
			<div class="flex w-12 justify-end">
				<ChangeNotifier
					value={filterDelay}
					class="flex w-max flex-col items-end text-sm tabular-nums"
				>
					{#if isCancelledAtFilter}
						<div class="text-sm/3 text-danger line-through">{planArrTime}</div>
					{:else if filterDelay === null}
						<div class="text-sm/4 text-foreground/75">{planArrTime}</div>
						<div class="text-xs/3 font-medium text-warning">Delayed</div>
					{:else if planArrTime !== rtArrTime}
						<div class="text-sm/4 text-foreground/75">{planArrTime}</div>
						<div class="flex items-center gap-0.5 text-sm/3 font-medium text-warning">
							{rtArrTime}
						</div>
					{:else}
						<div class="text-sm/3">{planArrTime}</div>
						{#if dayjs(planDep)?.diff(now, 'minutes') < 5 * 60}
							<div class="flex items-center gap-0.5 text-xs font-medium text-good">On time</div>
						{/if}
					{/if}
				</ChangeNotifier>
			</div>
			<div class="flex h-full w-10 flex-col items-center justify-center">
				<div class="w-1.5 grow" style:background={operator.color}></div>
				<div class="flex h-1.5 min-w-4" style:background={operator.color}></div>

				<div class="w-1.5 grow"></div>
			</div>
			<div class="grow font-medium">
				<div class="text-base/5">
					{to}
				</div>
				<ChangeNotifier value={isCancelledAtFilter && !isCancelled}>
					{#if isCancelledAtFilter && !isCancelled}
						<div class="text-xs/4 font-medium text-danger">Cancelled</div>
					{/if}
				</ChangeNotifier>
			</div>
		</div>
	</div>
</div>
