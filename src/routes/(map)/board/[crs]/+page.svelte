<script lang="ts">
	import { page } from '$app/state';

	import dayjs from 'dayjs';
	import {
		ArrowDown,
		ArrowUp,
		Bus,
		CircleAlertIcon,
		Clock,
		GitCompareArrowsIcon,
		House,
		Rows2,
		Rows4
	} from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { fade, fly } from 'svelte/transition';

	import BoardHeader from '$lib/components/board/board-header.svelte';
	import BoardItemComponent from '$lib/components/board/board-item.svelte';
	import AlertCard from '$lib/components/ui/alert-card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import StationsJSON from '$lib/data/stations.json';
	import { mapData } from '$lib/state/map.svelte.js';
	import { localStore } from '$lib/state/saved.svelte.js';
	import { Category, Severity, type BoardDetails, type BoardItem } from '$lib/types/index.js';

	let { data } = $props();

	let details: BoardDetails | null = $state(null);
	let services: BoardItem[] | null = $state(null);
	let error: string | null = $state(null);

	const view = localStore<'expanded' | 'collapsed'>('board-view-style', 'expanded');

	$effect(() => {
		const station = StationsJSON.find((s) => s.crsCode === data.crs);
		const to = StationsJSON.find((s) => s.crsCode === page.data.to);

		if (station) {
			if (to) {
				mapData.board = [
					[station?.long ?? 0, station?.lat ?? 0],
					[to?.long ?? 0, to?.lat ?? 0]
				];
			} else {
				mapData.board = [[station?.long ?? 0, station?.lat ?? 0]];
			}
		}
	});

	$effect(() => {
		untrack(() => {
			// // console.log(
			// 	// 'page.data.time',
			// 	// page.data.time,
			// 	'details.requestedTime',
			// 	details?.requestedTime
			// );
			if (
				details &&
				(page.data.crs !== details.crs ||
					page.data.to !== details.filterCrs ||
					page.data.time != details.requestedTime)
			) {
				services = null;
			}
		});

		data.board
			.then((d) => {
				details = d.details;
				services = d.services;
			})
			.catch((e) => {
				error = e.message ?? 'An unknown error occured';
			});
	});

	function offsetUrl(offset: number) {
		const url = new URL(page.url);

		const date = dayjs().add(offset, 'minute');

		// console.log(
		// 	'offset',
		// 	offset,
		// 	'date',
		// 	date.format('YYYY-MM-DD HH:mm'),
		// 	'dayjs()',
		// 	dayjs().format('YYYY-MM-DD HH:mm')
		// );

		if (offset === 0) {
			url.searchParams.delete('time');
			url.searchParams.delete('tomorrow');
			return url.toString();
		} else {
			url.searchParams.delete('tomorrow');
			if (!date.isSame(dayjs(), 'day')) {
				url.searchParams.set('tomorrow', 'true');
			}
			url.searchParams.set('time', date.format('HHmm'));
			return url.toString();
		}
	}

	const laterUrl = $derived.by(() => {
		if (services && details) {
			if (services.length < 2) return offsetUrl(details.offset + 60);
			const first = services[0];
			const last = services[services.length - 1];
			if (!last.rawTime || !first.rawTime) return offsetUrl(details.offset + 60);
			const diff = dayjs(last.rawTime).diff(dayjs(first.rawTime), 'minute');
			// console.log('later', 'diff+details.offset', diff + details.offset);
			return offsetUrl(details.offset + diff);
		} else {
			return '#';
		}
	});

	const earlierUrl = $derived.by(() => {
		if (services && details) {
			if (services.length < 2) return offsetUrl(details.offset - 20);
			const first = services[0];
			const last = services[services.length - 1];
			if (!last.rawTime || !first.rawTime) return offsetUrl(details.offset - 20);
			const diff = dayjs(last.rawTime).diff(dayjs(first.rawTime), 'minute');
			// console.log('earlier', 'details.offset-diff', details.offset - diff);
			return offsetUrl(details.offset - diff);
		} else {
			return '#';
		}
	});

	function serviceUrl(rid: string) {
		const search = new SvelteURLSearchParams();
		if (data.to) search.set('to', data.to);
		if (data.time) search.set('time', data.time);
		return `/board/${data.crs}/t/${rid}?${search.toString()}`;
	}
</script>

<svelte:head>
	{#if details}
		<title>{details.name} to {details.filterName} - Departures</title>
	{:else}
		<title>Where is my train?</title>
	{/if}
</svelte:head>

<div class="flex w-full pb-10" in:fade|global={{ duration: 200 }}>
	{#if !page.data.service}
		<div class={['min-w-full']}>
			<BoardHeader from={data.crs} to={page.data.to} {details} />

			{#if (details && details.notices.length > 0) || error}
				<div class="flex flex-col gap-2 px-4 pt-4" in:fade|global={{ duration: 200 }}>
					{#if error}
						<AlertCard status="major">{error}</AlertCard>
					{/if}
					{#each details?.notices as notice, index (index)}
						<AlertCard
							Icon={notice.category === Category.Connectingservice
								? GitCompareArrowsIcon
								: notice.category === Category.Station
									? House
									: CircleAlertIcon}
							status={(Severity[notice.severity] ?? 'info') as
								| 'info'
								| 'minor'
								| 'major'
								| 'severe'}
						>
							<div class="prose text-xs dark:prose-invert prose-p:text-xs">
								{@html notice.xhtmlMessage}
							</div>
						</AlertCard>
					{/each}
				</div>
			{/if}

			{#if services || !error}
				<div class="" in:fade|global={{ duration: 200 }}>
					<Tabs.Root class="gap-0" bind:value={view.value}>
						<div class="flex items-center gap-2 border-b border-border px-4 py-2">
							{#if page.data.offset !== -119}
								<Button href={earlierUrl} variant="secondary">
									<ArrowUp size={18} />
									Earlier trains
								</Button>
							{/if}
							<div class="grow"></div>
							{#if page.data.offset != 0}
								<Button href={offsetUrl(0)} variant="secondary">
									<Clock size={18} />
									Now
								</Button>
							{/if}
							<Tabs.List>
								<Tabs.Trigger value="expanded"><Rows2 /></Tabs.Trigger>
								<Tabs.Trigger value="collapsed"><Rows4 /></Tabs.Trigger>
							</Tabs.List>
						</div>

						<Tabs.Content value="expanded" class="flex flex-col">
							{#if services}
								<div class="" in:fade|global={{ duration: 200 }}>
									{#each services as service (service.rid)}
										<div
											class="border-b border-border px-4 transition-all odd:bg-muted/40"
											animate:flip={{ duration: 200 }}
											out:fly={{ duration: 200, x: -50 }}
										>
											<BoardItemComponent
												href={serviceUrl(service.rid)}
												date={service.rawTime}
												isToday={dayjs(service.rawTime).isSame(dayjs(), 'day')}
												planDep={service.times.plan.dep ?? 'N/A'}
												rtDep={service.times.rt.dep}
												departed={service.departed}
												isCancelled={service.isCancelled}
												isFilterCancelled={service.isFilterCancelled}
												destination={service.destination}
												platform={service.platform}
												operator={service.operator}
												filterName={details?.filterName}
											/>
										</div>
									{/each}
								</div>
							{:else}
								<div in:fade|global={{ duration: 200, delay: 200 }}>
									{#each Array(10)}
										<div
											class="flex h-22 w-full flex-col justify-center gap-1 border-b border-border p-4"
										>
											<div class="flex items-center">
												<div class="w-16"><Skeleton class="h-4 w-12" /></div>
												<div class="grow"><Skeleton class="h-4 w-2/3" /></div>
												<div class="w-16 text-right"><Skeleton class="ml-auto h-4 w-10" /></div>
											</div>
											<div class="flex items-center gap-4 text-sm">
												<Skeleton class="h-4 w-24" />
												<div class="grow"></div>
												<Skeleton class="h-4 w-20 rounded-md" />
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Tabs.Content>
						<Tabs.Content value="collapsed" class="flex flex-col py-2">
							<div class="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground">
								<div class="w-10">TOC</div>
								<div class="w-10">Time</div>
								<div class="grow">Destination</div>
								<div class="">Expected</div>
								<div class="w-5 text-right">Plat</div>
							</div>
							{#if services}
								<div class="" in:fade|global={{ duration: 200 }}>
									{#each services as service, index (service.rid)}
										{#if (index === 0 && !dayjs(service.rawTime).isSame(dayjs(), 'day')) || (index > 0 && !dayjs(service.rawTime).isSame(dayjs(services[index - 1].rawTime), 'day'))}
											<div
												class="border-b border-border px-4 py-2 text-lg font-semibold odd:bg-muted/40"
											>
												{dayjs(service.rawTime).format('ddd DD MMM')}
											</div>
										{/if}
										<a
											href="/board/{data.crs}/t/{service.rid}{page.url.search}"
											class="flex items-center gap-2 rounded border-t border-border px-4 py-1 even:bg-muted/40"
										>
											<div
												style:background={service.operator.color}
												class="min-w-10 rounded text-center text-white"
											>
												{service.operator.id}
											</div>
											<div class="w-10 font-medium">{service.times.plan.dep}</div>
											<div class="min-w-0 grow truncate">
												{service.destination.map((d) => d.name).join(', ')}

												{#if service.destination[0]?.via}
													<span class="text-xs text-muted-foreground">
														{service.destination[0].via}
													</span>
												{/if}
											</div>
											{#if service.isCancelled}
												<div class="text-nowrap text-danger">Cancelled</div>
											{:else if service.times.plan.dep === service.times.rt.dep}
												<div class="text-nowrap text-good">On time</div>
											{:else}
												<div class="text-nowrap text-warning">
													{service.times.rt.dep ?? 'Delayed'}
												</div>
											{/if}
											{#if service.platform === 'BUS'}
												<div
													class="-mr-1 flex min-w-5 justify-end text-right text-nowrap text-warning"
												>
													<Bus size={18} />
												</div>
											{:else}
												<div class="min-w-5 text-right text-nowrap">
													{service.platform ?? '-'}
												</div>
											{/if}
										</a>
									{/each}
								</div>
							{:else}
								<div in:fade={{ duration: 200, delay: 200 }}>
									{#each Array(20)}
										<div
											class="flex h-[33px] w-full items-center gap-2 border-b border-border px-4 py-1"
										>
											<div class="min--10">
												<Skeleton class="h-4 w-8" />
											</div>
											<div class="min-w-10"><Skeleton class="h-4 w-8" /></div>
											<div class="grow">
												<Skeleton style="width: {Math.random() * 100 + 50}px;" class="h-4 w-12" />
											</div>
											<div class=""><Skeleton class="h-4 w-8" /></div>
											<div class="min-w-5 text-right"><Skeleton class="h-4 w-4" /></div>
										</div>
									{/each}
								</div>
							{/if}
						</Tabs.Content>
						<div class="border-t border-border px-3 py-2">
							<Button href={laterUrl} variant="secondary">
								<ArrowDown size={18} />
								Later trains
							</Button>
						</div>
					</Tabs.Root>
				</div>
			{/if}
		</div>
	{/if}
</div>
