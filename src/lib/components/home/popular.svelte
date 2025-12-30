<script lang="ts">
	let { crs, children } = $props();

	let list = $state([]);

	async function getPopular(crs: string) {
		const response = await fetch(`/api/popular/${crs}`);
		const data = await response.json();
		return data;
	}

	$effect(() => {
		getPopular(crs).then((d) => {
			list = d;
		});
	});
</script>

{#each list as item, i}
	{@render children(item.name, item.crs, i)}
{/each}
