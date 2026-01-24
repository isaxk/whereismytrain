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

	let { data } = $props();

	let currentStop = $state(0);
	const currentTime = $derived.by(() => {
		if (currentStop === 0) {
			return data.time;
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
	<div class="flex grow flex-col items-center">
		<div
			class={['', currentStop + 1 === data.stopsArray.length ? 'text-base font-medium' : 'text-xs']}
		>
			Your journey from {data.stopsArray[0]} to {data.stopsArray[data.stopsArray.length - 1]}
		</div>
		{#if currentStop + 1 < data.stopsArray.length}
			<div class="font-medium">
				Leg {currentStop + 1}: {data.stopsArray[currentStop]} to {data.stopsArray[currentStop + 1]}
			</div>
		{/if}
	</div>
	<div class="w-9"></div>
</div>

<div class="p-4">
	{#if currentTime && currentStop + 1 < data.stopsArray.length}
		{#if currentStop === 0}
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
		{/if}
		<Leg
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
		<Finished services={services.filter((s) => s !== null)} />
	{/if}
</div>
