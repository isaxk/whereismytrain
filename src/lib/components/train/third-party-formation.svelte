<script lang="ts">
	import { getKnownFormation } from '$lib/data/formations';
	import type { Carriage } from '$lib/types';

	import Formation from './formation.svelte';

	let { op, crs, sdd, uid, length, placeholder, destinations } = $props();

	console.log('length', length);

	async function getFormation(op: string, length: number, destinations: string[]) {
		const knownFormation = getKnownFormation(op, length, destinations);
		console.log('knownFormation', knownFormation);
		if (knownFormation) {
			return knownFormation;
		} else {
			const response = await fetch(`/api/formation/${op}/${uid}/${sdd}/${crs}`);
			const data = await response.json();
			return data.length > 0 ? data : null;
		}
	}

	let data: Carriage[] | null = $state(placeholder ?? null);

	$effect(() => {
		getFormation(op, length, destinations).then((d) => {
			if (d) data = d;
		});
	});
</script>

{#if data}
	<div class="px-4">
		<Formation formation={data} {destinations} />
	</div>
{:else if op === 'GW'}
	<div class="flex gap-1 overflow-x-scroll px-4">
		{#each Array(10)}
			<div
				class="relative flex h-16 min-w-16 flex-col items-center justify-center gap-0.5 rounded border border-border bg-background drop-shadow-xs"
			></div>
		{/each}
	</div>
{/if}
