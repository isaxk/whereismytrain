<script lang="ts">
	import { ClockAlertIcon, XIcon } from 'lucide-svelte';

	import AlertCard from '$lib/components/ui/alert-card.svelte';

	import Skeleton from '../ui/skeleton.svelte';

	let { code, type = 'delay', cancelledBetween = null }: { code: string; type?: 'delay' | 'cancel' | 'part-cancelled'; cancelledBetween?: string | null } =
		$props();

	async function getReasonCode(code: string) {
		const res = await fetch(`/api/reasoncode/${code}`);
		const data = await res.json();
		return data;
	}

	const data = getReasonCode(code);
</script>

<AlertCard
	Icon={type === 'delay' ? ClockAlertIcon : XIcon}
	status={type === 'cancel' || type === 'part-cancelled' ? 'major' : 'minor'}
>
	{#await data}
		<Skeleton class="h-4 w-full bg-zinc-200/50" />
	{:then data}
		{type === 'delay'
			? data.lateReason
			: type === 'cancel'
				? data.cancReason
				: cancelledBetween
					? data.cancReason.replace('has been cancelled', `${cancelledBetween}`)
					: data.cancReason.replace('cancelled', 'partially cancelled')}
	{/await}
</AlertCard>
