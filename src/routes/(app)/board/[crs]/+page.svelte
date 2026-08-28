<script lang="ts">
	import { page } from '$app/state';
	import BoardHeader from '$lib/components/board/board-header.svelte';
	import ResultItem from '$lib/components/board/result-item.svelte';
	import { flip } from 'svelte/animate';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils.js';
	import type { BoardNotice, Notice } from '$lib/types/index.js';
	import { ChevronRight, CircleAlertIcon, GitCompareArrowsIcon, House } from 'lucide-svelte';
	import AlertCard from '$lib/components/ui/alert-card.svelte';

	let { data } = $props();

	let details = $state(null);
	let results: any[] | null = $state(null);
	let notices: BoardNotice[] | null = $state(null);

	$effect(() => {
		data.board.then((board) => {
			console.log(board);
			details = board.details;
			results = board.results;
			notices = board.notices;
		});
	});

	function serviceUrl(rid: string) {
		const search = new SvelteURLSearchParams();
		if (data.to) search.set('to', data.to);
		if (data.time) search.set('time', data.time);
		return `/board/${data.crs}/t/${rid}?${search.toString()}`;
	}
</script>

<BoardHeader from={data.crs} to={page.data.to} {details} />

{#if notices && notices.length > 0}
	<Dialog.Root>
		<Dialog.Trigger
			class={cn([
				'w-full overflow-hidden border-y drop-shadow-xs',
				{
					'border-blue-500 bg-blue-100 text-black dark:bg-blue-900 dark:text-white': notices.some(
						(n) => n.severity === 'info'
					),
					'border-yellow-500 bg-yellow-100 text-black dark:bg-yellow-600/30 dark:text-white':
						notices.some((n) => n.severity === 'minor'),
					'border-red-500 bg-red-100 text-black dark:bg-red-900 dark:text-white': notices.some(
						(n) => n.severity === 'major'
					),
					'border-white bg-black text-red-100': notices.some((n) => n.severity === 'severe')
				}
			])}
		>
			<div
				class="group flex w-full flex-col items-start gap-1 border-foreground/20 px-4 py-2 text-sm font-medium data-[state=open]:border-b"
			>
				<div class="flex w-full items-center gap-2">
					<div class="min-w-5">
						<CircleAlertIcon size={18} />
					</div>
					<div class="flex min-w-0 grow items-center">
						<div class="flex min-w-0 grow flex-col items-start">
							<div>
								{#if notices.some((n) => n.severity === 'severe')}
									Severe disruption
								{:else if notices.some((n) => n.severity === 'major')}
									Major disruption
								{:else if notices.some((n) => n.severity === 'minor')}
									Disruption
								{:else}
									{notices.length} notice{notices.length !== 1 ? 's' : ''}
								{/if}
							</div>
						</div>

						{#if notices.some((n) => n.severity !== 'info')}
							<!-- <div class="grow"></div> -->
							<span class="inline font-normal text-nowrap">
								{notices.length} alert{notices.length !== 1 ? 's' : ''}
							</span>
						{/if}
					</div>
					<!-- <div class="grow"></div> -->

					<div class="transition-all group-data-[state=open]:rotate-180">
						<ChevronRight size={18} />
					</div>
				</div>
				<div
					class="w-full truncate text-left text-xs/4 font-normal text-muted-foreground group-data-[state=open]:hidden"
				>
					{@html notices[0]?.body}
				</div>
			</div>
		</Dialog.Trigger>
		<Dialog.Content class="flex max-h-[90%] flex-col gap-0 overflow-hidden p-0">
			<div class="px-4 py-3 text-base font-medium">Distruption</div>
			<div class="min-h-0 grow overflow-y-scroll">
				{#each notices as notice, index (index)}
					<AlertCard
						class="border-foreground/10 not-last:border-b"
						Icon={notice.category === 'Connectingservice'
							? GitCompareArrowsIcon
							: notice.category === 'Station'
								? House
								: CircleAlertIcon}
						status={(notice.severity ?? 'info') as 'info' | 'minor' | 'major' | 'severe'}
					>
						<div
							class={[
								'prose text-sm  dark:prose-invert prose-p:text-sm',
								notice.severity === 'severe' ? 'text-red-100 prose-invert' : ''
							]}
						>
							{@html notice.body}
						</div>
					</AlertCard>
				{/each}
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<div>
	{#if results}
		{#each results as result (result.id + result.from.planTime)}
			<a href={serviceUrl(result.id)} animate:flip class="odd:bg-muted/40 block">
				<ResultItem item={result} />
			</a>
		{/each}
	{/if}
</div>
