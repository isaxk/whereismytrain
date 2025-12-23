<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BoardDetails } from '$lib/types';
	import { ArrowLeft, ChevronRight, Clock, Pin, Plus } from 'lucide-svelte';
	import Search from '$lib/components/search/search.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { pinned } from '$lib/state/saved.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';
	import { refreshing } from '$lib/state/services-subscriber.svelte';
	import { fade } from 'svelte/transition';
	import dayjs from 'dayjs';

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
	class="sticky top-0 z-20 flex h-18 items-center gap-2 border-b border-b-border bg-background px-4 pt-2 lg:pt-0"
>
	<div class="absolute top-1.5 right-0 left-0 flex h-2 min-w-10 justify-center lg:hidden">
		<div class="h-[5px] w-10 rounded-sm bg-black/40"></div>
	</div>
	<Button size="icon" variant="outline" href="../"><ArrowLeft size={20} /></Button>
	<div class="flex w-full min-w-0 grow">
		<div class="flex min-w-26 flex-col pl-2 sm:min-w-32">
			<div class="text-2xl/7 font-bold">{from}</div>
			<div class="max-w-full truncate text-[10px]/3 font-medium">
				{#if details?.name}
					{details?.name}
				{:else}
					<Skeleton class="h-3 w-10" />
				{/if}
			</div>
		</div>
	</div>

	<div class="min-w-10">
		<div class="relative flex h-6.5 min-w-10 items-center justify-center px-2">
			{#if refreshing.current}
				<div
					in:fade={{ duration: 200, delay: 100 }}
					out:fade={{ duration: 200, delay: 250 }}
					class="absolute inset-0 flex items-center justify-center bg-background"
				>
					<Spinner />
				</div>
			{:else}
				<div in:fade={{ duration: 200, delay: 400 }} out:fade={{ duration: 150, delay: 250 }}>
					<ChevronRight size={20} />
				</div>
			{/if}
		</div>
		<!-- {#if details?.offset}
			<div class="flex items-center justify-center gap-1 text-xs text-nowrap">
				<div class="min-w-3">
					<Clock size={12} />
				</div>
				{#if details?.offset > 120}
					{dayjs(details?.time).format('HH:mm')}
				{:else if details?.offset > 60}
					in {Math.floor(details?.offset / 60)}h {details?.offset % 60}m
				{:else if details?.offset > 0}
					in {details?.offset}m
				{/if}
			</div>
		{/if} -->
	</div>
	<div class={['flex w-full min-w-0 grow flex-col items-end', to && 'pr-2']}>
		{#if to}
			<div class="text-2xl/7 font-bold">{to}</div>
			<div class="max-w-full truncate text-[10px]/3 font-medium">
				{#if details?.filterName}
					{details?.filterName}
				{:else}
					<Skeleton class="h-3 w-10" />
				{/if}
			</div>
		{:else}
			<Search
				key="destination"
				onSelect={(crs) => crs && crs !== from && goto('?to=' + crs + '&offset=0')}
			>
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
