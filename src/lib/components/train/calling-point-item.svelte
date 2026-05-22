<script lang="ts">
	import dayjs from 'dayjs';
	import { ArrowDownRight, ArrowUpRight, Hand, X } from 'lucide-svelte';

	import { highlightedStation } from '$lib/state/map.svelte';
	import type { CallingPoint, Operator } from '$lib/types';
	import { cn, t } from '$lib/utils';

	import ChangeNotifier from '../ui/change-notifier.svelte';

	import TrainIconByCategory from './train-icon-by-category.svelte';

	const { send, receive } = t;

	let {
		hideDetails = false,
		cp,
		operator,
		index,
		length,
		showTrain = false,
		pickupOnly = false,
		setdownOnly = false,
		showArrivalMark = false,
		showDepartureMark = false,
		category = 'standard'
	}: {
		hideDetails: boolean;
		cp: CallingPoint;
		operator: Operator;
		index: number;
		length: number;
		showTrain?: boolean;
		pickupOnly?: boolean;
		setdownOnly?: boolean;
		showArrivalMark?: boolean;
		showDepartureMark?: boolean;
		category?: 'standard' | 'express' | 'metro' | 'sleeper' | 'bus';
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

	const time = $derived.by(() => {
		if (
			(['filter', 'post-destination', 'further'].includes(cp.order) &&
				cp.times.plan.arr &&
				!(cp.arrivalCancelled && !cp.departureCancelled)) ||
			!cp.times.plan.dep ||
			(!cp.arrivalCancelled && cp.departureCancelled)
		) {
			return {
				plan: cp.times.plan.arr ? dayjs(cp.times.plan.arr).format('HH:mm') : null,
				rt: cp.times.rt.arr ? dayjs(cp.times.rt.arr).format('HH:mm') : null,
				delay: cp.arrivalDelay ?? null
			};
		}
		return {
			plan: cp.times.plan.dep ? dayjs(cp.times.plan.dep).format('HH:mm') : null,
			rt: cp.times.rt.dep ? dayjs(cp.times.rt.dep).format('HH:mm') : null,
			delay: cp.delay ?? null
		};
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

			{
				'font-medium opacity-100': cp.order === 'focus' || cp.order === 'filter',
				'opacity-70':
					(cp.order === 'previous' ||
						cp.order === 'further' ||
						cp.order === 'post-destination' ||
						cp.order === 'origin' ||
						cp.order === 'subsequent') &&
					!hideDetails,
				'opacity-0': hideDetails
			}
		]}
	>
		<ChangeNotifier
			value={time.delay}
			class={[
				'flex w-max origin-left flex-col items-end',
				cp.order === 'focus' || cp.order === 'filter' ? 'scale-100' : 'scale-95'
			]}
		>
			<div
				class={[
					cp.isCancelled
						? 'text-sm text-red-600 line-through'
						: time.rt !== time.plan
							? time.rt
								? 'text-xs/3'
								: 'text-sm/3'
							: 'text-sm font-medium text-good'
				]}
			>
				<div class="text-nowrap">
					<span class="text-xs font-normal text-foreground"
						>{#if showArrivalMark}a.{:else if showDepartureMark}d.{/if}
					</span>{time.plan}
				</div>
			</div>
			{#if time.rt !== time.plan && !cp.isCancelled}
				{#if time.rt}
					<div class="text-sm/3 font-medium text-nowrap text-warning">
						{time.rt}
					</div>
				{:else}
					<div class={['text-right text-[10px]/3 font-medium', !cp.departed && 'text-warning']}>
						{#if cp.departed}
							Unknown
						{:else}
							Delayed
						{/if}
					</div>
				{/if}
			{/if}
		</ChangeNotifier>
	</div>

	<div
		class={[
			'relative flex h-full flex-col items-center justify-center',
			cp.inDivision ? 'min-w-12 pl-4' : 'min-w-8 pl-0'
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
			<!-- {:else if cp.isDestination || (cp.departureCancelled && !cp.isCancelled)}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black opacity-75"></div> -->
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
				class={cn([
					'min-w-0 overflow-hidden text-sm/4 text-nowrap text-ellipsis text-foreground/60',
					{
						'font-medium text-foreground': cp.order === 'focus' || cp.order === 'filter'
					}
				])}
			>
				{cp.name}
			</div>
			<div
				class={[
					'text-zinc-400',
					cp.order === 'focus' || cp.order === 'filter' ? 'text-[10px]/4' : 'text-[10px]/3'
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
			{/if}
		</ChangeNotifier>
	</div>

	<ChangeNotifier
		value={cp.platform}
		class={[
			'flex flex-col items-end justify-center gap-0',
			cp.order === 'focus' ? 'text-lg font-medium' : 'text-sm text-zinc-400',
			cp.order === 'post-destination' ? 'opacity-25' : '',
			hideDetails ? 'opacity-0' : ''
		]}
	>
		{cp.platform ?? '-'}
		<div>
			{#if cp.feature === 'request'}
				<div class="flex items-center gap-1 text-[10px]/3 text-muted-foreground">
					<Hand size={12} />
					request stop
				</div>
			{:else if cp.feature === 'pickup'}
				<div class="flex items-center gap-1 text-[10px]/3 text-muted-foreground">
					<ArrowUpRight size={12} /> boarding only
				</div>
			{:else if cp.feature === 'setdown'}
				<div class="flex items-center gap-1 text-[10px]/3 text-muted-foreground">
					<ArrowDownRight size={12} /> alighting only
				</div>
			{/if}
		</div>
	</ChangeNotifier>
</div>
