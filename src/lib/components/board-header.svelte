<script lang="ts">
	import { goto } from '$app/navigation';
	import type { BoardDetails } from '$lib/types';
	import { ArrowLeft, ChevronRight, Plus } from 'lucide-svelte';
	import Search from './search.svelte';
	import Skeleton from './skeleton.svelte';
	import Button from './ui/button/button.svelte';

	let {
		from,
		to,
		details = null
	}: { from: string; to: string; details?: BoardDetails | null } = $props();
</script>

<div
	class="bg-background border-b-border sticky top-0 z-20 flex h-18 items-center border-b px-4 pt-2"
>
	<div class="absolute top-1.5 right-0 left-0 flex h-2 min-w-10 justify-center">
		<div class="h-[5px] w-10 rounded-sm bg-black/40"></div>
	</div>
	<a href="../" class="min-w-10"><ArrowLeft size={20} /></a>
	<div class="flex w-full min-w-0 grow justify-end">
		<div class="flex min-w-26 flex-col sm:min-w-32">
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
	<div class="flex w-full min-w-0 grow justify-start">
		<div class="flex min-w-26 flex-col items-end sm:min-w-32">
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
						<div
							out:send|global={{ key: 'destination' }}
							in:receive|global={{ key: 'destination' }}
						>
							<Button variant="outline" size="sm" {onclick}>
								<Plus size={14} />
								Destination
							</Button>
						</div>
					{/snippet}
				</Search>
			{/if}
		</div>
	</div>
	<div class="min-w-10"></div>
</div>
