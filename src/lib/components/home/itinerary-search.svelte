<script lang="ts">
	import {
		ArrowDownLeft,
		ArrowDownRight,
		ArrowUpRight,
		CircleAlert,
		Clock,
		GitCompareArrowsIcon,
		PlusCircle,
		X
	} from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import Input from '../ui/input/input.svelte';
	import Switch from '../ui/switch/switch.svelte';
	import Label from '../ui/label/label.svelte';
	import dayjs from 'dayjs';
	import Autocomplete from '../itinerary/autocomplete.svelte';
	import * as Item from '../ui/item';
	import { onMessage } from 'firebase/messaging';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { dayjsFromHHmm } from '$lib/utils';

	let changes = $state([null]);

	let from = $state('');
	let to = $state('');
	let time = $state(dayjs().format('HH:mm'));
	let tomorrow = $state(false);

	let currentInput = $state(0);

	onMount(() => {
		if (page.data.withFrom) {
			from = page.data.withFrom;
		}
		if (page.data.withTo) {
			to = page.data.withTo;
		}
		if (page.data.withTime) {
			time = dayjsFromHHmm(page.data.withTime, false).format('HH:mm');
		}
		if (page.data.withTomorrow) {
			tomorrow = true;
		}
	});
</script>

<div class="flex flex-col gap-2 pt-5">
	<div class="flex items-center gap-2 border-b border-border pb-2">
		<div class="flex min-w-6 justify-center">
			<Clock class="text-muted-foreground" size={18} />
		</div>
		<Input bind:value={time} type="time" class="flex w-18 text-center" />
		<div class="grow"></div>
		<Switch bind:checked={tomorrow} id="tomorrow"></Switch>
		<Label for="tomorrow">Tomorrow</Label>
	</div>
	<div class="flex items-center gap-2">
		<div class="relative flex min-w-6 justify-center">
			<ArrowUpRight class="text-muted-foreground" size={20} />
			<div class="absolute top-6 -bottom-5 w-px bg-muted-foreground/60"></div>
		</div>
		<Autocomplete
			onFocus={() => (currentInput = 0)}
			onChoose={() => (currentInput = 1)}
			bind:value={from}
			placeholder="Enter origin..."
		/>
	</div>
	{#each changes as change, i (i)}
		<div class="flex items-center gap-2">
			<div class="relative flex min-w-6 justify-center">
				<GitCompareArrowsIcon class="text-muted-foreground" size={18} />
				<div class="absolute top-6 -bottom-5 w-px bg-muted-foreground/60"></div>
			</div>
			<Autocomplete
				onFocus={() => (currentInput = i + 1)}
				autofocus={currentInput === i + 1}
				onChoose={() => (currentInput = i + 2)}
				bind:value={changes[i]}
				placeholder="Enter change point {i + 1}..."
			/>
			{#if changes.length > 1}
				<Button variant="outline" size="icon" onclick={() => changes.splice(i, 1)}><X /></Button>
			{/if}
		</div>
	{/each}

	<button
		onclick={() => {
			changes.push(null);
			currentInput = changes.length;
		}}
		class="flex items-center justify-start gap-2 p-0 py-2 text-sm text-muted-foreground"
	>
		<div class="relative flex min-w-6 justify-center">
			<PlusCircle size={18} />
			<div class="absolute top-6 -bottom-5 w-px bg-muted-foreground/60"></div>
		</div>
		Add change</button
	>
	<div class="flex items-center gap-2">
		<div class="relative flex min-w-6 justify-center">
			<ArrowDownRight class="text-muted-foreground" size={20} />
		</div>
		<Autocomplete
			onFocus={() => (currentInput = changes.length + 1)}
			autofocus={currentInput === changes.length + 1}
			bind:value={to}
			placeholder="Enter destination..."
		/>
	</div>
	<div class="w-full pt-2">
		<Button
			href="/itinerary/{time.replaceAll(':', '')}/{tomorrow}/{from},{changes.join(',')},{to}"
			class="w-full">Go</Button
		>
	</div>
</div>

<div class="pt-5"></div>
<Item.Root class="pt-5 text-xs" variant="outline">
	<Item.Header>
		<div class="flex items-center gap-1">
			<div class="min-w-6">
				<CircleAlert size={16} />
			</div>
			This feature is designed for people with existing itineraries. If you have not planned your route,
			use the national rail journey planner, and add your origin, change points and destination here
			to receive real time notifications, and alternatives when delays disrupt your journey.
		</div>
	</Item.Header>
</Item.Root>
