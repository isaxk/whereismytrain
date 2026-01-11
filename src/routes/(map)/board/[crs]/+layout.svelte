<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	import { onMount } from 'svelte';

	import { refreshing } from '$lib/state/services-subscriber.svelte';

	let { children } = $props();

	onMount(() => {
		const interval = setInterval(() => {
			console.log('refreshing');
			refreshing.current = true;
			invalidateAll().then((d) => {
				console.log(d);
				setTimeout(() => {
					refreshing.current = false;
				}, 500);
			});
		}, 10000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

{@render children()}
