<script lang="ts">
	import dayjs from 'dayjs';
	import { GitCompareArrowsIcon } from 'lucide-svelte';

	import Tubeicon from '$lib/assets/tubeicon.svelte';
	import { londonTerminals } from '$lib/data/favourites';
	import { saved } from '$lib/state/saved.svelte';

	import AlternativeProvider from '../providers/alternative-provider.svelte';
	import SubscriptionProvider from '../providers/subscription-provider.svelte';
	import { buttonVariants } from '../ui/button';
	import * as Popover from '../ui/popover';

	import AlternativeDisplay from './alternative-display.svelte';

	let { crs, planArr, rtArr, originalArr } = $props();

	function isValidConnectionTime(
		acrossLondon: boolean,
		planDep: string | null,
		planArr: string | null,
		originalArr: string | null
	) {
		const originalDiff =
			planDep && planArr ? dayjs(planDep).diff(dayjs(originalArr ?? planArr), 'm') : null;

		const schDiff = planDep && planArr ? dayjs(planDep).diff(dayjs(planArr), 'm') : null;

		const maxTime = acrossLondon ? 180 : 90;

		if ((schDiff && schDiff < maxTime) || (originalDiff && originalDiff < maxTime)) return true;
		return false;
	}

	const connectingService = $derived.by(() => {
		const savedItem =
			saved.value.find((connection) => {
				if (connection.focusCrs !== crs) return null;

				return isValidConnectionTime(false, connection.service.planDep, planArr, originalArr);
			}) ??
			saved.value.find((connection) => {
				const acrossLondon =
					londonTerminals.includes(connection.focusCrs) &&
					londonTerminals.includes(crs ?? '') &&
					connection.focusCrs !== crs;

				if (connection.focusCrs !== crs && !acrossLondon) return false;

				return isValidConnectionTime(true, connection.service.planDep, planArr, originalArr);
			}) ??
			null;

		return savedItem
			? { ...savedItem?.service, service_id: savedItem?.service_id, id: savedItem?.id }
			: null;
	});
	const acrossLondon = $derived(
		connectingService !== null &&
			londonTerminals.includes(connectingService.crs) &&
			londonTerminals.includes(crs ?? '') &&
			connectingService.crs !== crs
	);

	const connection = $derived.by(() => {
		if (!connectingService) return null;
		const originalDiff =
			connectingService.planDep && planArr
				? dayjs(connectingService.planDep).diff(dayjs(originalArr ?? planArr), 'm', true)
				: null;

		const schDiff =
			connectingService.planDep && planArr
				? dayjs(connectingService.planDep).diff(dayjs(planArr), 'm', true)
				: null;

		const rtDiff =
			connectingService.rtDep && rtArr
				? dayjs(connectingService.rtDep).diff(dayjs(rtArr), 'm', true)
				: null;

		let status = 'ok';

		if (acrossLondon) {
			console.log((rtDiff ?? 0) / (originalDiff ?? schDiff ?? 1));
			if (rtDiff === null || schDiff === null) status = 'alternative';
			else if (rtDiff < 1) status = 'impossible';
			else if (rtDiff < 25) status = 'alternative';
			else if (rtDiff / (originalDiff ?? schDiff) < 0.85 && rtDiff < 50) status = 'alternative';
			else if (rtDiff < (originalDiff ?? schDiff) && rtDiff < 30) status = 'alternative';
			else if (rtDiff / schDiff < 0.6) status = 'warning';
		} else {
			if (rtDiff === null || schDiff === null) status = 'alternative';
			else if (rtDiff < 1) status = 'impossible';
			else if (rtDiff / (originalDiff ?? schDiff) < 0.6 && rtDiff < 10) status = 'alternative';
			else if (rtDiff < (originalDiff ?? schDiff) && rtDiff < 8) status = 'alternative';
			else if (rtDiff / (originalDiff ?? schDiff) < 0.6) status = 'warning';
		}

		return {
			status,
			originalDiff: originalDiff ? Math.round(originalDiff) : null,
			schDiff: schDiff ? Math.round(schDiff) : null,
			rtDiff: rtDiff ? Math.round(rtDiff) : null
		};
	});

	let popoverOpen = $state(false);
</script>

{#if connection && connectingService}
	{#if connection.status === 'ok'}
		<div class="relative h-5">
			<div class="absolute -top-8.5 right-0 left-0 flex min-h-24 items-center">
				<div class="w-12 min-w-12"></div>
				<div class="flex h-20 w-10 min-w-10 flex-col items-center justify-center gap-0.5">
					<div class="w-px grow rounded-full bg-muted-foreground"></div>
					{#if acrossLondon}
						<div class="h-6 w-6 p-1">
							<Tubeicon />
						</div>
					{:else}
						<GitCompareArrowsIcon size={15} />
					{/if}
					<div class="w-px grow rounded-full bg-muted-foreground"></div>
				</div>
				<div class="grow text-xs">
					{#if connection.schDiff !== connection.rtDiff}
						<span class="line-through opacity-80">{connection.schDiff}m</span>
					{/if}
					{connection.rtDiff}m to change {#if acrossLondon}via Underground{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="relative h-5">
			<div
				class={[
					'absolute -top-8.5 right-0 left-0 flex h-24 items-center',
					{
						'text-amber-500':
							connection.status === 'warning' || connection.status === 'alternative',

						'text-red-500': connection.status === 'impossible'
					}
				]}
			>
				<div class="w-12 min-w-12"></div>
				<div class={['flex h-20 w-10 min-w-10 flex-col items-center justify-center gap-0.5']}>
					<div
						class={[
							'w-px grow rounded-full',
							{
								'bg-amber-500':
									connection.status === 'warning' || connection.status === 'alternative',

								'bg-red-500': connection?.status === 'impossible'
							}
						]}
					></div>
					{#if acrossLondon}
						<div class="h-6 w-6 p-1">
							<Tubeicon />
						</div>
					{:else}
						<GitCompareArrowsIcon size={15} />
					{/if}
					<div
						class={[
							'w-px grow rounded-full',
							{
								'bg-amber-500':
									connection?.status === 'warning' || connection.status === 'alternative',

								'bg-red-500': connection?.status === 'impossible'
							}
						]}
					></div>
				</div>
				<div class="grow text-xs">
					{#if connection.status === 'impossible'}
						{#if connection.schDiff !== connection.rtDiff}
							<div class="line-through opacity-80">
								{(connection.schDiff ?? 0) < 0 ? connection.originalDiff : connection.schDiff}m to
								change {#if acrossLondon}via Underground{/if}
							</div>
						{/if}
						Change not possible
					{:else}
						{#if connection.schDiff !== connection.rtDiff}
							<span class="line-through opacity-80">{connection.schDiff}m</span>
						{/if}
						{connection.rtDiff}m to change {#if acrossLondon}via Underground{/if}
					{/if}
				</div>
				{#if connection.status === 'impossible' || connection.status === 'alternative' || connection.status === 'warning'}
					<Popover.Root bind:open={popoverOpen}>
						<Popover.Trigger class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'z-10']}
							>Find alternative
						</Popover.Trigger>
						<Popover.Content class="w-sm max-w-full p-0">
							<AlternativeProvider
								from={connectingService.crs}
								to={connectingService.filter}
								time={dayjs(rtArr).format('HH:mm') ?? null}
								allowance={Math.max(
									acrossLondon
										? (connection.rtDiff ?? Number.POSITIVE_INFINITY) + 5
										: Number.POSITIVE_INFINITY,
									acrossLondon ? 45 : 2, // The minimum allowance
									Math.min(
										acrossLondon ? 60 : 8, // The maximum allowance
										connection.schDiff && connection.schDiff > 1
											? Math.min(connection.schDiff, connection.originalDiff ?? 0)
											: (connection.schDiff ?? 0)
									)
								)}
								existingRid={connectingService.service_id}
							>
								{#snippet children({ loading, failed, item, serviceId })}
									{#if item && serviceId}
										<SubscriptionProvider
											{serviceId}
											crs={connectingService.crs}
											filter={connectingService.filter}
										>
											{#snippet children({ loading, onSwitchFrom })}
												<AlternativeDisplay
													state="complete"
													switching={loading}
													from={connectingService.crs}
													to={connectingService.filter}
													time={dayjs(rtArr ?? planArr ?? dayjs().format('HH:mm')).format('HHmm')}
													service={item}
													showDescription={false}
													onSwitch={() => {
														onSwitchFrom(connectingService.id).then(() => {
															popoverOpen = false;
														});
													}}
												></AlternativeDisplay>
											{/snippet}
										</SubscriptionProvider>
									{:else}
										<AlternativeDisplay
											outline
											showDescription
											from={connectingService.from}
											to={connectingService.to}
											time={dayjs(planArr).format('HHmm')}
											state={failed ? 'failed' : 'loading'}
										/>
									{/if}
								{/snippet}
							</AlternativeProvider>
						</Popover.Content>
					</Popover.Root>
				{/if}
			</div>
		</div>
	{/if}
{/if}
