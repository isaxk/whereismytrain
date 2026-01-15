<script lang="ts">
	import { ArrowDownRight, ArrowUpRight, X } from 'lucide-svelte';

	import { highlightedStation } from '$lib/state/map.svelte';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { CallingPoint, Operator } from '$lib/types';
	import { t } from '$lib/utils';

	import ChangeNotifier from '../ui/change-notifier.svelte';

	import TrainIconByCategory from './train-icon-by-category.svelte';

	const { send, receive } = t;

	let {
		cp,
		operator,
		index,
		length,
		showTrain = false,
		greyLine = false,
		pickupOnly = false,
		setdownOnly = false,

		category = 'standard'
	}: {
		cp: CallingPoint;
		operator: Operator;
		index: number;
		length: number;
		showTrain?: boolean;
		greyLine?: boolean;
		pickupOnly?: boolean;
		setdownOnly?: boolean;
		category?: 'standard' | 'express';
	} = $props();

	let elm: HTMLDivElement;

	$effect(() => {
		if (highlightedStation.current === cp.crs + (cp.rtDepDate || '')) {
			elm.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
			setTimeout(() => {
				highlightedStation.current = null;
			}, 2000);
		}
	});
</script>

<div
	bind:this={elm}
	class={[
		'flex h-12 items-center gap-2 rounded-xl px-2 transition-all',
		highlightedStation.current === cp.crs + (cp.rtDepDate || '') && 'animate-pulse bg-amber-100'
	]}
>
	<div
		class={[
			'z-0 flex w-10 min-w-10 justify-end gap-0',

			cp.order === 'focus' || cp.order === 'filter'
				? 'font-medium'
				: cp.order === 'further'
					? 'opacity-80'
					: cp.order === 'post-destination'
						? 'opacity-60'
						: 'opacity-100'
		]}
	>
		{#if (['filter', 'subsequent', 'post-destination', 'further'].includes(cp.order) && cp.times.plan.arr && !(cp.arrivalCancelled && !cp.departureCancelled)) || !cp.times.plan.dep || (!cp.arrivalCancelled && cp.departureCancelled)}
			<ChangeNotifier
				value={cp.delay}
				class={[
					'flex w-max origin-left flex-col items-end',
					cp.order === 'focus' || cp.order === 'filter' ? 'scale-100' : 'scale-95'
				]}
			>
				<div
					class={[
						cp.isCancelled || cp.arrivalCancelled
							? 'text-sm text-red-600 line-through'
							: cp.times.rt.arr !== cp.times.plan.arr
								? cp.times.rt.arr
									? 'text-xs/3'
									: 'text-sm/3'
								: 'text-sm font-medium text-good'
					]}
				>
					<div>
						{#if !['filter', 'subsequent', 'post-destination', 'further'].includes(cp.order)}
							<span class="text-[10px]">(a)</span>
						{/if}{cp.times.plan.arr}
					</div>
				</div>
				{#if cp.times.rt.arr !== cp.times.plan.arr && !cp.isCancelled && !cp.arrivalCancelled}
					{#if cp.times.rt.arr}
						<div class="text-sm/3 font-medium text-warning">
							{cp.times.rt.arr ?? 'Delayed'}
						</div>
					{:else}
						<div class="text-[10px]/3 font-medium text-warning">Delayed</div>
					{/if}
				{/if}
			</ChangeNotifier>
		{:else}
			<ChangeNotifier
				value={cp.arrivalDelay}
				class={[
					'flex w-10 min-w-10 origin-left flex-col items-end text-nowrap',
					cp.order === 'focus' || cp.order === 'filter' ? 'scale-100' : 'scale-95'
				]}
			>
				<div
					class={[
						cp.isCancelled || cp.departureCancelled
							? 'text-sm text-red-600 line-through'
							: cp.times.rt.dep !== cp.times.plan.dep
								? cp.times.rt.dep
									? 'text-xs/3'
									: 'text-sm/3'
								: 'text-sm font-medium text-good'
					]}
				>
					<div>
						{#if ['filter', 'subsequent', 'post-destination', 'further'].includes(cp.order)}
							<span class="text-[10px]">(d)</span>
						{/if}{cp.times.plan.dep}
					</div>
				</div>
				{#if cp.times.rt.dep !== cp.times.plan.dep && !cp.isCancelled && !cp.departureCancelled}
					{#if cp.times.rt.dep}
						<div class="w-max text-sm/3 font-medium text-warning">
							{cp.times.rt.dep ?? 'Delayed'}
						</div>
					{:else}
						<div class="w-max text-[10px]/3 font-medium text-warning">Delayed</div>
					{/if}
				{/if}
			</ChangeNotifier>
		{/if}
	</div>

	<div
		class={[
			'relative flex h-full flex-col items-center justify-center',
			cp.inDivision ? 'min-w-12 pl-4' : 'min-w-8 pl-0',
			cp.isPostDestination || greyLine ? 'opacity-75' : ''
		]}
	>
		{#if cp.isOrigin || cp.startJoin}
			<div class="grow"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{:else if index === length - 1 || cp.endDivide}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div class="grow"></div>
		{:else if cp.isDestination || (cp.departureCancelled && !cp.isCancelled)}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black opacity-75"></div>
		{:else}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div class="flex w-4">
				<div class="w-[5px]"></div>
				<div style:background={operator.color} class={['h-1.5 w-1.5']}></div>
				<div
					style:background={operator.color}
					class={['h-1.5 grow', cp.isCancelled && 'opacity-50']}
				></div>
			</div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{/if}
		{#if (cp.departed || cp.isCancelled) && cp.showTrain && showTrain}
			<div
				class="absolute top-9 z-10"
				in:receive|global={{
					key: cp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
				out:send|global={{
					key: cp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
			>
				<div
					style:border-color={operator.color}
					style:color={operator.color}
					class="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white"
				>
					<TrainIconByCategory {category} size={14} />
				</div>
			</div>
		{:else if cp.arrived && cp.showTrain && showTrain}
			<div
				class="absolute top-1/2 z-10 -translate-y-1/2"
				in:receive|global={{
					key: cp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
				out:send|global={{
					key: cp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
			>
				<div
					style:border-color={operator.color}
					style:color={operator.color}
					class="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white"
				>
					<TrainIconByCategory {category} size={14} />
				</div>
			</div>
		{/if}
	</div>
	<div class={['min-w-0 grow', cp.order === 'post-destination' ? 'opacity-40' : '']}>
		<div class="flex items-end gap-1">
			<div
				class={[
					'min-w-0 overflow-hidden text-base/5 text-nowrap text-ellipsis',
					{
						'font-semibold': cp.order === 'focus' || cp.order === 'filter' || cp.isDestination,
						'text-base-5': cp.order === 'further' || cp.order === 'filter',
						'text-muted-foreground/60': cp.order === 'further' && !cp.isDestination,
						'text-muted-foreground': cp.order === 'subsequent' && !cp.isDestination,
						'text-sm/4': cp.order !== 'focus' && cp.order !== 'filter'
					}
				]}
			>
				{cp.name}
			</div>
			<div
				class={[
					'text-zinc-400',
					cp.order === 'focus' || cp.isDestination || cp.order === 'filter'
						? 'text-[10px]/4'
						: 'text-[10px]/3'
				]}
			>
				({cp.crs})
			</div>
		</div>

		<ChangeNotifier value={cp.isCancelled} class="w-max">
			{#if cp.isCancelled}
				<div class="flex w-max items-center gap-1 text-xs/4 text-red-600">
					<X size={16} /> Cancelled
				</div>
			{:else if pickupOnly}
				<div class="flex items-center gap-1 text-[10px]/4 text-muted-foreground">
					<ArrowUpRight size={12} /> Pick up only
				</div>
			{:else if setdownOnly}
				<div class="flex items-center gap-1 text-[10px]/4 text-muted-foreground">
					<ArrowDownRight size={12} /> Set down only
				</div>
			{/if}
		</ChangeNotifier>
	</div>
	<ChangeNotifier
		value={cp.platform}
		class={[
			'flex items-center gap-1',
			cp.order === 'focus' ? 'text-lg font-medium' : 'text-sm text-zinc-400',
			cp.order === 'post-destination' ? 'opacity-25' : ''
		]}
	>
		{cp.platform ?? '-'}
	</ChangeNotifier>
</div>
