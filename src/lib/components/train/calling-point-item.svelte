<script lang="ts">
	import {
		ArrowDownRight,
		ArrowUpRight,
		CircleQuestionMark,
		ClockAlert,
		ClockAlertIcon,
		Dot,
		Hand,
		Rss,
		X
	} from '@lucide/svelte/icons';
	import dayjs from 'dayjs';

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
		progress = null,
		showArrivalMark = false,
		showDepartureMark = false,
		hideRealtime = false,
		category = 'standard'
	}: {
		hideDetails: boolean;
		cp: CallingPoint;
		operator: Operator;
		index: number;
		length: number;
		showTrain?: boolean;
		progress?: number | null;
		showArrivalMark?: boolean;
		showDepartureMark?: boolean;
		hideRealtime?: boolean;
		category?: 'standard' | 'express' | 'metro' | 'sleeper' | 'bus';
	} = $props();

	let elm: HTMLDivElement;

	$effect(() => {
		if (highlightedStation.current === cp.crs + (cp.times.plan.dep ?? cp.times.plan.arr ?? '')) {
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
		'flex h-14 items-start gap-2 px-2 transition-all',
		highlightedStation.current === cp.crs + (cp.rtDepDate || '') && 'animate-pulse bg-amber-100'
	]}
>
	<div
		class={[
			'z-0 flex w-10 min-w-10 justify-end gap-0 pt-4.5 tabular-nums',

			{
				'opacity-100': cp.order === 'focus' || cp.order === 'filter',
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
				'flex w-max origin-left flex-col items-end tabular-nums',
				cp.order === 'focus' || cp.order === 'filter' ? 'scale-100' : 'scale-95'
			]}
		>
			<div
				class={[
					'font-normal',
					cp.isCancelled ? 'text-sm/5 text-red-600 line-through' : 'text-sm/5 font-medium'
				]}
			>
				<div class="text-nowrap">
					<span class="text-xs/4 font-normal text-foreground"
						>{#if showArrivalMark}a.{:else if showDepartureMark}d.{/if}
					</span>{time.plan}
				</div>
			</div>
			{#if time.rt !== time.plan && !cp.isCancelled && !hideRealtime}
				{#if time.rt}
					<div class="text-sm/3 font-semibold text-nowrap text-warning">
						{time.rt}
					</div>
				{:else}
					<div class="text-xs/3 font-semibold text-nowrap text-warning">
						{#if cp.departed}
							<span class="text-foreground">Unknown</span>
						{:else}
							Delayed
						{/if}
					</div>
				{/if}
			{:else if !cp.isCancelled && !hideRealtime}
				<div class="text-xs/3 font-semibold text-nowrap text-good">On time</div>
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
			<div
				style:background={operator.color}
				class={['h-3 w-3 rounded-t-full p-0.5', cp.departed ? 'opacity-75' : 'opacity-100']}
			>
				<div class="h-full w-full rounded-full bg-white"></div>
			</div>
			<div
				style:background={operator.color}
				class={['w-3 grow bg-black', cp.departed ? 'opacity-75' : 'opacity-100']}
			></div>
		{:else if index === length - 1 || cp.endDivide}
			<div
				style:background={operator.color}
				class={['w-3 grow bg-black', cp.arrivalCancelled ? 'opacity-75' : 'opacity-100']}
			></div>
			<div style:background={operator.color} class="h-3 w-3 rounded-b-full p-0.5">
				<div class="h-full w-full rounded-full bg-white"></div>
			</div>
			<div class="grow"></div>
			<!-- {:else if cp.isDestination || (cp.departureCancelled && !cp.isCancelled)}
			<div style:background={operator.color} class="w-1.5 grow bg-black"></div>
			<div style:background={operator.color} class="h-1.5 w-4"></div>
			<div style:background={operator.color} class="w-1.5 grow bg-black opacity-75"></div> -->
		{:else}
			<div
				style:background={operator.color}
				class={['w-3 grow bg-black', cp.arrived || cp.departed ? 'opacity-75' : 'opacity-100']}
			></div>

			<div
				style:background={operator.color}
				class={['h-3 w-3 p-0.5', cp.departed ? 'opacity-75' : 'opacity-100']}
			>
				<div
					class={[
						'h-full w-full rounded-full',
						cp.order === 'focus' || cp.order === 'filter' ? 'bg-white' : 'bg-white/75'
					]}
				></div>
			</div>

			<div
				style:background={operator.color}
				class={['w-3 grow bg-black', cp.departed ? 'opacity-75' : 'opacity-100']}
			></div>
		{/if}
		{#if (cp.departed || cp.isCancelled) && cp.showTrain && showTrain}
			{@const top = 32 + (progress ?? 0.5) * 24}
			<!-- 32px, 56px -->
			<div
				class="absolute z-10"
				style:top="44px"
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
	<div class={['min-w-0 grow pt-4.5', cp.order === 'post-destination' ? 'opacity-40' : '']}>
		<div class="flex items-end gap-1">
			<div
				class={cn([
					'min-w-0 overflow-hidden text-sm/5 text-nowrap text-ellipsis font-medium  text-foreground/60',
					{
						'text-foreground': cp.order === 'focus' || cp.order === 'filter'
					}
				])}
			>
				{cp.name}
			</div>
			<!-- <div
				class={[
					'text-zinc-400',
					cp.order === 'focus' || cp.order === 'filter' ? 'text-[10px]/4' : 'text-[10px]/3'
				]}
			>
				({cp.crs})
			</div> -->
		</div>

		<ChangeNotifier value={cp.isCancelled} class="flex w-max items-center gap-2">
			{#if cp.isCancelled}
				<div class="flex w-max items-center gap-1 text-xs/3 text-red-600">
					<X size={16} /> Cancelled
				</div>
			{:else}
				{#if cp.order === 'focus'}
					{#if cp.delay !== null && !cp.departed}
						{@const timeUntilDeparture = cp.times.rt.dep
							? dayjs(cp.times.rt.dep).diff(dayjs(), 'minute')
							: null}
						<div class="flex items-center">
							{#if timeUntilDeparture !== null && timeUntilDeparture < 60}
								<div
									class={[
										'flex items-center gap-1 text-xs/3 font-medium',
										cp.delay === 0 ? 'text-good' : 'text-warning'
									]}
								>
									<Rss size={12} />

									{#if timeUntilDeparture < 1}
										now
									{:else}
										in {timeUntilDeparture} min{#if timeUntilDeparture !== 1}s{/if}
									{/if}
								</div>
							{/if}
							{#if cp.delay !== null && cp.delay !== 0}
								<div class="flex items-center text-xs/3 text-warning">
									{#if timeUntilDeparture !== null && timeUntilDeparture < 60}
										<Dot size={14} />
									{:else}
										<ClockAlert size={12} />
									{/if}
									{Math.abs(cp.delay)} min{#if Math.abs(cp.delay) !== 1}s{/if}
									{#if cp.delay > 0}late{:else}early{/if}
								</div>
							{/if}
						</div>
					{:else if cp.delay !== null && cp.departed}
						{#if cp.delay !== 0}
							<div class="flex items-center gap-1 text-xs/3 text-warning">
								<ClockAlert size={14} />
								Departed {Math.abs(cp.delay)} min{#if Math.abs(cp.delay) !== 1}s{/if}
								{#if cp.delay > 0}late{:else}early{/if}
							</div>
						{:else}
							<div class="flex items-center gap-1 text-xs/3 text-good">
								<Rss size={14} />
								Departed
							</div>
						{/if}
					{/if}
				{/if}
				{#if cp.feature === 'request'}
					<div class="flex items-center gap-1 text-xs/3 text-muted-foreground/80">
						<Hand size={12} />
						request stop
					</div>
				{/if}
				{#if cp.feature === 'pickup'}
					<div class="flex items-center gap-1 text-xs/3 text-muted-foreground/80">
						<ArrowUpRight size={12} /> pick up only
					</div>
				{:else if cp.feature === 'setdown'}
					<div class="flex items-center gap-1 text-xs/3 text-muted-foreground/80">
						<ArrowDownRight size={12} /> set down only
					</div>
				{/if}
			{/if}
		</ChangeNotifier>
	</div>
	<div class="pt-4.5">
		<ChangeNotifier
			value={cp.platform}
			class={[
				'flex flex-col items-end justify-center gap-0',
				cp.order === 'focus' ? 'text-lg font-medium' : 'text-sm text-zinc-400',
				cp.order === 'post-destination' ? 'opacity-25' : '',
				hideDetails ? 'opacity-0' : ''
			]}
		>
			{#if cp.platform && cp.isPlatformConfirmed}
				<div class={['flex items-center gap-1']}>
					{cp.platform}
				</div>
			{/if}
			{#if cp.platform && !cp.isPlatformConfirmed}
				<div class="text-xs/5 text-zinc-400/80">
					Est. {cp.platform}
				</div>
			{/if}
		</ChangeNotifier>
	</div>
</div>
