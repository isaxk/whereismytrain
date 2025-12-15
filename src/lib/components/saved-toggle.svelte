<script lang="ts">
	import { saved } from '$lib/state/saved.svelte';
	import type { TrainService } from '$lib/types';
	import { Bell, BellRing } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		service,
		crs,
		rid,
		filter
	}: {
		service: TrainService;
		crs: string;
		rid: string;
		filter: string | null;
	} = $props();

	function save(filter: string) {
		saved.value.push({
			id: rid,
			focusCrs: crs,
			filterCrs: filter,
			service
		});
	}

	function remove() {
		saved.value = saved.value.filter((s) => s.id !== rid);
	}

	const afterCallingPoints = $derived.by(() => {
		const focus = service.callingPoints.findIndex((cp) => cp.crs === crs);
		return focus >= 0 ? service.callingPoints.slice(focus + 1) : service.callingPoints;
	});

	const firstAfterCallingPointCrs = $derived.by(() => afterCallingPoints[0]?.crs);
</script>

{#if saved.value.some((s) => s.id === rid)}
	<button onclick={() => remove()}><BellRing fill="currentColor" /></button>
{:else if filter || (afterCallingPoints.length === 1 && firstAfterCallingPointCrs)}
	<button onclick={() => save(filter ?? firstAfterCallingPointCrs!)}><Bell /></button>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger><Bell /></DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Group>
				<DropdownMenu.Label>Subscribe until when?</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each afterCallingPoints as item, i (i)}
					<DropdownMenu.Item onclick={() => item.crs && save(item.crs)}
						>{item.name}</DropdownMenu.Item
					>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
