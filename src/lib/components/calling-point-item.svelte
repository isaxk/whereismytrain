<script lang="ts">
	import { page } from '$app/state';
	import type { CallingPoint, Operator } from '$lib/types';
	import Check from '@lucide/svelte/icons/check';
	import {
		ArrowDownRight,
		ArrowDownRightFromCircle,
		ArrowRight,
		ArrowUpRight
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let {
		cp,
		operator,
		index,
		length,
		nextCancelled = false,
		prevCancelled = false
	}: {
		cp: CallingPoint;
		operator: Operator;
		index: number;
		length: number;
		nextCancelled?: boolean;
		prevCancelled?: boolean;
	} = $props();
</script>

<div class={['flex h-12 items-center gap-2', cp.order === 'post-destination' ? 'opacity-50' : '']}>
	<div
		class={[
			'z-0 flex gap-4',
			cp.order === 'focus' || cp.order === 'filter'
				? 'font-medium'
				: cp.order === 'further'
					? 'opacity-40'
					: 'opacity-80'
		]}
	>
		<div class={['w-8 min-w-8']}>
			<div
				class={[
					cp.isCancelled || cp.arrivalCancelled
						? 'text-sm text-red-600 line-through'
						: cp.times.rt.arr !== cp.times.plan.arr
							? cp.times.rt.arr
								? 'text-xs/3 line-through'
								: 'text-xs/3'
							: 'text-good text-sm'
				]}
			>
				{cp.times.plan.arr}
			</div>
			{#if cp.times.rt.arr !== cp.times.plan.arr && !cp.isCancelled && !cp.arrivalCancelled}
				{#if cp.times.rt.arr}
					<div class="flex items-center gap-1 text-sm/3 text-yellow-500">
						{cp.times.rt.arr ?? 'Delayed'}
					</div>
					<!-- {:else if cp.times.rt.arrSource === 'none'}
					<div class="text-foreground text-[10px]/3">Unknown</div> -->
				{:else}
					<div class="text-[10px]/3 text-yellow-500">Delayed</div>
				{/if}
			{/if}
		</div>
		<div class={['w-8 min-w-8']}>
			<div
				class={[
					cp.isCancelled || cp.departureCancelled
						? 'text-sm text-red-600 line-through'
						: cp.times.rt.dep !== cp.times.plan.dep
							? cp.times.rt.dep
								? 'text-xs/3 line-through'
								: 'text-xs/3'
							: 'text-good text-sm'
				]}
			>
				{cp.times.plan.dep}
			</div>
			{#if cp.times.rt.dep !== cp.times.plan.dep && !cp.isCancelled && !cp.departureCancelled}
				{#if cp.times.rt.dep}
					<div class="text-sm/3 text-yellow-500">
						{cp.times.rt.dep}
					</div>
					<!-- {:else if cp.times.rt.depSource === 'none'}
					<div class="text-foreground text-[10px]/3">Unknown</div> -->
				{:else}
					<div class="text-[10px]/3 text-yellow-500">Delayed</div>
				{/if}
			{/if}
		</div>
	</div>

	{#snippet crsBlob(crs: string)}
		<div class="relative h-1.5 w-1.5">
			<div class="absolute h-8 w-8 text-[10px]" style:background={operator.color}>{crs}</div>
		</div>
	{/snippet}

	<div
		class={[
			'flex h-full flex-col items-center justify-center',
			cp.inDivision ? 'min-w-12 pl-5' : 'min-w-8 pl-1'
		]}
	>
		{#if index === 0}
			<div class="grow"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{:else if index === length - 1 || cp.endDivide}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div class="grow"></div>
		{:else if cp.order === 'destination'}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black opacity-50"></div>
		{:else}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div class="flex w-4">
				<div class="w-[5px]"></div>
				<div style:background={operator.color} class="h-1.5 grow"></div>
			</div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{/if}
	</div>
	<div class="min-w-0 grow">
		<div class="flex items-end gap-1">
			<div
				class={[
					'min-w-0 overflow-hidden text-nowrap text-ellipsis',
					cp.order === 'focus' || cp.order === 'destination' || cp.order === 'filter'
						? 'text-base/5 font-semibold'
						: cp.order === 'further'
							? 'text-muted-foreground/60 text-sm/4'
							: 'text-muted-foreground text-sm/4'
				]}
			>
				{cp.name}
			</div>
			<div
				class={[
					'text-zinc-400',
					cp.order === 'focus' || cp.order === 'destination' || cp.order === 'filter'
						? 'text-[10px]/4'
						: 'text-[10px]/3'
				]}
			>
				({cp.crs})
			</div>
		</div>
		{#if cp.isCancelled}
			<div class="text-xs/4 text-red-600">Cancelled</div>
		{:else if cp.departed}
			<div class={['text-muted-foreground flex items-center gap-1 text-[10px]/4']}>
				<ArrowUpRight size={12} /> Departed {(cp.delay ?? 0) > 0
					? `${cp.delay}m late`
					: (cp.delay ?? 0) < 0
						? `${Math.abs(cp.delay ?? 0)}m early`
						: 'on time'}
			</div>
		{:else if cp.arrived}
			<div class="flex items-center gap-1 text-[10px]/4"><ArrowDownRight size={12} /> Arrived</div>
		{/if}
	</div>
	<div class={[cp.order === 'focus' ? 'text-lg font-medium' : 'text-sm text-zinc-400']}>
		{cp.platform ?? '-'}
	</div>
</div>
