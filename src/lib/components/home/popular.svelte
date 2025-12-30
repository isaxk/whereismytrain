<script lang="ts">
	let { crs, children } = $props();

	let list = $state([]);

	async function getPopular(crs: string) {
		if (localStorage.getItem('popular-' + crs)) {
			return JSON.parse(localStorage.getItem('popular-' + crs) || '[]');
		}
		const response = await fetch(`/api/popular/${crs}`);
		const data = await response.json();
		if (!data) return [];
		localStorage.setItem('popular-' + crs, JSON.stringify(data));
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
