<script lang="ts">
	import type { Carriage } from '$lib/types';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Accessibility, ArrowLeft, Bike, Toilet, VolumeOffIcon } from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import { ca } from 'zod/locales';

	let {
		formation,
		destinations
	}: { formation: Carriage[] | null; destinations?: string[] | null } = $props();

	const showIconBar = $derived(
		formation?.some(
			(c) => c.serviceClass === 'first' || c.toilet || c.toiletIsAccessible || c.bikeSpace
		)
	);

	const frontLength = $derived(formation?.filter((c) => c.isFrontSection).length);
</script>

<div in:fade={{ duration: 200 }} class=" h-max min-h-max overflow-x-scroll overflow-y-clip">
	{#if frontLength && formation && frontLength !== formation?.length}
		<div class="flex gap-1 pb-1 text-xs text-nowrap">
			<div class="min-w-14"></div>
			<div
				class="relative flex items-center justify-end gap-1 px-2"
				style:min-width="{frontLength * 64 + (frontLength - 1) * 4}px"
			>
				<ArrowLeft size={14} />
				to {destinations?.[0]}
				<div class="absolute top-0 -right-[3px] -bottom-18 w-px bg-muted-foreground"></div>
			</div>
			<div class="flex grow items-center gap-1 px-2">
				to {destinations?.[1]}
				<ArrowRight size={14} />
			</div>
		</div>
	{/if}
	<div class="flex gap-1">
		<div
			class="h-16 min-w-14 rounded-tl-[100%] rounded-r-md rounded-bl-xl border-2 border-border bg-muted drop-shadow-xs"
		></div>
		{#each formation as carriage, i (JSON.stringify(carriage) + i)}
			<div
				class="relative flex h-16 min-w-16 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border border-border bg-background drop-shadow-xs"
			>
				{#if carriage.loading !== null}
					<div
						style:height="{Math.min(90, Math.max(10, carriage.loading))}%"
						class={[
							'absolute right-0 bottom-0 left-0 z-0',
							{
								'bg-green-100 dark:bg-green-950': carriage.loading < 40,
								'bg-yellow-100 dark:bg-yellow-950': carriage.loading > 40 && carriage.loading < 70,
								'bg-red-100 dark:bg-red-950': carriage.loading >= 70
							}
						]}
					></div>
				{/if}
				<div class="z-10 text-sm font-semibold">
					{carriage.coachNumber ?? i + 1}
				</div>
				{#if showIconBar}
					<div class="z-10 flex h-4 items-center gap-1">
						{#if carriage.serviceClass === 'first'}
							<div
								class="flex items-end rounded bg-foreground px-1 py-px text-[8px]/4 font-bold text-background"
							>
								1
								<span class="ml-[.5px] text-[6px]/4 font-light"> st</span>
							</div>
						{/if}
						{#if carriage.toilet}
							<Toilet size={12} />
						{/if}
						{#if carriage.toiletIsAccessible}
							<Accessibility size={12} />
						{/if}
						{#if carriage.bikeSpace}
							<Bike size={12} />
						{/if}
						{#if carriage.quietSpace}
							<VolumeOffIcon size={12} />
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if formation?.some((f) => f.loading && f.loading !== null)}
		<div class="pt-1 text-right text-[10px]/3 text-foreground/60">
			* Colours indicate seat availability. <br />
			A "full" carriage may still have standing room.
		</div>
	{/if}
</div>
