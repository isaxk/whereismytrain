<script lang="ts">
	import { page } from '$app/state';
	import { explicitEffect } from '$lib/state/utils.svelte';
	import type { CallingPoint, Operator } from '$lib/types';
	import Check from '@lucide/svelte/icons/check';
	import {
		ArrowDownRight,
		ArrowDownRightFromCircle,
		ArrowRight,
		ArrowUpRight,
		ClockAlertIcon,
		Train,
		TrainFront,
		TramFront,
		X
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { isDirty } from 'zod/v3';
	import ChangeNotifier from '../board/change-notifier.svelte';
	import Button from '../ui/button/button.svelte';
	import { dayjsFromHHmm, t } from '$lib/utils';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import TrainIconByCategory from './train-icon-by-category.svelte';

	let {
		cp,
		operator,
		index,
		length,
		showTrain = false,
		greyLine = false,
		category = 'standard'
	}: {
		cp: CallingPoint;
		operator: Operator;
		index: number;
		length: number;
		showTrain?: boolean;
		greyLine?: boolean;
		category?: 'standard' | 'express';
	} = $props();

	let oldCp = $state({ ...cp });
	let newCp = $derived({ ...cp });

	explicitEffect(
		() => {
			setTimeout(() => {
				oldCp = { ...newCp };
			}, 2500);
		},
		() => [newCp]
	);
</script>

<div class={['flex h-12 items-center gap-2']}>
	<div
		class={[
			'z-0 flex gap-4',

			newCp.order === 'focus' || newCp.order === 'filter'
				? 'font-medium'
				: newCp.order === 'further'
					? 'opacity-40'
					: newCp.order === 'post-destination'
						? 'opacity-25'
						: 'opacity-50'
		]}
	>
		<div
			class={[
				'w-8 min-w-8 origin-left',
				newCp.order === 'focus' || newCp.order === 'filter' ? 'scale-100' : 'scale-95'
			]}
		>
			<ChangeNotifier
				changed={newCp.times.plan.arr === newCp.times.rt.arr &&
					oldCp.times.plan.arr !== oldCp.times.rt.arr}
				class={[
					newCp.isCancelled || newCp.arrivalCancelled
						? 'text-sm text-red-600 line-through'
						: newCp.times.rt.arr !== newCp.times.plan.arr
							? newCp.times.rt.arr
								? 'text-xs/3'
								: 'text-xs/3'
							: 'text-sm text-good'
				]}
			>
				{newCp.times.plan.arr}
			</ChangeNotifier>
			{#if newCp.times.rt.arr !== newCp.times.plan.arr && !newCp.isCancelled && !newCp.arrivalCancelled}
				{#if newCp.times.rt.arr}
					<ChangeNotifier
						changed={newCp.times.rt.arr !== oldCp.times.rt.arr}
						class="text-sm/3 text-warning"
					>
						{newCp.times.rt.arr ?? 'Delayed'}
					</ChangeNotifier>
					<!-- {:else if cp.times.rt.arrSource === 'none'}
					<div class="text-foreground text-[10px]/3">Unknown</div> -->
				{:else}
					<ChangeNotifier
						changed={newCp.times.rt.arr !== oldCp.times.rt.arr}
						class="text-[10px]/3 text-warning"
					>
						Delayed
					</ChangeNotifier>
				{/if}
			{/if}
		</div>
		<div
			class={[
				'w-8 min-w-8 origin-left',
				newCp.order === 'focus' || newCp.order === 'filter' ? 'scale-100' : 'scale-95'
			]}
		>
			<ChangeNotifier
				changed={newCp.times.plan.dep === newCp.times.rt.dep &&
					oldCp.times.plan.dep !== oldCp.times.rt.dep}
				class={[
					newCp.isCancelled || newCp.departureCancelled
						? 'text-sm text-red-600 line-through'
						: newCp.times.rt.dep !== newCp.times.plan.dep
							? newCp.times.rt.dep
								? 'text-xs/3'
								: 'text-xs/3'
							: 'text-sm text-good'
				]}
			>
				{newCp.times.plan.dep}
			</ChangeNotifier>
			{#if newCp.times.rt.dep !== newCp.times.plan.dep && !newCp.isCancelled && !newCp.departureCancelled}
				{#if newCp.times.rt.dep}
					<ChangeNotifier
						changed={newCp.times.rt.dep !== oldCp.times.rt.dep}
						class="w-max text-sm/3 text-warning"
					>
						{newCp.times.rt.dep ?? 'Delayed'}
					</ChangeNotifier>
					<!-- {:else if newCp.times.rt.depSource === 'none'}
					<div class="text-foreground text-[10px]/3">Unknown</div> -->
				{:else}
					<ChangeNotifier
						changed={newCp.times.rt.dep !== oldCp.times.rt.dep}
						class="w-max text-[10px]/3 text-warning"
					>
						Delayed
					</ChangeNotifier>
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
			'relative flex h-full flex-col items-center justify-center',
			newCp.inDivision ? 'min-w-12 pl-5' : 'min-w-8 pl-1',
			newCp.isPostDestination || greyLine ? 'opacity-50' : ''
		]}
	>
		{#if cp.isOrigin || newCp.startJoin}
			<div class="grow"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{:else if index === length - 1 || newCp.endDivide}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div class="grow"></div>
		{:else if newCp.isDestination || (newCp.departureCancelled && !newCp.isCancelled)}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black opacity-50"></div>
		{:else}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div class="flex w-4">
				<div class="w-[5px]"></div>
				<div style:background={operator.color} class={['h-1.5 w-[6px]']}></div>
				<div
					style:background={operator.color}
					class={['h-1.5 grow', cp.isCancelled && 'opacity-50']}
				></div>
			</div>
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
		{/if}
		{#if (newCp.departed || newCp.isCancelled) && newCp.showTrain && showTrain}
			<div
				class="absolute top-9 z-10"
				in:t.receive|global={{
					key: newCp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
				out:t.send|global={{
					key: newCp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
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
		{:else if newCp.arrived && newCp.showTrain && showTrain}
			<div
				class="absolute top-1/2 z-10 -translate-y-1/2"
				in:t.receive|global={{
					key: newCp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
				}}
				out:t.send|global={{
					key: newCp.inDivision ? 'train-pos-icon-division' : 'train-pos-icon-'
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
	<div class={['min-w-0 grow', newCp.order === 'post-destination' ? 'opacity-40' : '']}>
		<div class="flex items-end gap-1">
			<div
				class={[
					'min-w-0 overflow-hidden text-base/5 text-nowrap text-ellipsis',
					{
						'font-semibold':
							newCp.order === 'focus' || newCp.order === 'filter' || newCp.isDestination,
						'text-base-5': newCp.order === 'further' || newCp.order === 'filter',
						'text-muted-foreground/60': newCp.order === 'further' && !newCp.isDestination,
						'text-muted-foreground': newCp.order === 'subsequent' && !newCp.isDestination,
						'text-sm/4': newCp.order !== 'focus' && newCp.order !== 'filter'
					}
				]}
			>
				{newCp.name}
			</div>
			<div
				class={[
					'text-zinc-400',
					newCp.order === 'focus' || newCp.isDestination || newCp.order === 'filter'
						? 'text-[10px]/4'
						: 'text-[10px]/3'
				]}
			>
				({newCp.crs})
			</div>
		</div>
		{#if newCp.isCancelled}
			<ChangeNotifier
				changed={newCp.isCancelled !== oldCp.isCancelled}
				class="w-max text-xs/4 text-red-600"><X size={16} /> Cancelled</ChangeNotifier
			>
			<!-- {:else if newCp.departed && cp.order === 'focus'}
			<ChangeNotifier
				changed={newCp.departed !== oldCp.departed}
				class={['flex w-max items-center gap-1 text-[10px]/4 text-muted-foreground']}
			>
				<ArrowUpRight size={12} /> Departed {(newCp.delay ?? 0) > 0
					? `${newCp.delay}m late`
					: (newCp.delay ?? 0) < 0
						? `${Math.abs(newCp.delay ?? 0)}m early`
						: 'on time'}
			</ChangeNotifier>
		{:else if newCp.arrived && cp.order === 'filter'}
			<div class="flex items-center gap-1 text-[10px]/4 text-muted-foreground">
				<ArrowDownRight size={12} /> Arrived {(newCp.arrivalDelay ?? 0) > 0
					? `${newCp.arrivalDelay}m late`
					: (newCp.arrivalDelay ?? 0) < 0
						? `${Math.abs(newCp.arrivalDelay ?? 0)}m early`
						: 'on time'}
			</div>
		{:else if (newCp.delay ?? 0) > 5 && cp.order === 'focus'}
			<div class="flex items-center gap-1 text-[10px]/4 text-muted-foreground">
				<ClockAlertIcon size={12} /> Expected departure {newCp.delay}m late
			</div>
		{:else if (newCp.arrivalDelay ?? 0) > 5 && cp.order === 'filter'}
			<div class="flex items-center gap-1 text-[10px]/4 text-muted-foreground">
				<ClockAlertIcon size={12} /> Expected arrival {newCp.arrivalDelay}m late
			</div> -->
		{/if}
	</div>
	<ChangeNotifier
		changed={newCp.platform !== oldCp.platform}
		class={[
			newCp.order === 'focus' ? 'text-lg font-medium' : 'text-sm text-zinc-400',
			newCp.order === 'post-destination' ? 'opacity-25' : ''
		]}
	>
		{newCp.platform ?? '-'}
	</ChangeNotifier>
	<!-- <DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button size="sm">Edit</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<Button
				size="sm"
				onclick={() => {
					newCp.times.rt.arr = dayjsFromHHmm(newCp.times.rt.arr).add(5, 'minutes').format('HH:mm');
					newCp.times.rt.dep = dayjsFromHHmm(newCp.times.rt.dep).add(5, 'minutes').format('HH:mm');
				}}>Delay</Button
			>
			<Button
				size="sm"
				onclick={() => {
					newCp.platform = prompt('Enter new platform') || '';
				}}>Platform</Button
			>
			<Button
				size="sm"
				onclick={() => {
					newCp.isCancelled = true;
					newCp.arrivalCancelled = true;
					newCp.departureCancelled = true;
				}}>Cancel</Button
			>
			<Button
				size="sm"
				onclick={() => {
					newCp.departed = true;
				}}>Depart</Button
			>
		</DropdownMenu.Content>
	</DropdownMenu.Root> -->
</div>
