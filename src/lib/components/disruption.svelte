<script lang="ts">
	import { AlertCircle } from 'lucide-svelte';
	import AlertCard from './alert-card.svelte';
	import Skeleton from './skeleton.svelte';

	let { code, type = 'delay' }: { code: string; type?: 'delay' | 'cancel' } = $props();

	async function getReasonCode(code: string) {
		const res = await fetch(`/api/reasoncode/${code}`);
		const data = await res.json();
		return data;
	}

	const data = getReasonCode(code);
</script>

<!-- {#await data}
	<AlertCard status={type === 'cancel' ? 'major' : 'minor'} text="Loading..." />
{:then data}
	<AlertCard
		status={type === 'cancel' ? 'major' : 'minor'}
		text={type === 'delay' ? data.lateReason : data.cancReason}
	/>
{/await} -->

<AlertCard status={type === 'cancel' ? 'major' : 'minor'}>
	{#await data}
		<Skeleton class="w-full h-8 bg-zinc-200/50" />
	{:then data}
		{type === 'delay' ? data.lateReason : data.cancReason}
	{/await}
</AlertCard>
