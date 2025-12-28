<script lang="ts">
	import { cn } from '$lib/utils';
	import clsx from 'clsx';
	import { CircleAlert, Info } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		status,
		children,
		class: className,
		Icon = CircleAlert
	}: {
		status: 'info' | 'minor' | 'major' | 'severe';
		children?: Snippet;
		class?: string;
		Icon?: typeof CircleAlert;
	} = $props();
</script>

<div
	class={cn(
		clsx([
			'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs',
			{
				'border-blue-500 bg-blue-100 text-black dark:bg-blue-900 dark:text-white':
					status === 'info',
				'border-yellow-500 bg-yellow-100 text-black dark:bg-yellow-600/30 dark:text-white':
					status === 'minor',
				'border-red-500 bg-red-100 text-black dark:bg-red-900 dark:text-white': status === 'major',
				'border-white bg-black text-white': status === 'severe'
			},
			className
		])
	)}
>
	<div>
		<Icon size={14} />
	</div>
	<div class="grow text-current">
		{@render children?.()}
	</div>
</div>
