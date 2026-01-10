<script lang="ts">
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';

	let { data } = $props();

	const focus = $derived(data.service.callingPoints.find((l) => l.order === 'focus'));
	const filter = $derived(data.service.callingPoints.find((l) => l.order === 'filter'));

	const title = $derived.by(() => {
		if (!filter || !focus) return;
		if (data.service.destination.some((d) => d.name === filter.name)) {
			return `${focus.times.plan.dep} ${focus.name} to ${data.service.destination.map((d) => d.name).join(', ')}`;
		} else {
			return `${focus.name} to ${filter.name} on the ${focus.times.plan.dep} towards ${data.service.destination.map((d) => d.name).join(', ')}`;
		}
	});

	const description = $derived(
		`Follow this ${data.service.operator.name} service live, on WhereIsMyTrain?`
	);

	onMount(() => {
		goto(`/board/${data.focus}/t/${data.id}?to=${data.filter}`);
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta name="description" content={description} />
	<meta property="og:description" content={description} />
</svelte:head>
