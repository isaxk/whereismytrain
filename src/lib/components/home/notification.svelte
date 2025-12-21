<script lang="ts">
	import dayjs from 'dayjs';
	import BoardItem from '$lib/components/board/board-item.svelte';
	import Check from '@lucide/svelte/icons/check';
	import { Bus, ClockAlert, X } from 'lucide-svelte';
	import { saved } from '$lib/state/saved.svelte';

	let {
		title,
		service,
		alertType
	}: {
		title: string;
		service: string;
		alertType:
			| 'delay'
			| 'cancelled'
			| 'platform'
			| 'departed'
			| 'filter-cancelled'
			| 'filter-delay'
			| 'reminder'
			| '';
	} = $props();

	const data = $derived(JSON.parse(service));

	const planDep = $derived(dayjs(data.scheduled_departure).format('HH:mm'));
	const rtDep = $derived(dayjs(data.estimated_departure).format('HH:mm'));
	const planArr = $derived(dayjs(data.scheduled_arrival).format('HH:mm'));
	const rtArr = $derived(dayjs(data.estimated_arrival).format('HH:mm'));

	const savedItem = $derived(saved.value.find((item) => item.subscriptionId === data.id));
</script>

<!-- <div class="text-xl">
	{title}
	{alertType}
</div> -->
<a
	href="/board/{data.focus_crs}/t/{data.service_id}d{data.destination_crs}?to={data.filter_crs}"
	class={['flex h-16 w-[320px] flex-col justify-center gap-0.5 border-border text-left']}
>
	<div class="flex h-max w-full items-center gap-2">
		<div class="font-medium">
			{planDep || 'N/A'}
		</div>
		<div class="text-[10px]">
			{#if data.isCancelled}
				<div
					class={[
						'flex items-center gap-1 text-red-600',
						alertType === 'cancelled'
							? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
							: ''
					]}
				>
					<X size={14} /> Cancelled
				</div>
			{:else if rtDep == planDep}
				<div
					class={[
						'flex items-center gap-1 text-good',
						alertType === 'delay' || alertType === 'departed'
							? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
							: ''
					]}
				>
					<Check size={14} />
					{#if data.departed}
						Departed on time
					{:else}
						On time
					{/if}
				</div>
			{:else if rtDep}
				<div
					class={[
						'flex items-center gap-1 text-yellow-600',
						alertType === 'delay' || alertType === 'departed'
							? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
							: ''
					]}
				>
					<ClockAlert size={14} />
					{#if data.departed}
						Departed
					{:else}
						Expected
					{/if}
					{rtDep}
				</div>
			{:else}
				<div
					class={[
						'flex items-center gap-1 text-yellow-600',
						alertType === 'delay'
							? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
							: ''
					]}
				>
					<ClockAlert size={14} />
					Delayed
				</div>
			{/if}
		</div>
		<div class="grow"></div>
		<div
			class={[
				'flex items-center justify-center',
				alertType === 'platform'
					? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
					: ''
			]}
		>
			<div class="text-right">
				<span class="text-xs text-muted-foreground">Platform </span>
				{data.platform !== 'BUS' ? (data.platform ?? '-') : ''}
			</div>
			{#if data.platform === 'BUS'}
				<div class="flex items-center gap-1 text-xs text-yellow-600">
					<Bus size={16} /> Bus service
				</div>
			{/if}
		</div>
	</div>
	<div class="flex items-start">
		<div class="min-w-0 grow overflow-hidden">
			{#if savedItem?.service?.callingPoints.find((point) => point.crs === data.focus_crs)}
				<div class="text-xs/3 font-light text-muted-foreground">
					<span class="font-medium">
						{savedItem?.service?.callingPoints.find((point) => point.crs === data.focus_crs)?.name}
					</span> to
				</div>
			{/if}
			<div class={['truncate text-base/5 font-semibold']}>
				{data.destination}
			</div>
			<!-- {#if destination[0].via}
				<div class="text-muted-foreground text-xs/3 font-light">
					{destination[0].via}
				</div>
			{/if} -->
		</div>
		<div
			class="mt-1 h-max rounded-md px-1.5 py-0.5 text-[10px] text-white"
			style:background={savedItem?.service.operator.color}
		>
			{savedItem?.service.operator.name}
		</div>
	</div>
	{#if data.filter_crs}
		<div class="flex items-center gap-0">
			{#if data.isCancelledAtFilter}
				{#if !data.isCancelled}
					<div
						class={[
							'flex items-center gap-1 text-xs text-danger',
							alertType === 'filter-cancelled'
								? 'animate-pulse rounded bg-red-200 px-1.5 py-0.5 dark:bg-red-900'
								: ''
						]}
					>
						<X size={14} /> Cancelled to {data.filter.name}
					</div>
				{/if}
			{:else}
				<div class={['flex min-w-0 gap-1 overflow-hidden text-xs text-nowrap']}>
					<div class="truncate">
						{#if data.arrived}
							Arrived
						{:else}
							Expected arrival
						{/if}
						<!-- at {data.filter.name} -->
					</div>
					{#if rtArr === planArr}
						<div class={['flex items-center gap-0.5 text-good']}>
							<Check size={12} />
							{rtArr}
						</div>
					{:else}
						<div class={['flex items-center gap-1 text-warning']}>
							<ClockAlert size={12} />
							{rtArr ?? 'Unknown'}
						</div>
					{/if}
				</div>
			{/if}
			<div class="grow"></div>
		</div>
	{/if}
</a>
