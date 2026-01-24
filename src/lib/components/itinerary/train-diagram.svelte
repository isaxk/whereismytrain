<script lang="ts">
	import { Bus } from 'lucide-svelte';
	import ChangeNotifier from '../ui/change-notifier.svelte';
	import type { CallingPoint, TrainService } from '$lib/types';

	let {
		focus,
		filter,
		service,
		duration = null,
		remaining = null
	}: {
		focus: CallingPoint;
		filter: CallingPoint;
		service: TrainService;
		duration: string | null;
		remaining: string | null;
	} = $props();
</script>

<div class="flex h-16 items-center">
	<div class="flex min-w-12 justify-end">
		<ChangeNotifier value={focus.delay} class="flex w-max flex-col items-end text-sm">
			{#if focus.isCancelled}
				<div class="text-base/4 text-danger">{focus.times.plan.dep}</div>
			{:else if focus.delay === null}
				<div class="text-base/4">{focus.times.plan.dep}</div>
				<div class="text-xs/3 text-warning">Delayed</div>
			{:else if focus.delay < 1}
				<div class="text-good">
					{focus.times.plan.dep}
				</div>
			{:else}
				<div class="text-xs/4">{focus.times.plan.dep}</div>
				<div class="text-sm/3 text-warning">{focus.times.rt.dep}</div>
			{/if}
		</ChangeNotifier>
	</div>
	<div class="flex h-16 min-w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow"></div>
		<div class="flex h-1.5 min-w-4" style:background={service.operator.color}></div>
		<div class="w-1.5 grow" style:background={service.operator.color}></div>
	</div>

	<div class="min-w-0 grow">
		<div class="flex">
			<div class="grow text-base/6 font-medium">
				{focus.name}
			</div>
			<ChangeNotifier
				value={focus.platform}
				class={[
					'-mr-1 items-center justify-center gap-1 px-1 text-right text-base/5',
					focus.platform === 'BUS' && 'text-sm text-warning'
				]}
			>
				{#if focus.platform === 'BUS'}
					<Bus size={16} /> Bus service
				{:else}
					<span class="text-xs/4 text-muted-foreground sm:text-xs/6">Platform </span>

					{focus.platform !== 'BUS' ? (focus.platform ?? '-') : ''}
				{/if}
			</ChangeNotifier>
		</div>
		<div class="flex w-full items-center gap-1 truncate text-xs/4 text-muted-foreground">
			<div
				class="h-max w-max rounded-sm px-1.5 py-0.5 text-[10px]/3 text-white"
				style:background={service.operator.color}
			>
				{service.operator.name}
			</div>

			<ChangeNotifier value={focus.isCancelled}>
				{#if focus.isCancelled}
					<div class="text-xs/3 font-medium text-danger">Cancelled</div>
				{:else}
					<div class="min-w-0 grow truncate">
						to
						{service.destination.map((d) => d.name).join(', ')}
					</div>
				{/if}
			</ChangeNotifier>
		</div>
	</div>
</div>

<div class="flex h-5 items-center">
	<div class="w-12"></div>
	<div class="flex h-5 w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow" style:background={service.operator.color}></div>
	</div>
	<div class="text-xs">
		<ChangeNotifier value="{filter.arrived} {focus.departed}" class="w-max text-xs">
			{#if filter.arrived}
				Arrived
			{:else if focus.departed}
				Departed
			{/if}
		</ChangeNotifier>
		<ChangeNotifier value={duration} class="w-max text-xs">
			{#if filter.arrived}
				<div class="text-[10px] text-muted-foreground">{duration}</div>
			{:else if focus.departed}
				<div class="text-[10px] text-muted-foreground">
					<span class="text-foreground">{remaining}</span> / {duration} remaining
				</div>
			{:else}
				{duration}
			{/if}
		</ChangeNotifier>
	</div>
</div>
<div class="flex h-12 items-center">
	<div class="flex min-w-12 justify-end">
		<ChangeNotifier value={filter.arrivalDelay} class="flex w-max flex-col items-end text-sm">
			{#if filter.isCancelled}
				<div class="text-sm text-danger">{filter.times.plan.arr}</div>
			{:else if filter.arrivalDelay === null}
				<div class="text-base/4">{filter.times.plan.arr}</div>
				<div class="text-xs/3 text-warning">Delayed</div>
			{:else if filter.arrivalDelay < 1}
				<div class="text-sm text-good">
					{filter.times.plan.arr}
				</div>
			{:else}
				<div class="text-xs/4">{filter.times.plan.arr}</div>
				<div class="text-sm/3 text-warning">{filter.times.rt.arr}</div>
			{/if}
		</ChangeNotifier>
	</div>
	<div class="flex h-full w-10 flex-col items-center justify-center">
		<div class="w-1.5 grow" style:background={service.operator.color}></div>
		<div class="flex h-1.5 min-w-4" style:background={service.operator.color}></div>

		<div class="w-1.5 grow"></div>
	</div>
	<div class="grow font-medium">
		<div class="text-base/5">
			{filter.name}
		</div>
		<ChangeNotifier value={filter.isCancelled && !focus.isCancelled}>
			{#if filter.isCancelled && !focus.isCancelled}
				<div class="text-xs/4 font-medium text-danger">Cancelled</div>
			{/if}
		</ChangeNotifier>
	</div>
</div>
