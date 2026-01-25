<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Leg from './leg.svelte';
	import type { CallingPoint, TrainService } from '$lib/types/index.js';
	import TrainDiagram from '$lib/components/itinerary/train-diagram.svelte';
	import { CircleAlert, GitCompareArrowsIcon } from 'lucide-svelte';
	import Finished from './finished.svelte';
	import { dayjsFromHHmm } from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import * as Item from '$lib/components/ui/item';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Tubeicon from '$lib/assets/tubeicon.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let { data } = $props();

	let currentStop = $state(0);
	const currentTime = $derived.by(() => {
		if (currentStop === 0) {
			return dayjsFromHHmm(data.time, false).format('HH:mm');
		}
		const filteredServices = services.filter((s) => s !== null);
		const filter = filteredServices[filteredServices.length - 1].filter;
		let time = filter?.times.rt.arr ?? filter?.times.rt.dep;
		if (time === null) return null;
		if (!services[currentStop - 1]) {
			time = dayjsFromHHmm(time).add(30, 'minutes').format('HH:mm');
		}
		return time;
	});

	let services: ({ service: TrainService; focus: CallingPoint; filter: CallingPoint } | null)[] =
		$state([]);
</script>

<div
	class="sticky top-0 z-20 flex h-18 items-center gap-2 border-b border-b-border bg-background px-4 pt-2 lg:pt-0"
>
	<div class="absolute top-1.5 right-0 left-0 flex h-2 min-w-10 justify-center lg:hidden">
		<div class="h-[5px] w-10 rounded-sm bg-black/40"></div>
	</div>
	<Button
		size="icon"
		variant="outline"
		onclick={() => {
			if (currentStop + 1 === data.stopsArray.length || currentStop <= 0) {
				goto('/');
			} else {
				services.pop();
				currentStop--;
			}
		}}><ArrowLeft size={20} /></Button
	>
	<div class="flex w-full min-w-0 grow flex-col items-center overflow-hidden">
		{#if currentStop + 1 < data.stopsArray.length}
			{@const startPoint = Math.max(
				0,
				Math.min(
					currentStop - 1,
					data.stopsArray.length - (data.stopsArray.length >= 4 ? 3 : data.stopsArray.length)
				)
			)}
			{@const sliced = data.stopsArray
				.map((crs, index) => ({ crs, index }))
				.slice(startPoint, startPoint + (data.stopsArray.length >= 4 ? 3 : data.stopsArray.length))}
			<div class="w-max">
				<div class="flex items-center gap-2">
					{#each sliced as stop, i (stop.crs)}
						<div animate:flip={{ duration: 200 }} class="flex items-center gap-2">
							{#if stop.index > 0 && i === 0}
								<div>...</div>
							{/if}

							<div class="text-sm font-semibold">
								{stop.crs}
							</div>

							{#if i !== sliced.length - 1}
								{@const service = services.find(
									(service) =>
										service?.focus.crs === stop.crs && service?.filter.crs === sliced[i + 1].crs
								)}
								<div
									style:border-color={currentStop === i
										? null
										: service
											? service.service.operator.color
											: null}
									style:color={currentStop === i
										? null
										: service
											? service.service.operator.color
											: null}
									class={[
										'flex h-[30px] w-9 flex-col items-center justify-center gap-[-2px] rounded-lg border border-border px-1  py-0.5 drop-shadow-xs',
										currentStop === stop.index ? 'bg-foreground text-background' : '',
										service && currentStop !== stop.index ? 'border-2 text-white' : '',
										!service &&
										(services.some((s) => s?.focus.crs === data.stopsArray[stop.index + 1]) ||
											currentStop > stop.index + 1)
											? 'bg-muted/20 text-foreground'
											: ''
									]}
								>
									{#if service}
										<!-- <div class="-mb-0.5 w-full text-left text-[10px]">
											{service.focus.times.rt.dep ?? service.focus.times.plan.dep}
										</div>

										<div class="-mt-0.5 w-full text-right text-[10px]">
											{service.filter.times.rt.arr ?? service.filter.times.plan.arr}
										</div> -->
										<ChevronRight size={18} />
									{:else if services.some((s) => s?.focus.crs === data.stopsArray[stop.index + 1]) || currentStop > stop.index}
										<div class="h-4 w-4">
											<Tubeicon />
										</div>
									{:else}
										<ChevronRight size={18} />
									{/if}
								</div>
							{/if}
							{#if stop.index < data.stopsArray.length - 1 && i === sliced.length - 1}
								<div>...</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div
				class={[
					'',
					currentStop + 1 === data.stopsArray.length ? 'text-base font-medium' : 'text-xs'
				]}
			>
				Your journey from {data.stopsArray[0]} to {data.stopsArray[data.stopsArray.length - 1]}
			</div>
		{/if}
	</div>
	<div class="w-9"></div>
</div>

<div class="py-4">
	{#if currentTime && currentStop + 1 < data.stopsArray.length}
		{#if currentStop === 0}
			<div class="px-4 pb-4">
				<Item.Root class="text-xs" variant="outline">
					<Item.Header>
						<div class="flex items-center gap-1">
							<div class="min-w-6">
								<CircleAlert size={16} />
							</div>
							Select your train
						</div>
					</Item.Header>
				</Item.Root>
			</div>
		{/if}
		<Leg
			legIndex={currentStop}
			onSelect={(service) => {
				services.push(service);

				currentStop++;
			}}
			from={data.stopsArray[currentStop]}
			to={data.stopsArray[currentStop + 1]}
			time={currentTime}
			tomorrow={data.tomorrow}
		/>
	{:else if currentStop + 1 >= data.stopsArray.length}
		<div class="px-4">
			<Finished services={services.filter((s) => s !== null)} />
		</div>
	{/if}
</div>
