<script lang="ts">
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		goto(`/board/${data.focus}/t/${data.id}?to=${data.filter}`);
	});
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta property="og:title" content={data.title} />
	<meta name="description" content={data.description} />
	<meta property="og:description" content={data.description} />
</svelte:head>
