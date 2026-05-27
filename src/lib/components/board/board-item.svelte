<script lang="ts">
	import { preloadCode } from '$app/navigation';

	import dayjs from 'dayjs';
	import {
		ArrowDownRight,
		BadgeQuestionMarkIcon,
		Bus,
		Check,
		CircleQuestionMarkIcon,
		ClockAlert,
		GitCompareArrowsIcon,
		List,
		ListIcon,
		Radio,
		Rss,
		Table,
		Table2,
		X
	} from 'lucide-svelte';

	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { DestinationOrigin, Operator } from '$lib/types';
	import { cn, dayjsFromHHmm } from '$lib/utils';
	import ChangeNotifier from '../ui/change-notifier.svelte';

	let {
		href,
		trainid,
		uid,
		isCancelled,
		isFilterCancelled = false,
		rtDep,
		planDep,
		delay,

		reason,
		departed,
		focus = null,
		destination,
		platform,
		filter,
		operator,
		date = null,
		isToday = true,
		class: className = '',
		filterName = null,
		connection = null
	}: {
		href: string;
		trainid?: string;
		uid?: string;
		isCancelled: boolean;
		isFilterCancelled?: boolean;
		rtDep: string | null;
		planDep: string;
		delay: number | null;

		reason: string | null;
		departed: boolean;
		focus?: string | null;
		destination: DestinationOrigin[];
		platform: string | null;
		filter?: {
			name: string | null;
			planArr: string;
			rtArr: string | null;
			isCancelled: boolean;
			arrived: boolean;
		} | null;
		operator: Operator;
		date?: string | null;
		isToday?: boolean;
		filterName?: string | null;
		class?: string;
		connection?: {
			schTime: number;
			rtTime: number | null;
			name: string;
			status: string;
			acrossLondon: boolean;
		} | null;
	} = $props();

	let oldRtDep = $state(rtDep);
	let oldDeparted = $state(departed);
	let oldPlatform = $state(platform);
	let oldisCancelled = $state(isCancelled);
	let oldisFilterCancelled = $state(isFilterCancelled);
	let oldFilter = $state(filter);

	$effect(() => {
		if (href !== '#') {
			preloadCode(href);
		}
	});

	let now = $state(dayjs());

	const timeUntilDeparture = $derived(dayjs(date).diff(now, 'm'));

	explicitEffect(
		() => {
			setTimeout(() => {
				oldRtDep = rtDep;
				oldDeparted = departed;
				oldPlatform = platform;
				oldisCancelled = isCancelled;
				oldisFilterCancelled = isFilterCancelled;
				oldFilter = filter;
			}, 2500);
		},
		() => [rtDep, departed, platform, isCancelled, isFilterCancelled, filter]
	);
</script>

<!-- <a
	{href}
	class={cn([
		'flex w-full flex-col justify-center rounded text-left',
		connection && connection.rtTime && connection.status === 'ok'
			? 'min-h-28 gap-1'
			: filter
				? 'min-h-22 gap-1'
				: 'min-h-22 gap-0.5',
		className
	])}
>
	<div class={['flex h-max items-center gap-2']}>
		<div class="flex min-w-12 flex-col justify-end font-medium">
			{#if trainid && uid}
				{trainid} - {uid}
			{/if}
			{#if isToday}
				{planDep || 'N/A'}
			{:else}
				{planDep || 'N/A'}
			{/if}
		</div>

		<div class="flex items-center gap-1">
			<div class={['truncate text-base/5 font-medium']}>
				{destination.map((d) => d.name).join(', ')}
			</div>
		</div>
		<div class="grow"></div>
		<ChangeNotifier
			changed={oldPlatform !== platform}
			class={[
				'-mr-1 items-center justify-center px-1 text-right',
				platform === 'BUS' && 'text-sm text-warning'
			]}
		>
			{#if platform === 'BUS'}
				<Bus size={16} /> Bus service
			{:else}
				<span class="text-xs text-muted-foreground">Platform </span>

				{platform !== 'BUS' ? (platform ?? '-') : ''}
			{/if}
		</ChangeNotifier>
	</div>
	{#if destination[0].via}
		<div class="-mt-0.5 flex gap-2">
			<div class="min-w-12"></div>
			<div class="text-xs/4 font-light text-muted-foreground">
				{destination[0].via}
			</div>
		</div>
	{/if}

	<div class="flex items-start gap-2 py-0.5">
		<div class="min-w-12">
			{#if delay && Math.abs(delay) > 0}
				<ChangeNotifier
					changed={oldDeparted !== departed || oldRtDep !== rtDep}
					class="text-sm/4 font-medium text-warning"
				>
					{rtDep}
				</ChangeNotifier>
			{/if}
		</div>

		{#if isCancelled}
			<ChangeNotifier
				changed={oldisCancelled !== isCancelled}
				class="flex items-start gap-0.5 text-xs/4 font-medium text-danger"
			>
				<X size={14} />
				<div>
					Cancelled

				</div>
			</ChangeNotifier>
		{:else if delay && Math.abs(delay) > 0}
			<ChangeNotifier
				changed={oldDeparted !== departed || oldRtDep !== rtDep}
				class="flex items-start gap-0.5 overflow-hidden text-left text-xs/4 font-medium text-warning"
			>
				<div class="min-w-4">
					<ClockAlert size={14} />
				</div>

				<div>
					{delay}m late

				</div>
			</ChangeNotifier>
		{:else if delay !== null && Math.abs(delay) < 1}
			<ChangeNotifier
				changed={oldDeparted !== departed || oldRtDep !== rtDep}
				class="flex items-start text-xs/4 font-medium text-good"
			>
				<Rss size={12} />
				On time
			</ChangeNotifier>
		{:else if delay === null}
			<ChangeNotifier
				changed={oldDeparted !== departed || oldRtDep !== rtDep}
				class="flex items-start gap-0.5 text-xs/4 font-medium text-warning"
			>
				<div class="min-w-4">
					<ClockAlert size={14} />
				</div>
				<div>
					Delayed

				</div>
			</ChangeNotifier>
		{/if}

		<div class="grow"></div>
		<div
			class="-mt-1 h-max rounded-md px-1.5 py-0.5 text-[10px] text-nowrap text-white"
			style:background={operator.color}
		>
			{operator.name}
		</div>
	</div>

	{#if filter}
		<div class="flex items-center gap-2">
			{#if filter.isCancelled}
				{#if !isCancelled}
					<ChangeNotifier
						changed={oldFilter?.isCancelled !== filter.isCancelled}
						class="pb-2 text-xs text-danger"
					>
						<X size={14} /> Cancelled to {filter.name}
					</ChangeNotifier>
				{/if}
			{:else}
				<div class="flex min-w-0 gap-1 overflow-hidden text-xs text-nowrap text-muted-foreground">
					<ArrowDownRight size={16} />
					<div class="truncate">
						{#if filter.arrived}
							Arrived
						{:else}
							Expected arrival
						{/if}

						{#if !destination.some((d) => d.name === filter?.name)}
							at
							<span class="font-medium text-foreground">
								{#if filter?.name && filter?.name?.includes('London ') && filter.name !== 'London Bridge'}
									{filter?.name.replace('London ', '').replace(' (Intl)', '')}
								{:else}
									{filter?.name?.replace(' (Intl)', '')}
								{/if}
							</span>
						{/if}
					</div>
					{#if filter.planArr === filter.rtArr}
						<div class="flex items-center gap-0.5 text-good">
							<Check size={12} />
							{filter.rtArr}
						</div>
					{:else}
						<div class="flex items-center gap-1 text-warning">
							<ClockAlert size={12} />
							{filter.rtArr ?? 'Unknown'}
						</div>
					{/if}
				</div>
			{/if}
			<div class="grow"></div>
		</div>
		{#if connection && connection.rtTime && connection.status === 'ok'}
			<div class="flex items-center gap-1 pl-0.5 text-xs text-muted-foreground">
				<GitCompareArrowsIcon size={12} />
				{connection.rtTime}m to change to the {connection.name}
			</div>
		{/if}
	{:else if isFilterCancelled && !isCancelled}
		<div class="flex items-center gap-0 text-xs">
			<ChangeNotifier
				changed={oldisFilterCancelled !== isFilterCancelled}
				class="text-xs text-danger"
			>
				<X size={14} /> Cancelled to {filterName}
			</ChangeNotifier>
		</div>
	{/if}
</a> -->

<a {href} class="flex">
	<div class="flex h-full min-w-17 flex-col bg-muted/30 py-4 pl-4">
		<div class="kerning flex h-5 items-center font-sans font-semibold tracking-tight tabular-nums">
			{dayjs(planDep).format('HH:mm')}
		</div>
		{#if destination[0].via}
			<div class="h-4"></div>
		{:else}
			<div></div>
		{/if}
		<div class="flex h-6 items-center">
			<ChangeNotifier class="font-semibold tracking-tight text-warning tabular-nums" value={rtDep}>
				{#if delay && Math.abs(delay) >= 1}
					{dayjs(rtDep).format('HH:mm')}
				{/if}
			</ChangeNotifier>
		</div>

		<!-- {#if reason && (delay === null || Math.abs(delay) >= 1 || isCancelled || isFilterCancelled)}
			<div class="h-3"></div>
		{/if} -->
		<!-- <div class="h-5"></div> -->
	</div>
	<div class="flex min-w-0 grow flex-col py-4 pr-3 pl-2">
		<div class="flex h-5 items-center">
			<div class={['flex min-w-0 grow text-base/5 font-medium']}>
				{#each destination as dest, i (dest.crs)}
					<div class="flex min-w-0 items-end gap-0.5">
						<div class="min-w-0 truncate">
							{dest.name}
						</div>
						{#if destination.map((d) => d.name).join(' & ').length < 30}
							<div class="translate-y-0.5 text-[10px] font-normal text-muted-foreground opacity-60">
								({dest.crs})
							</div>
						{/if}
						{#if i < destination.length - 1}
							&nbsp;&&nbsp;
						{/if}
					</div>
				{/each}
			</div>
			<ChangeNotifier
				class={[
					'-mr-1 items-center justify-center px-1 text-right',
					platform === 'BUS' && 'text-sm text-warning'
				]}
				value={platform}
			>
				{#if platform === 'BUS'}
					<Bus size={16} /> Bus service
				{:else}
					<span class="text-xs text-muted-foreground">Platform </span>

					{platform !== 'BUS' ? (platform ?? '-') : ''}
				{/if}
			</ChangeNotifier>
		</div>
		{#if destination[0].via}
			<div class="flex h-4 items-center">
				<div class="min-w-0 grow truncate text-xs/4 font-light text-muted-foreground">
					{destination[0].via}
				</div>
				<div
					class="-mb-1.5 h-max w-max rounded-[6px] px-[5px] py-px text-[10px] text-nowrap text-white"
					style:background={operator.color}
				>
					{operator.name}
				</div>
			</div>
		{:else}
			<div></div>
		{/if}
		<div class="flex h-6 items-center gap-1.5">
			<ChangeNotifier
				value={(delay?.toString() ?? 'Delayed') + isCancelled + isFilterCancelled}
				class={cn([
					'flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground',
					{
						'text-good':
							delay !== null &&
							Math.abs(delay) < 1 &&
							dayjs(date).diff(dayjs(), 'minutes') < 5 * 60,
						'text-warning': delay === null || Math.abs(delay) >= 1,
						'text-danger': isCancelled
					}
				])}
			>
				{#if isCancelled}
					<X size={14} />
					Cancelled
				{:else if isFilterCancelled}
					<X size={14} />
					Cancelled to {filterName}
				{:else if delay === null}
					<ClockAlert size={14} />
					Delayed
				{:else if Math.abs(delay) < 1}
					{#if dayjs(date).diff(dayjs(), 'minutes') < 5 * 60}
						<Rss size={14} />
						On time
					{:else}
						Scheduled
					{/if}
				{:else if delay <= -1}
					<ClockAlert size={14} />
					{Math.floor(-delay)} minute{Math.floor(-delay) !== 1 ? 's' : ''} early
				{:else}
					<ClockAlert size={14} />
					{Math.floor(delay)} minute{Math.floor(delay) !== 1 ? 's' : ''} late
				{/if}
			</ChangeNotifier>

			<div class="grow"></div>

			{#if !destination[0].via}
				<div
					class="h-max w-max rounded-[6px] px-[5px] py-px text-[10px] text-nowrap text-white"
					style:background={operator.color}
				>
					{operator.name}
				</div>
			{/if}
		</div>
		<!-- {#if isFilterCancelled && !isCancelled}
			<div class="flex h-4 items-center gap-1 text-xs font-medium text-danger">
				<X size={14} />
				Cancelled to {filterName}
			</div>
		{/if} -->
		<!-- {#if reason && (delay === null || Math.abs(delay) >= 1 || isCancelled || isFilterCancelled)}
			<div
				class={cn([
					'flex h-3 w-full items-center gap-1 text-[10px] text-muted-foreground',
					{
						'text-warning': delay === null || Math.abs(delay) >= 1,
						'text-danger': isCancelled || isFilterCancelled
					}
				])}
			>
				<div class="min-w-3">
					<BadgeQuestionMarkIcon size={12} />
				</div>
				<div class="min-w-0 grow truncate">
					Due to
					{reason}
				</div>
			</div>
		{/if} -->
	</div>
</a>
