<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	import { onMount } from 'svelte';

	import { refreshing } from '$lib/state/services-subscriber.svelte';

	let { children } = $props();

	onMount(() => {
		const interval = setInterval(() => {
			// console.log('refreshing');
			refreshing.current = true;
			invalidateAll().then(() => {
				if (page.data.map) {
					page.data.map.then(() => {
						refreshing.current = false;
					});
				} else {
					refreshing.current = false;
				}
			});
		}, 10000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

{@render children()}
