<script lang="ts">
	import { pinned } from '$lib/state/saved.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '../ui/button/button.svelte';
	import { X } from 'lucide-svelte';
	import type { PinnedBoard } from '$lib/types';

	let {
		toCrs,
		fromCrs,
		toName,
		fromName,
		onselect
	}: PinnedBoard & { onselect: (fromCrs: string, toCrs: string | null) => void } = $props();
</script>

<div class="flex w-full items-center gap-4 px-4 py-2">
	<button type="button" onclick={() => onselect(fromCrs, toCrs)} class="contents text-left">
		<div class="w-full min-w-0 grow">
			<div class="text-xl/5 font-medium">{fromCrs}</div>
			<div class="truncate text-xs">{fromName}</div>
		</div>

		<div>
			<ChevronRight />
		</div>

		{#if toCrs}
			<div class="w-full min-w-0 grow">
				<div class="text-xl/5 font-medium">{toCrs}</div>
				<div class="truncate text-xs">{toName}</div>
			</div>
		{:else}
			<div class="w-full grow">
				<div class="text-xs text-muted-foreground">Anywhere</div>
			</div>
		{/if}
	</button>
	<Button
		type="button"
		onclick={() =>
			(pinned.value = pinned.value.filter((p) => !(p.fromCrs === fromCrs && p.toCrs === toCrs)))}
		size="icon"
		variant="outline"
	>
		<X />
	</Button>
</div>
