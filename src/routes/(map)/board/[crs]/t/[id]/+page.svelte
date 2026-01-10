<script lang="ts">
	import { page } from '$app/state';

	import dayjs from 'dayjs';
	import { ArrowLeft, Bus, CalendarIcon, Split } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	import CallingPointItem from '$lib/components/train/calling-point-item.svelte';
	import DetailedView from '$lib/components/train/detailed-view.svelte';
	import Disruption from '$lib/components/train/disruption.svelte';
	import DivideLine from '$lib/components/train/divide-line.svelte';
	import Formation from '$lib/components/train/formation.svelte';
	import LineToggle from '$lib/components/train/line-toggle.svelte';
	import SavedToggle from '$lib/components/train/saved-toggle.svelte';
	import Share from '$lib/components/train/share.svelte';
	import ThirdPartyFormation from '$lib/components/train/third-party-formation.svelte';
	import AlertCard from '$lib/components/ui/alert-card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { headerColor, highlightedStation, mapData } from '$lib/state/map.svelte.js';
	import { refreshing } from '$lib/state/services-subscriber.svelte';
	import type { TrainService } from '$lib/types';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let serviceData: TrainService | null = $state(null);
	let error: Error | null = $state(null);

	let showPrevious = $state(false);
	let detailedView = $state(false);

	$effect(() => {
		data.service
			.then(async (r) => {
				serviceData = r;
				headerColor.current = r.operator.color;
			})
			.catch((e) => {
				error = e;
			});
	});

	onDestroy(() => {
		mapData.service = null;
		serviceData = null;
		headerColor.current = null;
	});

	const previousIncludesStartDivide = $derived(
		serviceData
			? (serviceData as TrainService).callingPoints.some(
					(cp) => cp.order === 'previous' && cp.startDivide
				)
			: false
	);

	$effect(() => {
		if (
			serviceData?.callingPoints.some(
				(cp) => cp.order === 'previous' && highlightedStation.current === cp.crs + cp.rtDepDate
			)
		) {
			showPrevious = true;
		}
	});
</script>

<svelte:head>
	{#if serviceData}
		<title>
			{serviceData.title}</title
		>
	{:else}
		<title>Where is my train?</title>
	{/if}
</svelte:head>

{#if serviceData}
	{@const {
		operator,
		title,
		callingPoints,
		isBus,
		destination,
		isToday,
		date,
		locations,
		category
	} = serviceData as TrainService}

	<div
		in:fade|global={{ duration: 200 }}
		class="dark sticky top-0 z-20 flex h-18 w-full items-center p-4 pt-6 text-white lg:pt-4"
		style:background-color={operator.color}
	>
		<div class="absolute top-1.5 right-0 left-0 flex h-2 justify-center lg:hidden">
			<div class="h-[5px] w-10 rounded-sm bg-input"></div>
		</div>
		<div class="min-w-10 bg-transparent">
			<Button
				size="icon"
				class="bg-input/30 hover:bg-input/50"
				variant="outline"
				href={data.backTo ?? `../${page.url.search}`}><ArrowLeft /></Button
			>
		</div>
		<div class="min-w-0 grow text-center">
			<div class="flex items-center justify-center gap-1 text-xs">
				<div class="w-3">
					{#if refreshing.current || refreshing.map}
						<Spinner class="size-3" />
					{/if}
				</div>
				{operator.name}
				<div class="w-3"></div>
			</div>
			<div class="w-full gap-1 overflow-hidden text-sm font-medium text-nowrap text-ellipsis">
				{title}
			</div>
		</div>
		<div class="flex min-w-10 items-center justify-end">
			<SavedToggle
				service={serviceData}
				crs={data.crs}
				rid={data.id}
				focus={data.crs}
				filter={data.to ?? null}
			/>
		</div>
	</div>
	<div in:fade|global={{ duration: 200 }} class="flex flex-col gap-4 py-4">
		{#if isBus || destination.length > 1 || serviceData.reasonCode || !isToday}
			<div class="flex flex-col gap-2 px-4">
				{#if isBus}
					<AlertCard Icon={Bus} status="info">This is a bus service.</AlertCard>
				{/if}
				{#if !isToday}
					<AlertCard Icon={CalendarIcon} status="info"
						>This service departs <span class="font-semibold"
							>{dayjs(date).format('ddd DD MMM')}</span
						>
					</AlertCard>
				{/if}
				{#if destination.length > 1}
					<AlertCard Icon={Split} status="info"
						>This service divides. Check you are in the correct carriage.</AlertCard
					>
				{/if}

				{#if serviceData.reasonCode}
					{@const focus = callingPoints.find((l) => l.crs === data.crs)}
					<Disruption
						type={focus?.isCancelled ? 'cancel' : 'delay'}
						code={serviceData.reasonCode}
					/>
				{/if}
			</div>
		{/if}

		{#if serviceData.formation && !serviceData.formationLengthOnly && serviceData.formation.length > 0}
			<div class="px-4">
				<Formation
					formation={serviceData.formation}
					destinations={serviceData.destination.map((d) => d.name)}
				/>
			</div>
		{:else if !isBus && isToday}
			<ThirdPartyFormation
				placeholder={serviceData.formation ?? null}
				op={operator.id}
				uid={serviceData.uid}
				sdd={serviceData.sdd}
				crs={data.crs}
				length={serviceData.formation ? serviceData.formation?.length : null}
				destinations={serviceData.destination.map((d) => d.name)}
			/>
		{/if}
		{#if detailedView}
			<div class="px-4">
				<Button variant="outline" onclick={() => (detailedView = false)}>
					Back to simple view
				</Button>
			</div>
			<DetailedView locations={locations.flat()} />
		{:else}
			<div class="flex flex-col px-4">
				<div class="flex gap-4 px-2 pb-2 text-xs text-muted-foreground">
					<div class="w-18">
						<div class="w-10 text-right">Time</div>
						<div class="grow"></div>
					</div>
					<div class="grow">Station</div>
					<div>Platform</div>
				</div>
				{#each callingPoints as cp, i (cp.tiploc + cp.times.plan.dep + i)}
					{#if (cp.order !== 'previous' && cp.order !== 'origin' && !(cp.order === 'post-destination' && previousIncludesStartDivide)) || ((cp.order === 'previous' || cp.order === 'origin' || cp.order === 'post-destination') && showPrevious)}
						{@const next = callingPoints[i + 1]}
						{@const prev = callingPoints[i - 1]}

						{#if cp.order === 'focus' && callingPoints.filter((c) => c.order === 'previous' || c.order === 'origin').length > 0}
							<LineToggle
								bind:show={showPrevious}
								name="previous"
								color={operator.color}
								trainVisible={(callingPoints[i - 1].departed ||
									(callingPoints.some((cp, j) => cp.departed && j < i) && !showPrevious)) &&
									!callingPoints.some((cp, j) => (cp.departed || cp.arrived) && j > i - 1)}
								{category}
								inDivision={cp.inDivision && !cp.startJoin}
							/>
						{/if}

						{#if cp.startDivide}
							<DivideLine type="split" color={operator.color} />
						{/if}

						<CallingPointItem
							{cp}
							{operator}
							{category}
							index={i}
							length={callingPoints.length}
							pickupOnly={!cp.times.plan.arr && i > 0 && !cp.startDivide && !prev.endDivide}
							setdownOnly={!cp.times.plan.dep &&
								i < callingPoints.length - 1 &&
								!cp.endDivide &&
								!next.startDivide &&
								!cp.isDestination}
							showTrain={!(cp.departed && callingPoints[i + 1]?.order === 'focus')}
							greyLine={!callingPoints.some((cp, j) => j > i && !cp.isCancelled) &&
								cp.isCancelled &&
								!callingPoints.some((cp) => cp.inDivision)}
						/>

						{#if cp.endDivide && (showPrevious || !previousIncludesStartDivide)}
							<DivideLine type="end-split" color={operator.color} />
						{/if}
					{/if}
				{/each}
				<div class="flex w-full flex-col gap-2 pt-2">
					<Share
						{title}
						text="Follow this service"
						url={`/share/${data.crs}/${data.id}/${callingPoints.find((cp) => cp.order === 'filter')?.crs}`}
					/>
					{#if !detailedView}
						<Button variant="outline" class="w-full" onclick={() => (detailedView = true)}
							>Switch to detailed view</Button
						>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{:else if error}
	<div
		in:fade|global={{ duration: 100, delay: 150 }}
		class="sticky top-0 flex h-18 items-center border-b border-border p-4 pt-6"
	>
		<div class="absolute top-1.5 right-0 left-0 flex h-2 w-full items-center">
			<div class="h-[5px] w-10 rounded-sm bg-background/40"></div>
		</div>
		<Button
			size="icon"
			class="bg-input/30 hover:bg-input/50"
			variant="outline"
			href={data.backTo ?? `../${page.url.search}`}><ArrowLeft /></Button
		>

		<div class="w-10"></div>
	</div>
	<div class="p-4">
		<AlertCard status="major" class="text-sm">{error.message}</AlertCard>
	</div>
{:else}
	<div
		in:fade|global={{ duration: 100, delay: 150 }}
		class="sticky top-0 flex h-18 items-center border-b border-border p-4 pt-6"
	>
		<div class="absolute top-1.5 right-0 left-0 flex h-2 w-full items-center">
			<div class="h-[5px] w-10 rounded-sm bg-background/40"></div>
		</div>
		<Button
			size="icon"
			class="bg-input/30 hover:bg-input/50"
			variant="outline"
			href={data.backTo ?? `../${page.url.search}`}><ArrowLeft /></Button
		>
		<div class="flex h-9 grow flex-col items-center justify-center gap-1">
			<Skeleton class="h-3 w-20" />
			<Skeleton class="h-4 w-32" />
		</div>
		<div class="w-10"></div>
	</div>
	<div in:fade|global={{ duration: 100, delay: 150 }} class="flex h-full flex-col p-4">
		{#each Array(10), i (i)}
			<div class={['flex h-12 items-center gap-2']}>
				<div class={['-z-10 flex gap-3']}>
					<div class={['w-8']}>
						<Skeleton class="h-3 w-6" />
					</div>
					<div class={['w-8']}><Skeleton class="h-3 w-6" /></div>
				</div>
				<div class={['flex h-full animate-pulse flex-col items-center justify-center pl-2']}>
					{#if i === 0}
						<div class="grow"></div>
						<div class="min-h-1.5 w-4 bg-zinc-300"></div>
						<div class="w-1.5 grow bg-zinc-300"></div>
					{:else if i === 9}
						<div class="w-1.5 grow bg-zinc-300"></div>
						<div class="min-h-1.5 w-4 bg-zinc-300"></div>
						<div class="grow"></div>
					{:else}
						<div class="w-1.5 grow bg-zinc-300"></div>
						<div class="flex w-4 bg-zinc-300">
							<div class="w-[5px]"></div>
							<div class="min-h-1.5 grow bg-zinc-300"></div>
						</div>
						<div class="w-1.5 grow bg-zinc-300"></div>
					{/if}
				</div>
				<div class="min-w-0 grow pl-2">
					<Skeleton style="width: {Math.random() * 100 + 40}px" class="h-3" />
				</div>
				<div class={[]}>
					<Skeleton class="h-4 w-4" />
				</div>
			</div>
		{/each}
	</div>
{/if}
