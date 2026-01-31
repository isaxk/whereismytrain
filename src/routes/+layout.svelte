<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { onMount } from 'svelte';
	let { children } = $props();

	onMount(() => {
		injectAnalytics();
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('message', (event) => {
				if (event.data.type === 'NOTIFICATION_CLICK') {
					if (event.data.url !== page.url.pathname) {
						goto(event.data.url);
					}
				}
			});
		}
	});
</script>

{@render children?.()}
