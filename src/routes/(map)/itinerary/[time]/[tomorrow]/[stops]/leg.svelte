<script lang="ts">
	import BoardItemComponent from '$lib/components/board/board-item.svelte';
	import type { Board, BoardItem, TrainService, CallingPoint } from '$lib/types';
	import dayjs from 'dayjs';
	import { API_COMPATIBLE_VERSION } from '../../../../../api/_shared';
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { londonTerminals } from '$lib/data/favourites';
	import Tubeicon from '$lib/assets/tubeicon.svelte';
	import { dayjsFromHHmm } from '$lib/utils';
	import { GitCompareArrowsIcon } from 'lucide-svelte';

	let {
		legIndex = 0,
		from,
		to,
		time,
		tomorrow,
		onSelect
	}: {
		legIndex?: number;
		from: string;
		to: string;
		time: string;
		tomorrow: boolean;
		onSelect: (
			data: { service: TrainService; focus: CallingPoint; filter: CallingPoint } | null
		) => void;
	} = $props();

	let board: Board | null = $state(null);
	let loading = $state(false);

	async function fetchServices(from: string, to: string, time: string, tomorrow: boolean) {
		const response = await fetch(
			`/api/board/${from}/${to}/${time.replaceAll(':', '')}/${tomorrow}`,
			{
				headers: {
					'api-version': API_COMPATIBLE_VERSION
				}
			}
		);
		return response.json();
	}

	$effect(() => {
		loading = true;
		fetchServices(from, to, time, tomorrow).then((d) => {
			board = d;
			loading = false;
		});
	});

	async function selectService(service: BoardItem | null) {
		if (!service) {
			onSelect(null);
			return;
		}
		loading = true;
		const response = await fetch(`/api/service/${service.rid}/${from}/${to}`, {
			headers: {
				'api-version': API_COMPATIBLE_VERSION
			}
		});
		const data: TrainService = await response.json();
		if (response.ok) {
			const focus = data.callingPoints.find((p) => p.order === 'focus');
			const filter = data.callingPoints.find((p) => p.order === 'filter');
			if (focus && filter) onSelect({ service: data, focus, filter });
			loading = false;
		}
	}
</script>

{#if loading}
	<div class="flex h-full grow flex-col items-center justify-center">
		<Spinner class="size-8" />
	</div>
{:else if board}
	{#if board.services.length === 0}
		<div class="flex h-full grow flex-col items-center justify-center px-10 py-10">
			{#if londonTerminals.includes(from) && londonTerminals.includes(to)}
				<div class="text-base">No direct national rail service found between London terminals</div>
				<Button onclick={() => selectService(null)}><Tubeicon /> Mark as a tube connection</Button>
			{:else}
				<div class="text-lg font-medium">No services found</div>
				{#if Math.abs(dayjsFromHHmm(time).diff(dayjs(), 'm')) > 120}
					<div class="text-xs">
						Looking for a replacement bus? Unfortunately we cannot get info for these more than 2
						hours in advance.
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		{#each board.services as service (service.rid)}
			{@const timeToConnect = dayjsFromHHmm(service.times.rt.dep ?? service.times.plan.dep!).diff(
				dayjsFromHHmm(time),
				'm'
			)}
			<button onclick={() => selectService(service)} class="w-full px-4 even:bg-muted/40">
				{#if legIndex > 0}
					<div class="flex translate-y-4 items-center gap-2 text-xs text-muted-foreground">
						<GitCompareArrowsIcon size={16} />
						{timeToConnect}m to connect
					</div>
				{/if}
				<BoardItemComponent
					href="#"
					date={service.rawTime}
					isToday={dayjs(service.rawTime).isSame(dayjs(), 'day')}
					planDep={service.times.plan.dep ?? 'N/A'}
					rtDep={service.times.rt.dep}
					departed={service.departed}
					isCancelled={service.isCancelled}
					isFilterCancelled={service.isFilterCancelled}
					destination={service.destination}
					platform={service.platform}
					operator={service.operator}
				/>
			</button>
		{/each}
	{/if}
{/if}
