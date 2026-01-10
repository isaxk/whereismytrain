<script lang="ts">
	import * as Item from '$lib/components/ui/item';

	import BoardItem from '../board/board-item.svelte';
	import Button from '../ui/button/button.svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let {
		failed,
		from,
		to,
		offset,
		service,
		switchTo,
		switching,
		outline = false,
		showDescription = true
	} = $props();
</script>

<Item.Root variant={outline ? 'outline' : 'default'}>
	{#if failed}
		<div>
			<Item.Title>Could not find an alternative in the next 2 hours</Item.Title>
			<Item.Description
				><a class="block" href="/board/{from}?to={to}&offset={offset}">Make a search</a>
				<a href="https://www.nationalrail.co.uk">or use the national rail journey planner</a
				></Item.Description
			>
		</div>
		<Item.Actions class="flex w-full max-w-full  gap-2">
			<Button href="/board/{from}?to={to}&offset={offset}" variant="secondary" class="w-1/2 grow">
				Make a search
			</Button>
			<Button href="https://nationalrail.co.uk" variant="secondary" class="w-1/2 grow">
				NR Journey Planner
			</Button>
		</Item.Actions>
	{:else if service}
		<div class="w-full">
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
					planDep={service.times.plan.dep}
					destination={service.destination}
					isCancelled={service.isCancelled}
					departed={service.departed}
					platform={service.platform}
					operator={service.operator}
				></BoardItem>
			</div>
		</div>
		<Item.Actions class="flex w-full max-w-full flex-col gap-2">
			<Button variant="default" class="w-full" onclick={() => switchTo()}>
				{#if switching}
					<Spinner />
				{:else}
					Switch
				{/if}
			</Button>
			<div class="grid w-full grid-cols-2 gap-2">
				<Button href="/board/{from}?to={to}&offset={offset}" variant="secondary" class="grow">
					More alternatives
				</Button>
				<Button href="https://nationalrail.co.uk" variant="secondary" class="grow">
					NR Journey Planner
				</Button>
			</div>
		</Item.Actions>
	{:else}
		<Item.Title><Spinner /> Searching for an alternative</Item.Title>
	{/if}
</Item.Root>
