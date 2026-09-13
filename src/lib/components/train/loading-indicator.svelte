<script lang="ts">
	import { Users } from '@lucide/svelte';

	let { loading } = $props();
</script>

<div class="flex items-center gap-1 text-sm pt-2 font-medium">
	{#if loading < 10}
		<div class="bg-good p-1 text-white rounded">
			<Users size={16} />
		</div>
		Many seats available
	{:else if loading < 50}
		<div class="bg-good p-1 text-white rounded">
			<Users size={16} />
		</div>
		Some seats available
	{:else if loading < 75}
		<div class="bg-warning p-1 text-white rounded">
			<Users size={16} />
		</div>
		A few seats available
	{:else}
		<div class="bg-danger p-1 text-white rounded">
			<Users size={16} />
		</div>
		No seats available
	{/if}
</div>
