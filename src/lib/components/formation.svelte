<script lang="ts">
	import type { Carriage } from '$lib/types';
	import { Accessibility, Bike, Toilet } from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import { ca } from 'zod/locales';

	let { formation }: { formation: Carriage[] | null } = $props();

	const showIconBar = $derived(
		formation?.some(
			(c) => c.serviceClass === 'first' || c.toilet || c.toiletIsAccessible || c.bikeSpace
		)
	);

	console.log(formation)
</script>

<div in:fade={{ duration: 200 }}>
	<div class="flex gap-1 overflow-x-scroll">
		{#each formation as carriage, i}
			<div
				class="bg-background border-border relative flex h-16 min-w-16 flex-col items-center justify-center gap-0.5 rounded border drop-shadow-xs"
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
					{carriage.coachNumber ?? i + 1} {carriage.loading}
				</div>
				{#if showIconBar}
					<div class="z-10 flex h-4 items-center gap-1">
						{#if carriage.serviceClass === 'first'}
							<div
								class="bg-foreground text-background flex items-end rounded px-1 py-px text-[8px]/4 font-bold"
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
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if formation?.some((f) => f.loading && f.loading !== null)}
		<div class="text-foreground/60 pt-1 text-right text-[10px]/3">
			* Colours indicate seat availability. <br />
			A "full" carriage may still have standing room.
		</div>
	{/if}
</div>
