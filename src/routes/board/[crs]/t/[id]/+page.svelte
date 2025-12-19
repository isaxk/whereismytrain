<script lang="ts">
	import CallingPointItem from '$lib/components/calling-point-item.svelte';
	import { headerColor, mapData, paneHeight } from '$lib/state/map.svelte.js';
	import {
		ArrowLeft,
		Bell,
		BellRing,
		Bookmark,
		Bus,
		ChevronDown,
		ChevronLeft,
		GitBranchIcon,
		Split
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { invalidate, invalidateAll } from '$app/navigation';
	import type { Operator, TrainService } from '$lib/types';
	import { onDestroy, onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Skeleton from '$lib/components/skeleton.svelte';
	import { page } from '$app/state';
	import Disruption from '$lib/components/disruption.svelte';
	import Formation from '$lib/components/formation.svelte';
	import ThirdPartyFormation from '$lib/components/third-party-formation.svelte';
	import SavedToggle from '$lib/components/saved-toggle.svelte';
	import AlertCard from '$lib/components/alert-card.svelte';

	let { data }: { data: PageData } = $props();

	$effect(() => {
		data.service.then(async (r) => {
			serviceData = r;
			headerColor.current = r.operator.color;
			const response = await fetch(`/api/mapdata`, {
				body: JSON.stringify({ locations: r.locations, formedFrom: r.formedFrom }),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const data = await response.json();
			mapData.service = data;
		});
	});
	onDestroy(() => {
		mapData.service = null;
		serviceData = null;
		headerColor.current = null;
	});

	onMount(() => {
		const interval = setInterval(() => {
			invalidateAll();
		}, 10000);
		return () => clearInterval(interval);
	});

	let serviceData: TrainService | null = $state(null);
	let showPrevious = $state(false);
	let showFurther = $state(false);

	const previousIncludesStartDivide = $derived(
		serviceData
			? (serviceData as TrainService).callingPoints.some(
					(cp) => cp.order === 'previous' && cp.startDivide
				)
			: false
	);
</script>

{#snippet lineButton(
	onclick: () => void,
	show: boolean,
	name: string,
	operator: Operator,
	inDivision: boolean
)}
	<button class="flex h-8 items-center gap-2 text-left" {onclick}>
		<div class="flex gap-3">
			<div class="w-10"></div>
			<div class="w-10"></div>
		</div>
		{#if inDivision}
			<div class="w-2"></div>
		{/if}
		<div class="flex h-full w-3 justify-center">
			<div style:background={operator.color} class="h-full w-1.5 bg-black"></div>
		</div>
		<div class="flex items-center gap-1 pl-2 text-sm font-medium">
			<div class={[show && 'rotate-180', 'transition-transform duration-200']}>
				<ChevronDown size={16} />
			</div>
			{show ? 'Hide' : 'Show'}
			{name}
		</div>
	</button>
{/snippet}

{#if serviceData}
	{@const { operator, title, callingPoints, isBus, destination } = serviceData as TrainService}

	<div
		in:fade|global={{ duration: 200 }}
		class="sticky top-0 z-20 flex h-18 w-full items-center p-4 pt-6 text-white"
		style:background-color={operator.color}
	>
		<div class="absolute top-1.5 right-0 left-0 flex h-2 justify-center">
			<div class="bg-background/40 h-[5px] w-10 rounded-sm"></div>
		</div>
		<div class="w-10">
			<a href={data.backTo ?? `../${page.url.search}`} class="p-4 text-white"><ArrowLeft /></a>
		</div>
		<div class="min-w-0 grow text-center">
			<div class="text-xs">
				{operator.name}
			</div>
			<div
				class="flex w-full items-center justify-center gap-1 overflow-hidden text-sm font-medium text-nowrap text-ellipsis"
			>
				<!-- {#if isBus}<Bus size={16} />{/if} -->
				{title}
			</div>
		</div>
		<div class="flex min-w-10 justify-end">
			<SavedToggle
				service={serviceData}
				crs={data.crs}
				rid={data.id}
				focus={data.crs}
				filter={data.to ?? null}
			/>
		</div>
	</div>
	<div in:fade|global={{ duration: 200 }} class="flex flex-col gap-4 p-4">
		{#if isBus || destination.length > 1 || serviceData.reasonCode}
			<div class="flex flex-col gap-2">
				{#if isBus}
					<AlertCard Icon={Bus} status="info">This is a bus service.</AlertCard>
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

		{#if serviceData.formation && !serviceData.formationLengthOnly}
			<Formation formation={serviceData.formation} />
		{:else if !isBus}
			<ThirdPartyFormation
				placeholder={serviceData.formation ?? null}
				op={operator.id}
				uid={serviceData.uid}
				sdd={serviceData.sdd}
				crs={data.crs}
				length={serviceData.formation ? serviceData.formation?.length : null}
			/>
		{/if}
		<div class="flex flex-col">
			<div class="text-muted-foreground flex gap-4 text-xs">
				<div class="flex w-28 gap-2">
					<div class="w-10">Arr.</div>
					<div class="w-10">Dep.</div>
				</div>
				<div class="grow">Station</div>
				<div>Platform</div>
			</div>
			{#each callingPoints as cp, i (cp.tiploc + cp.times.plan.dep + i)}
				{#if (cp.order !== 'previous' && cp.order !== 'origin' && !(cp.order === 'post-destination' && previousIncludesStartDivide)) || ((cp.order === 'previous' || cp.order === 'origin' || cp.order === 'post-destination') && showPrevious)}
					{@const next = callingPoints[i + 1]}
					{@const prev = callingPoints[i - 1]}
					{#if cp.order === 'focus' && callingPoints.filter((c) => c.order === 'previous' || c.order === 'origin').length > 0}
						{@render lineButton(
							() => (showPrevious = !showPrevious),
							showPrevious,
							'previous',
							operator,
							cp.inDivision
						)}
						<!-- {:else if cp.order === 'destination' && callingPoints.filter((c) => c.order === 'further').length > 0}
						{@render lineButton(
							() => (showFurther = !showFurther),
							showFurther,
							'further',
							operator,
							cp.inDivision
						)} -->
					{/if}
					<div transition:slide={{ duration: 200 }}>
						{#if cp.startDivide}
							<div class="flex h-8 gap-2">
								<div class="flex gap-3">
									<div class="w-10"></div>
									<div class="w-10"></div>
								</div>
								<div
									style:color={operator.color}
									class={['flex h-full w-8 flex-col justify-center pl-[3px]']}
								>
									<svg
										width="32"
										height="31.999998"
										viewBox="0 0 8.4666667 8.466666"
										version="1.1"
										id="svg1"
										xmlns="http://www.w3.org/2000/svg"
									>
										<defs id="defs1" />
										<g id="layer1">
											<path
												style="fill:currentColor;stroke:currentColor;stroke-width:1.5875;stroke-linecap:square;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
												d="M 0.80000001,1 V 7.7000003"
												id="path3"
											/>
											<path
												style="fill:currentColor;stroke:currentColor;stroke-width:1.5875;stroke-linecap:square;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
												d="M 0.80000001,0.80000003 V 1.0000001 A 2.5370203,2.5370203 68.487467 0 0 1.4823183,2.7310554 l 2.8353635,3.0378895 a 2.5370203,2.5370203 68.487467 0 1 0.6823183,1.7310553 v 0.2000001"
												id="path4"
											/>
										</g>
									</svg>
								</div>
							</div>
							<div class="flex h-4 min-h-4 gap-2">
								<div class="flex gap-3">
									<div class="w-10"></div>
									<div class="w-10"></div>
								</div>
								<div class="flex h-full w-12 items-center justify-start pl-[3px]">
									<div
										style:background="linear-gradient(to bottom, {operator.color}, transparent)"
										class="h-4 w-1.5 bg-black"
									></div>
									<div class="w-2.5"></div>
									<div style:background={operator.color} class="h-4 w-1.5 bg-black"></div>
								</div>
							</div>
						{/if}

						<CallingPointItem
							{cp}
							{operator}
							index={i}
							length={callingPoints.length}
							nextCancelled={next?.isCancelled}
							prevCancelled={prev?.isCancelled}
						/>
						{#if cp.endDivide && (showPrevious || !previousIncludesStartDivide)}
							<div class="flex h-4 min-h-4 gap-2">
								<div class="flex gap-3">
									<div class="w-10"></div>
									<div class="w-10"></div>
								</div>
								<div class="flex h-full w-12 items-center justify-start pl-[3px]">
									<div
										style:background="linear-gradient(to top, {operator.color}, transparent)"
										class="h-4 w-1.5 bg-black"
									></div>
									<div class="w-2.5"></div>
									<div class="h-4 w-1.5 bg-transparent"></div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<div
		in:fade|global={{ duration: 100, delay: 150 }}
		class="border-border sticky top-0 flex h-18 items-center border-b p-4 pt-6"
	>
		<div class="absolute top-1.5 right-0 left-0 flex h-2 w-full items-center">
			<div class="bg-background/40 h-[5px] w-10 rounded-sm"></div>
		</div>
		<a href="../{page.url.search}" class="w-10"><ArrowLeft /></a>
		<div class="flex h-[36px] grow flex-col items-center justify-center gap-1">
			<Skeleton class="h-3 w-20" />
			<Skeleton class="h-4 w-32" />
		</div>
		<div class="w-10"></div>
	</div>
	<div in:fade|global={{ duration: 100, delay: 150 }} class="flex h-full flex-col p-4">
		{#each Array(10) as _, i}
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
