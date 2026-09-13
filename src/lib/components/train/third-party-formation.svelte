<script lang="ts">
	import { getKnownFormation } from '$lib/data/formations';
	import type { Carriage, Formation as FormationType } from '$lib/types';

	import Formation from './formation.svelte';

	let { op, crs, sdd, uid, length, placeholder, destinations, cps, loading } = $props();

	// console.log('length', length);

	async function getFormation(op: string, length: number, destinations: string[]) {
		console.log(op, length, destinations);
		const knownFormation = getKnownFormation(op, length, destinations);
		if (knownFormation) {
			return knownFormation;
		} else {
			const response = await fetch(`/api/formation/${op}/${uid}/${sdd}/${crs}`);
			const data = await response.json();
			console.log(data);
			return data.length > 0 ? data : null;
		}
	}

	let data: FormationType[] | null = $state(placeholder ?? null);

	$effect(() => {
		getFormation(op, length, destinations).then((d) => {
			if (d) data = d;
		});
	});
</script>

{#if data}
	<div class="px-4">
		<Formation formation={data} {destinations} {cps} {loading} />
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
