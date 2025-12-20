<script lang="ts">
	import { pinned } from '$lib/state/saved.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '../ui/button/button.svelte';
	import { X } from 'lucide-svelte';
	import type { PinnedBoard } from '$lib/types';

	let { toCrs, fromCrs, toName, fromName }: PinnedBoard = $props();
</script>

<div class="border-border flex w-full items-center gap-4 border-t px-4 py-2">
	<a href={toCrs ? `/board/${fromCrs}?to=${toCrs}` : `/board/${fromCrs}`} class="contents">
		<div class="w-full grow">
			<div class="text-xl/5 font-medium">{fromCrs}</div>
			<div class="text-xs">{fromName}</div>
		</div>

		<div>
			<ChevronRight />
		</div>

		{#if toCrs}
			<div class="w-full grow">
				<div class="text-xl/5 font-medium">{toCrs}</div>
				<div class="text-xs">{toName}</div>
			</div>
		{:else}
			<div class="w-full grow">
				<div class="text-muted-foreground text-xs">Anywhere</div>
			</div>
		{/if}
	</a>
	<Button
		onclick={() =>
			(pinned.value = pinned.value.filter((p) => !(p.fromCrs === fromCrs && p.toCrs === toCrs)))}
		size="icon"
		variant="outline"
	>
		<X />
	</Button>
</div>
