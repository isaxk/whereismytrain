<script lang="ts">
	import { goto, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Tabs from '$lib/components/ui/tabs';
	import { page } from '$app/state';
	import {
		ArrowDown,
		ArrowLeft,
		ArrowUp,
		Bus,
		Check,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Clock,
		ClockAlert,
		Plus,
		Rows2,
		Rows4,
		X
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import StationsJSON from '$lib/data/stations.json';
	import { mapData } from '$lib/state/map.svelte.js';
	import Search from '$lib/components/search.svelte';
	import AlertCard from '$lib/components/alert-card.svelte';
	import {
		Severity,
		type BoardDetails,
		type BoardItem,
		type TrainService
	} from '$lib/types/index.js';
	import dayjs from 'dayjs';
	import BoardHeader from '$lib/components/board-header.svelte';
	import Skeleton from '$lib/components/skeleton.svelte';
	import BoardItemComponent from '$lib/components/board-item.svelte';

	let { data, children } = $props();

	let details: BoardDetails | null = $state(null);
	let services: BoardItem[] | null = $state(null);
	let error: string | null = $state(null);

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
		services = null;
		data.board
			.then((d) => {
				details = d.details;
				services = d.services;
			})
			.catch((e) => {
				error = e.body?.message ?? 'An unknown error occured';
			});
	});

	function timeToDayjs(v: string) {
		const hour = parseInt(v[0] + v[1]);
		const minute = parseInt(v[3] + v[4]);
		return dayjs().hour(hour).minute(minute);
	}

	function offsetUrl(offset: number) {
		const url = page.url;
		page.url.searchParams.set('offset', Math.max(-119, offset).toString());
		return url.toString();
	}

	const laterUrl = $derived.by(() => {
		return data.board.then((d) => {
			if (d.services.length < 2) return offsetUrl(data.offset + 20);
			const first = d.services[0];
			const last = d.services[d.services.length - 1];
			if (!last.rawTime || !first.rawTime) return offsetUrl(data.offset + 20);
			const diff = dayjs(last.rawTime).diff(dayjs(first.rawTime), 'minute');
			console.log(diff);
			return offsetUrl(data.offset + diff);
		});
	});

	const earlierUrl = $derived.by(() => {
		return data.board.then((d) => {
			if (d.services.length < 2) return offsetUrl(data.offset - 20);
			const first = d.services[0];
			const last = d.services[d.services.length - 1];
			if (!last.rawTime || !first.rawTime) return offsetUrl(data.offset - 20);
			const diff = dayjs(last.rawTime).diff(dayjs(first.rawTime), 'minute');
			// console.log(diff);
			return offsetUrl(data.offset - diff);
		});
	});

	function serviceUrl(rid: string) {
		const search = new URLSearchParams();
		data.to && search.set('to', data.to);
		data.offset && search.set('offset', data.offset.toString());
		return `/board/${data.crs}/t/${rid}?${search.toString()}`;
	}

	let expanded = $state(false);
</script>

<!-- <pre>{JSON.stringify(await getBoard({ crs: data.crs }), null, 2)}</pre> -->

<div class="flex w-full" in:fade|global={{ duration: 200 }}>
	{#if !page.data.service}
		<div class={['min-w-full']}>
			{#if !services}
				<BoardHeader from={data.crs} to={page.data.to} {details} />

				{#if error}
					<div class="text-xl text-red-600">
						{error}
					</div>
				{:else}
					<div class="p-2" in:fade|global={{ duration: 200, delay: 150 }}>
						<div class="border-border flex border-b px-3">
							<a href="#" class="text-foreground/60 flex items-center gap-1 py-3">
								<Skeleton class="h-4 w-24" />
							</a>

							<div class="grow"></div>
							{#if page.data.offset != 0}
								<a href={offsetUrl(0)} class="text-foreground/60 flex items-center gap-1 py-3">
									<Clock size={18} />
									<Skeleton class="h-4 w-10" />
								</a>
							{/if}
						</div>
						{#each Array(10) as _, i}
							<div class="border-border flex h-20 w-full flex-col gap-1 border-b p-4">
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
			{:else}
				<BoardHeader from={data.crs} to={page.data.to} {details} />
				{#if details && details.notices.length > 0}
					<div class="flex flex-col gap-2 px-4 pt-4" in:fade|global={{ duration: 200 }}>
						{#each details.notices as notice, index}
							<AlertCard
								status={Severity[notice.severity] as 'info' | 'minor' | 'major' | 'severe'}
							>
								<div class="prose text-xs dark:prose-invert prose-p:text-xs">
									{@html notice.xhtmlMessage}
								</div>
							</AlertCard>
						{/each}
					</div>
				{/if}
				<Tabs.Root class="gap-0" value="expanded">
					<div class="border-border flex items-center gap-4 border-b px-5 py-2">
						{#if page.data.offset !== -119}
							{#await earlierUrl}
								loading...
							{:then earlierUrl}
								<a href={earlierUrl} class="text-foreground/60 flex h-full items-center gap-1">
									<ArrowUp size={18} />
									Earlier trains
								</a>
							{/await}
						{/if}
						<div class="grow"></div>
						{#if page.data.offset != 0}
							<a href={offsetUrl(0)} class="text-foreground/60 flex h-full items-center gap-1">
								<Clock size={18} />
								Now
							</a>
						{/if}
						<Tabs.List>
							<Tabs.Trigger value="expanded"><Rows2 /></Tabs.Trigger>
							<Tabs.Trigger value="collapsed"><Rows4 /></Tabs.Trigger>
						</Tabs.List>
					</div>
					{#if services.length === 0}
						<div class="p-4">No services found</div>
					{/if}
					<Tabs.Content value="expanded" class="flex flex-col">
						{#each services as service, index (service.rid)}
							<div class="odd:bg-muted/40 border-border border-b px-4">
								<BoardItemComponent
									href={serviceUrl(service.rid)}
									id={service.rid}
									planDep={service.times.plan.dep ?? 'N/A'}
									rtDep={service.times.rt.dep}
									delay={service.delay}
									departed={service.departed}
									isCancelled={service.isCancelled}
									isFilterCancelled={service.isFilterCancelled}
									destination={service.destination}
									platform={service.platform}
									crs={data.crs}
									operator={service.operator}
									filterName={details?.filterName}
								/>
							</div>
						{/each}
					</Tabs.Content>
					<Tabs.Content value="collapsed" class="flex flex-col py-2">
						<div class="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs">
							<div class="w-10">TOC</div>
							<div class="w-10">Time</div>
							<div class="grow">Destination</div>
							<div class="">Expected</div>
							<div class="w-5 text-right">Plat</div>
						</div>
						{#each services as service (service.rid)}
							<a
								href="/board/{data.crs}/t/{service.rid}?{page.url.search}"
								class="even:bg-muted/40 border-border flex items-center gap-2 rounded border-t px-4 py-1"
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
										<span class="text-muted-foreground text-xs">
											{service.destination[0].via}
										</span>
									{/if}
								</div>
								{#if service.isCancelled}
									<div class="text-danger text-nowrap">Cancelled</div>
								{:else if service.times.plan.dep === service.times.rt.dep}
									<div class="text-good text-nowrap">On time</div>
								{:else}
									<div class="text-warning text-nowrap">
										{service.times.rt.dep ?? 'Delayed'}
									</div>
								{/if}
								{#if service.platform === 'BUS'}
									<div class="text-warning -mr-1 flex min-w-5 justify-end text-right text-nowrap">
										<Bus size={18} />
									</div>
								{:else}
									<div class="min-w-5 text-right text-nowrap">
										{service.platform ?? '-'}
									</div>
								{/if}
							</a>
						{/each}
					</Tabs.Content>
					<div class="px-3 pt-1">
						{#await laterUrl}
							loading...
						{:then laterUrl}
							<a href={laterUrl} class="text-foreground/60 flex items-center gap-1 py-2">
								<ArrowDown size={18} />
								Later trains
							</a>
						{/await}
					</div>
				</Tabs.Root>
			{/if}
		</div>
	{/if}

	{#if page.data.service}
		<div class="w-full" in:fade={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>
