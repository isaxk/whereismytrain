<script lang="ts">
	import { onMount } from 'svelte';
	import Formation from './formation.svelte';
	import type { Carriage } from '$lib/types';
	import { getKnownFormation, knownFormations } from '$lib/data/formations';

	let { op, crs, sdd, uid, length, placeholder } = $props();

	// console.log('length', length);

	async function getFormation(op, length) {
		const knownFormation = getKnownFormation(op, length);
		// console.log('knownFormation', knownFormation);
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
		getFormation(op, length).then((d) => {
			if (d) data = d;
		});
	});

	$inspect(data);
</script>

{#if data}
	<div class="px-4">
		<Formation formation={data} />
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
