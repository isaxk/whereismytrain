<script lang="ts">
	import dayjs from 'dayjs';
	import type { BoardItem, TrainService } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';
	import Button from '../ui/button/button.svelte';
	import { saved } from '$lib/state/saved.svelte';
	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';

	let service: BoardItem | null = $state(null);

	let { from, to, time, index, children, existingRid, allowance = 0 } = $props();

	let switching = $state(false);

	$effect(() => {
		const offset = dayjsFromHHmm(time).diff(dayjs(), 'minutes');
		fetch(`/api/fastest/${from}/${to}/${offset + allowance}`)
			.then(async (response) => {
				const data = await response.json();
				if (response.ok && data?.rid && existingRid !== data?.rid) {
					service = data;
				} else {
					service = null;
				}
			})
			.catch(() => {
				service = null;
			});
	});

	async function switchTo() {
		console.log('switchTo called', index);
		if (!service || !saved.value[index]) return;
		switching = true;
		if (saved.value[index].subscriptionId) {
			await unsubscribeToTrain(saved.value[index].subscriptionId);
		}

		const subscriptionId = await subscribeToTrain(
			service.rid,
			from,
			to,
			service.destination.map((d) => d.name).join(', ')
		);
		const response = await fetch(`/api/service/${service.rid}/${from}/${to}`);

		if (response.ok) {
			const data = await response.json();
			console.log();
			if (data.rid !== service.rid) {
				saved.value[index] = {
					...saved.value[index],
					service: data,
					service_id: service.rid,
					focusCrs: from,
					filterCrs: to,
					lastRefreshed: Date.now(),
					subscriptionId
				};
			}
		} else {
			console.error('Failed to switch to alternative service');
		}
		switching = false;
	}
</script>

{#if service}
	{@render children(service, switchTo, switching)}
{:else}
	{@render children(null, () => {}, false)}
{/if}
