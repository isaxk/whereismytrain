<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import type { BoardItem as BoardItemType } from '$lib/types';

	import BoardItem from '../board/board-item.svelte';
	import Button from '../ui/button/button.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let {
		state,
		from,
		to,
		time,
		service,
		onSwitch,
		switching,
		outline = false,
		showDescription = true
	}: {
		from: string;
		to: string;
		time: string;
		outline?: boolean;
		showDescription?: boolean;
	} & (
		| {
				state: 'loading' | 'failed';
				service?: BoardItemType;
				onSwitch?: () => void;
				switching?: boolean;
		  }
		| {
				state: 'complete';
				service: BoardItemType;
				onSwitch: () => void;
				switching: boolean;
		  }
	) = $props();
</script>

<Item.Root variant={outline ? 'outline' : 'default'}>
	{#if state === 'complete' && service}
		<div class="h-max w-full">
			<Item.Title>An alternative was found</Item.Title>
			{#if showDescription}
				<Item.Description class="grow text-xs text-muted-foreground">
					<div class="">
						You ticket should be valid on the next available connecting train that meets the
						requirements stated on your ticket.
					</div>
				</Item.Description>
			{/if}
			<div>
				<BoardItem
					class="h-18 pt-2"
					href="#"
					rtDep={service.times.rt.dep}
					planDep={service.times.plan.dep ?? ''}
					destination={service.destination}
					isCancelled={service.isCancelled}
					departed={service.departed}
					platform={service.platform}
					operator={service.operator}
				></BoardItem>
			</div>
		</div>
		<Item.Actions class="flex w-full max-w-full flex-col gap-2">
			<Button variant="default" class="w-full" onclick={() => onSwitch?.()}>
				{#if switching}
					<Spinner />
				{:else}
					Switch
				{/if}
			</Button>
			<div class="grid w-full grid-cols-2 gap-2">
				<Button href="/board/{from}?to={to}&time={time}" variant="secondary" class="grow">
					More alternatives
				</Button>
				<Button href="https://nationalrail.co.uk" variant="secondary" class="grow">
					NR Journey Planner
				</Button>
			</div>
		</Item.Actions>
	{:else if state === 'failed'}
		<div class="w-full">
			<Item.Title>No direct alternatives found</Item.Title>
			<Item.Description
				>They may services later in the day, or another route you can take.</Item.Description
			>
			<Item.Actions class="flex w-full max-w-full gap-2 pt-2">
				<Button href="/board/{from}?to={to}&time={time}" variant="secondary" class="grow">
					Make a search
				</Button>
				<Button href="https://nationalrail.co.uk" variant="secondary" class="grow">
					NR Journey Planner
				</Button>
			</Item.Actions>
		</div>
	{:else}
		<div class="w-full">
			<Item.Title><Spinner /> Searching for alternatives...</Item.Title>
		</div>
	{/if}
</Item.Root>
