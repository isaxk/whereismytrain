<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	import { onMount } from 'svelte';

	import { refreshing } from '$lib/state/services-subscriber.svelte';

	let { children } = $props();

	let timeout: ReturnType<typeof setTimeout> | undefined = $state();
	let initialLoad = $state(false);

	function refresh() {
		refreshing.current = true;
		invalidateAll().then(() => {
			if (page.data.map) {
				page.data.map.then(() => {
					refreshing.current = false;
					timeout = setTimeout(refresh, 10000);
				});
			} else {
				refreshing.current = false;
				timeout = setTimeout(refresh, 10000);
			}
		});
	}

	onMount(() => {
		page.data.board.then(() => {
			if (page.data.service) {
				page.data.service.then(() => {
					if (page.data.map) {
						page.data.map.then(() => {
							if (!initialLoad) {
								initialLoad = true;
								refresh();
							}
						});
					} else {
						if (!initialLoad) {
							initialLoad = true;
							refresh();
						}
					}
				});
			} else {
				if (!initialLoad) {
					initialLoad = true;
					refresh();
				}
			}
		});
		return () => {
			clearTimeout(timeout);
		};
	});
</script>

{@render children()}
