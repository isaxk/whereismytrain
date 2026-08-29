<script lang="ts">
	import { page } from '$app/state';

	import {
		ArrowUp,
		ChevronRight,
		CircleAlertIcon,
		ClockArrowUpIcon,
		ClockArrowDownIcon,
		GitCompareArrowsIcon,
		RotateCcwClock,
		House
	} from '@lucide/svelte/icons';
	import { flip } from 'svelte/animate';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import BoardHeader from '$lib/components/board/board-header.svelte';
	import ResultItem from '$lib/components/board/result-item.svelte';
	import AlertCard from '$lib/components/ui/alert-card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { BoardDetails, BoardNotice, Notice, RouteResultItem } from '$lib/types/index.js';
	import { cn } from '$lib/utils.js';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';
	import customParseFormat from 'dayjs/plugin/customParseFormat';

	dayjs.extend(customParseFormat);

	let { data } = $props();

	let details: BoardDetails | null = $state(null);
	let results: RouteResultItem[] | null = $state(null);
	let notices: BoardNotice[] | null = $state(null);
	let loading = $state(true);
	let lastData = $state(data);
	let timeSpentLoading = $state(0);

	$effect(() => {
		if (lastData.crs !== data.crs || lastData.to !== data.to || lastData.time !== data.time) {
			loading = true;
			results = null;
			lastData = data;
		}
		data.board.then((board) => {
			details = board.details;
			results = board.results;
			notices = board.notices;
			loading = false;
		});
	});

	onMount(() => {
		let loadingStartTime = Date.now();
		const interval = setInterval(() => {
			if (loading) {
				timeSpentLoading = Date.now() - loadingStartTime;
			}
		}, 100);
		return () => clearInterval(interval);
	});

	function serviceUrl(rid: string) {
		const search = new SvelteURLSearchParams();
		if (data.to) search.set('to', data.to);
		if (data.time) search.set('time', data.time);
		return `/board/${data.crs}/t/${rid}?${search.toString()}`;
	}

	const earlierUrl = $derived.by(() => {
		if (!details || !results) return null;
		const search = new SvelteURLSearchParams(page.url.search);
		const date = data.time ? dayjs(data.time, 'HHmm') : dayjs();

		const timeframe =
			results.length > 2
				? Math.max(
						5,
						dayjs(results[results.length - 1].from.planTime).diff(
							results[0].from.planTime,
							'minutes'
						) - 10
					)
				: 45;

		const earlier = date.subtract(timeframe, 'minutes');

		if (dayjs(date.set('h', 0).set('m', 1)).isAfter(earlier)) {
			if (data.tomorrow) {
				search.set('time', earlier.format('HHmm'));
				search.set('tomorrow', 'true');
			} else {
				if (date.hour() === 0 && date.minute() === 1) {
					return null;
				} else {
					search.set('time', '0001');
				}
			}
		} else {
			search.set('time', earlier.format('HHmm'));
		}

		return `/board/${data.crs}?${search.toString()}`;
	});

	const laterUrl = $derived.by(() => {
		if (!details || !results) return null;
		const search = new SvelteURLSearchParams(page.url.search);
		const date = data.time ? dayjs(data.time, 'HHmm') : dayjs();

		const timeframe =
			results.length > 2
				? Math.max(
						5,
						dayjs(results[results.length - 1].from.planTime).diff(
							results[0].from.planTime,
							'minutes'
						) - 5
					)
				: 60;

		const laterDate = date.add(timeframe, 'minutes');

		if (dayjs(date.set('h', 23).set('m', 59)).isBefore(laterDate)) {
			if (data.tomorrow) {
				if (date.hour() === 23 && date.minute() === 59) {
					return null;
				} else {
					search.set('time', '2359');
				}
			} else {
				search.set('time', laterDate.format('HHmm'));
				search.set('tomorrow', 'true');
			}
		} else {
			search.set('time', laterDate.format('HHmm'));
		}

		return `/board/${data.crs}?${search.toString()}`;
	});
</script>

<BoardHeader from={data.crs} to={page.data.to} {details} />

{#if notices && notices.length > 0}
	<div class="" in:fade={{ duration: timeSpentLoading > 0 ? 150 : 0 }}>
		<Dialog.Root>
			<Dialog.Trigger
				class={cn([
					'w-full overflow-hidden border-y drop-shadow-xs',
					{
						'border-blue-500 bg-blue-100 text-black dark:bg-blue-900 dark:text-white': notices.some(
							(n) => n.severity === 'info'
						),
						'border-yellow-500 bg-yellow-100 text-black dark:bg-yellow-600/30 dark:text-white':
							notices.some((n) => n.severity === 'minor'),
						'border-red-500 bg-red-100 text-black dark:bg-red-900 dark:text-white': notices.some(
							(n) => n.severity === 'major'
						),
						'border-white bg-black text-red-100': notices.some((n) => n.severity === 'severe')
					}
				])}
			>
				<div
					class="group flex w-full flex-col items-start gap-1 border-foreground/20 px-4 py-2 text-sm font-medium data-[state=open]:border-b"
				>
					<div class="flex w-full items-center gap-2">
						<div class="min-w-5">
							<CircleAlertIcon size={18} />
						</div>
						<div class="flex min-w-0 grow items-center">
							<div class="flex min-w-0 grow flex-col items-start">
								<div>
									{#if notices.some((n) => n.severity === 'severe')}
										Severe disruption
									{:else if notices.some((n) => n.severity === 'major')}
										Major disruption
									{:else if notices.some((n) => n.severity === 'minor')}
										Disruption
									{:else}
										{notices.length} notice{notices.length !== 1 ? 's' : ''}
									{/if}
								</div>
							</div>

							{#if notices.some((n) => n.severity !== 'info')}
								<!-- <div class="grow"></div> -->
								<span class="inline font-normal text-nowrap">
									{notices.length} alert{notices.length !== 1 ? 's' : ''}
								</span>
							{/if}
						</div>
						<!-- <div class="grow"></div> -->

						<div class="transition-all group-data-[state=open]:rotate-180">
							<ChevronRight size={18} />
						</div>
					</div>
					<div
						class="w-full truncate text-left text-xs/4 font-normal text-muted-foreground group-data-[state=open]:hidden"
					>
						{@html notices[0]?.body}
					</div>
				</div>
			</Dialog.Trigger>
			<Dialog.Content class="flex max-h-[90%] flex-col gap-0 overflow-hidden p-0">
				<div class="px-4 py-3 text-base font-medium">Distruption</div>
				<div class="min-h-0 grow overflow-y-scroll">
					{#each notices as notice, index (index)}
						<AlertCard
							class="border-foreground/10 not-last:border-b"
							Icon={notice.category === 'Connectingservice'
								? GitCompareArrowsIcon
								: notice.category === 'Station'
									? House
									: CircleAlertIcon}
							status={(notice.severity ?? 'info') as 'info' | 'minor' | 'major' | 'severe'}
						>
							<div
								class={[
									'prose text-sm  dark:prose-invert prose-p:text-sm',
									notice.severity === 'severe' ? 'text-red-100 prose-invert' : ''
								]}
							>
								{@html notice.body}
							</div>
						</AlertCard>
					{/each}
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</div>
{/if}

<div class="grow flex flex-col">
	<div class="flex p-2 px-3">
		<Button variant="secondary" disabled={!earlierUrl} href={earlierUrl}
			><ClockArrowUpIcon /> Earlier trains</Button
		>
		<div class="grow"></div>
		{#if details?.time || (!details && data.time)}
			<Button
				href={data.to ? `/board/${data.crs}?to=${data.to}` : `/board/${data.crs}`}
				variant="secondary"><RotateCcwClock /> Now</Button
			>
		{/if}
	</div>
	{#if results}
		<div class="grow" in:fade={{ duration: timeSpentLoading > 100 ? 150 : 0 }}>
			{#each results as result (result.id + result.from.planTime)}
				<a
					href={serviceUrl(result.id)}
					animate:flip={{ duration: 150 }}
					in:fade={{ duration: 100 }}
					class="block odd:bg-muted/40"
				>
					<ResultItem item={result} />
				</a>
			{/each}
		</div>
	{:else if loading}
		<div in:fade={{ duration: 100 }}>
			{#each Array(10)}
				<div class="flex items-center gap-4 px-4 py-4 odd:bg-muted/20">
					<div class="flex min-w-0 grow flex-col gap-2">
						<div class="flex flex-wrap items-center gap-1 text-sm/3">
							<Skeleton class="h-4 w-14" />
							<Skeleton class="h-3 w-32" />
						</div>
						<div class="flex items-start gap-0">
							<div class="flex w-full flex-col gap-0.5">
								<Skeleton class="h-5 w-10" />
								<Skeleton class="h-3 w-10" />
							</div>
							<div class="flex justify-center gap-0 pr-2 opacity-5">
								<ChevronRight class="animate-pulse" size={20} />
							</div>
							<div class="flex w-full flex-col gap-0.5">
								<Skeleton class="h-5 w-10" />
								<Skeleton class="h-3 w-10" />
							</div>
						</div>
					</div>
					<Skeleton class={['h-12 w-10 rounded']}></Skeleton>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex p-2 px-3">
		<Button variant="secondary" disabled={!laterUrl} href={laterUrl}
			><ClockArrowDownIcon /> Later trains</Button
		>
	</div>
</div>
