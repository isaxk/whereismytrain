<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { onUpdate } from 'sveltekit-cache-first';

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

		onUpdate((accept) => {
			toast('An update is available', {
				description: 'Refresh the page to update',
				duration: 10000,
				action: {
					label: 'Refresh',
					onClick: () => accept()
				}
			});
		});
	});
</script>

{@render children?.()}
