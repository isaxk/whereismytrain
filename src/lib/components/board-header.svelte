<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BoardDetails } from '$lib/types';
	import { ArrowLeft, ChevronRight, Pin, Plus } from 'lucide-svelte';
	import Search from './search.svelte';
	import Skeleton from './skeleton.svelte';
	import Button from './ui/button/button.svelte';
	import { pinned } from '$lib/state/saved.svelte';

	let {
		from,
		to,
		details = null
	}: { from: string; to: string; details?: BoardDetails | null } = $props();

	const isPinned = $derived(
		pinned.value.some((board) => board.fromCrs === from && board.toCrs === to)
	);

	function pin() {
		if (pinned.value.some((board) => board.fromCrs === from && board.toCrs === to)) {
			pinned.value = pinned.value.filter((board) => board.fromCrs !== from || board.toCrs !== to);
		} else {
			pinned.value.push({
				fromCrs: from,
				fromName: details?.name || '',
				toCrs: to,
				toName: details?.filterName ?? null
			});
		}
	}
</script>

<div
	class="bg-background border-b-border sticky top-0 z-20 flex h-18 items-center gap-2 border-b px-4 pt-2"
>
	<div class="absolute top-1.5 right-0 left-0 flex h-2 min-w-10 justify-center">
		<div class="h-[5px] w-10 rounded-sm bg-black/40"></div>
	</div>
	<Button size="icon" variant="outline" href="../"><ArrowLeft size={20} /></Button>
	<div class="flex w-full min-w-0 grow">
		<div class="flex min-w-26 flex-col pl-2 sm:min-w-32">
			<div class="text-2xl font-bold">{from}</div>
			<div class="max-w-full truncate text-[10px]/3 font-medium">
				{#if details?.name}
					{details?.name}
				{:else}
					<Skeleton class="h-3 w-10" />
				{/if}
			</div>
		</div>
	</div>

	<div class="flex min-w-10 justify-center px-2">
		<ChevronRight size={20} />
	</div>
	<div class={['flex w-full min-w-0 grow flex-col items-end', to && 'pr-2']}>
		{#if to}
			<div class="text-2xl font-bold">{to}</div>
			<div class="max-w-full truncate text-[10px]/3 font-medium">
				{#if details?.filterName}
					{details?.filterName}
				{:else}
					<Skeleton class="h-3 w-10" />
				{/if}
			</div>
		{:else}
			<Search key="destination" onSelect={(crs) => crs && crs !== from && goto('?to=' + crs)}>
				{#snippet trigger({ send, receive, selected, onclick })}
					<div out:send|global={{ key: 'destination' }} in:receive|global={{ key: 'destination' }}>
						<Button variant="outline" {onclick}>
							<Plus size={14} />
							To
						</Button>
					</div>
				{/snippet}
			</Search>
		{/if}
	</div>
	<Button size="icon" onclick={pin} variant="outline"
		><Pin fill={isPinned ? 'currentColor' : 'none'} /></Button
	>
</div>
