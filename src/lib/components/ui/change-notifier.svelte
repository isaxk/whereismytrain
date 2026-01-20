<script lang="ts">
	import clsx, { type ClassValue } from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import { scale } from 'svelte/transition';

	import { cn } from '$lib/utils';

	let {
		children,
		value,
		class: className
	}: {
		children: Snippet;
		value: string | boolean | number | null;
		class?: string | ClassValue[];
	} = $props();

	let oldValue = $state(value);
	let changed = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (untrack(() => oldValue) !== value) {
			clearTimeout(timeout);
			oldValue = value;
			changed = true;
			timeout = setTimeout(() => {
				changed = false;
			}, 1000);
		}
	});
</script>

<div
	class={cn(
		clsx([
			'relative box-content transition-all',
			changed ? 'animate-pulse' : '',
			...(Array.isArray(className) ? className : [className])
		])
	)}
>
	{#if changed}
		<div
			transition:scale|global={{ duration: 200, start: 0.95, opacity: 0 }}
			class="absolute -top-0.5 -right-1 -bottom-0.5 -left-1 z-0 rounded-md bg-red-500/20"
		></div>
	{/if}
	<div class="z-20 contents">
		{@render children()}
	</div>
</div>
