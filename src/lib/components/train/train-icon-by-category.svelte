<script lang="ts">
	import { Bus, Moon, TrainFront, TrainFrontTunnel, TramFront } from 'lucide-svelte';

	let { category, ...restProps } = $props();
</script>

{#if category === 'express'}
	<TrainFront {...restProps} />
{:else if category === 'sleeper'}
	<Moon {...restProps} />
{:else if category === 'bus'}
	<Bus {...restProps} />
{:else if category === 'metro'}
	<TrainFrontTunnel {...restProps} />
{:else}
	<TramFront {...restProps} />
{/if}
