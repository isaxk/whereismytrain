<script lang="ts">
	import { preloadCode } from '$app/navigation';

	import dayjs from 'dayjs';
	import {
		ArrowDownRight,
		BadgeQuestionMarkIcon,
		Bus,
		Check,
		CircleQuestionMark,
		CircleQuestionMarkIcon,
		ClockAlert,
		Dot,
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
		isPlatformConfirmed = null,
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
		isPlatformConfirmed?: boolean | null;
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
	const timeUntilRtDep = $derived(dayjs(rtDep).diff(now, 'm'));

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

<a {href} class="flex">
	<div class="flex min-w-0 grow flex-col">
		<div>
			<div class="h-4 w-18 min-w-18 bg-muted/50"></div>
		</div>
		<div class="flex min-h-5 items-start">
			<div
				class="kerning flex h-full min-w-18 items-start bg-muted/50 pl-4 font-sans text-base/4 font-semibold tracking-tight tabular-nums"
			>
				<div class="flex items-center text-base/5">
					{dayjs(planDep).format('HH:mm')}
				</div>
			</div>
			<div class="flex min-h-5 min-w-0 grow items-start px-3">
				<div class={['flex min-w-0 grow flex-wrap items-center gap-x-1 text-base/5 font-medium']}>
					{#each destination as dest, i (dest.crs)}
						<div class="truncate">
							{#if i !== 0}
								<span class="text-foreground/60">&</span>
							{/if}

							{dest.name}

							<!-- <div class="translate-y-0.5 text-[10px] font-normal text-muted-foreground opacity-60">
								({dest.crs})
							</div> -->
						</div>
					{/each}
				</div>
			</div>
		</div>
		<div>
			<div class="h-0.5 w-18 min-w-18 bg-muted/50"></div>
		</div>
		{#if destination[0].via}
			<div class="flex h-4 items-center">
				<div class="h-full min-w-18 bg-muted/50"></div>

				<div class="min-w-0 grow truncate px-3 text-xs/4 font-light text-muted-foreground">
					{destination[0].via}
				</div>
			</div>
			<div>
				<div class="h-0.5 w-18 min-w-18 bg-muted/50"></div>
			</div>
		{/if}
		<div class="flex h-5 items-center">
			<div class="flex h-5 min-w-18 items-center bg-muted/50 pl-4">
				<ChangeNotifier
					class="font-semibold tracking-tight text-warning tabular-nums"
					value={rtDep}
				>
					{#if delay && Math.abs(delay) >= 1}
						{dayjs(rtDep).format('HH:mm')}
					{/if}
				</ChangeNotifier>
			</div>
			<div class="flex h-5 min-w-0 grow items-center px-3">
				<ChangeNotifier
					value={(delay?.toString() ?? 'Delayed') + isCancelled + isFilterCancelled}
					class={cn([
						'flex min-w-0 grow items-center gap-1 text-xs font-medium text-muted-foreground',
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
							{#if departed}
								Departed
							{:else}
								<div class="flex items-center gap-0">
									{#if !departed && timeUntilRtDep !== null && timeUntilRtDep < 60}
										{#if timeUntilRtDep < 1}
											now
										{:else}
											in {timeUntilRtDep} min{#if timeUntilRtDep !== 1}s{/if}
										{/if}
									{:else}
										On time
									{/if}
								</div>
							{/if}
						{:else}
							Scheduled
						{/if}
					{:else}
						<Rss size={14} />

						<div class="flex items-center gap-0">
							{#if !departed && timeUntilRtDep < 60}
								{#if timeUntilRtDep < 1}
									now
								{:else}
									in {timeUntilRtDep} min{#if timeUntilRtDep !== 1}s{/if}
								{/if}

								<Dot class="text-warning/80" size={14} />
								<div class="font-normal text-warning/90">
									{Math.floor(delay)} min{Math.floor(delay) !== 1 ? 's' : ''}
									{#if delay > 0}late{:else}early{/if}
								</div>
							{:else}
								<div>
									{#if departed}
										Departed
									{/if}
									{Math.floor(delay)} min{Math.floor(delay) !== 1 ? 's' : ''}
									{#if delay > 0}late{:else}early{/if}
								</div>
							{/if}
						</div>
					{/if}
				</ChangeNotifier>

				<div class="grow"></div>
			</div>
		</div>

		<div>
			<div class="h-4 w-18 min-w-18 bg-muted/50"></div>
		</div>
	</div>
	<div class="flex flex-col items-end gap-0.5 py-4 pr-3">
		<ChangeNotifier
			class={[
				'flex h-5 flex-nowrap items-center justify-center gap-1 px-1 text-right text-nowrap',
				platform === 'BUS' && 'text-sm/4 text-warning',
				isPlatformConfirmed == false && 'font-light text-muted-foreground/80',
				isPlatformConfirmed == true && ''
			]}
			value={platform}
		>
			{#if platform === 'BUS'}
				<Bus size={16} /> Bus
			{:else}
				<span class="text-xs/3 text-muted-foreground"
					>Platform {#if isPlatformConfirmed !== true && platform}
						Est.
					{/if}</span
				>

				{#if platform}
					<div class={['font-normal', !isPlatformConfirmed && 'text-sm/3']}>
						{platform !== 'BUS' ? (platform ?? '-') : ''}
					</div>
				{:else}
					<CircleQuestionMark strokeWidth={2} size={14} />
				{/if}
			{/if}
		</ChangeNotifier>
		<div class="flex h-5 w-full items-center justify-end">
			<div
				class="h-max w-max rounded-[6px] px-[5px] py-px text-[10px] text-nowrap text-white"
				style:background={operator.color}
			>
				{operator.name}
			</div>
		</div>
	</div>
</a>
