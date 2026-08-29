<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { Marker } from 'svelte-maplibre';

	import TrainIconByCategory from '../train/train-icon-by-category.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let {
		trainPosition,
		trainBearing,
		refreshing,
		color,
		isFormedFromTrain,
		rid,
		showDestination,
		category,
		title = null,
		showTitle = false,
		opacity = 100,
		href = null
	} = $props();

	const coordsTween = Tween.of(() => trainPosition);
</script>

<Marker
	lngLat={coordsTween.current}
	onclick={() => href && goto(href)}
	class="relative p-5"
	zIndex={isFormedFromTrain ? 0 : 2000}

>
	{#if title && showTitle}
	<div class={["bg-white absolute left-1/2 -translate-x-1/2 rounded-sm overflow-hidden", trainBearing > 140 && trainBearing < 220 ? 'top-0' : 'bottom-0']}>
		<div
			style:color
			style:opacity
			style:border-color={color}
			class={[
				'box-border w-max rounded-sm border bg-background px-1 py-0 font-sans text-[11px]/4 font-medium text-nowrap drop-shadow backdrop-blur-sm transition-all',

			]}
		>
			{title}
		</div>
	</div>
	{/if}
	<div class="relative rounded-full bg-background">
		<div
			style:border-color={color}
			style:color
			style:opacity
			class={[
				'relative flex flex-col items-center justify-center rounded-full border-2 bg-white',
				isFormedFromTrain ? 'h-8 w-8 opacity-20' : 'h-9 w-9 opacity-100'
			]}
		>
			<div class="relative">
				{#if refreshing}
					<div
						transition:fade={{ duration: 150 }}
						class="absolute inset-0 flex items-center justify-center"
					>
						<Spinner class="size-20 scale-120" />
					</div>
				{/if}
				<div class={['rounded-full transition-all', refreshing ? 'scale-60' : 'scale-100']}>
					<TrainIconByCategory {category} size={isFormedFromTrain ? 14 : 18} />
				</div>
			</div>
			<!-- {#if showDestination}
				<div class="text-[8px]/3">
					to {showDestination}
				</div>
			{/if} -->
		</div>

		{#if !isFormedFromTrain && trainBearing != null}
			<svg
				class={['absolute top-1/2 left-1/2 -z-20']}
				width="20"
				height="20"
				style="
     transform: translate(-50%, -50%)
                rotate({trainBearing}deg)
                translateY(-{isFormedFromTrain ? 14 : 18}px);
     transform-origin: center;
   "
			>
				<polygon
					points="10,0 0,20 20,20"
					class="fill-background stroke-background"
					stroke-width="2"
				/>
				<polygon
					style:opacity
					points="10,0 0,20 20,20"
					class={[isFormedFromTrain ? 'opacity-20' : 'opacity-100']}
					fill="white"
					stroke={color}
					stroke-width="2"
				/>
			</svg>
		{/if}
	</div>
</Marker>
