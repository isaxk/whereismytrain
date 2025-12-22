<script lang="ts">
	import { cn } from '$lib/utils';
	import clsx, { type ClassValue } from 'clsx';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		children,
		changed,
		class: className
	}: {
		children: Snippet;
		changed: boolean;
		class?: string | ClassValue[];
	} = $props();
</script>

<div
	class={cn(
		clsx([
			'relative box-content flex items-center gap-1 p-0 transition-all',
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
