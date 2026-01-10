<script>
	import { ChevronDown } from 'lucide-svelte';

	import { t } from '$lib/utils';

	import TrainIconByCategory from './train-icon-by-category.svelte';

	let {
		show = $bindable(false),
		trainVisible = false,
		color = '#000000',
		inDivision = false,
		category = 'standard',
		name
	} = $props();

	const send = t.send;
</script>

<button class="flex h-8 items-center gap-2 px-2 text-left" onclick={() => (show = !show)}>
	<div class="flex gap-3">
		<div class="min-w-12.5"></div>
	</div>
	{#if inDivision}
		<div class="w-2"></div>
	{/if}
	<div class="relative flex h-full w-3 justify-center">
		<div style:background={color} class="h-full w-1.5 bg-black"></div>
		{#if trainVisible}
			<div
				class="absolute top-1/2 z-10 -translate-y-1/2"
				out:send|global={{ key: 'train-pos-icon' }}
			>
				<div
					style:border-color={color}
					style:color
					class="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white"
				>
					<TrainIconByCategory {category} size={14} />
				</div>
			</div>
		{/if}
	</div>
	<div class="flex items-center gap-1 pl-2 text-sm font-medium">
		<div class={[show && 'rotate-180', 'transition-transform duration-200']}>
			<ChevronDown size={16} />
		</div>
		{show ? 'Hide' : 'Show'}
		{name}
	</div>
</button>
