<script lang="ts">
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { onMount } from 'svelte';
	let { children } = $props();

	onMount(() => {
		injectAnalytics();
	});
</script>

{@render children?.()}
