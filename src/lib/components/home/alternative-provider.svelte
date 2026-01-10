<script lang="ts">
	import dayjs from 'dayjs';

	import { subscribeToTrain, unsubscribeToTrain } from '$lib/notifications';
	import { saved } from '$lib/state/saved.svelte';
	import type { BoardItem } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';

	import type { Snippet } from 'svelte';

	let service: BoardItem | null = $state(null);

	let {
		from,
		to,
		time,
		index,
		children,
		existingRid,
		allowance = 0
	}: {
		from: string;
		to: string;
		time: string | null;
		index: number;
		children: Snippet<[BoardItem | null, () => void, boolean, boolean]>;
		existingRid: string;
		allowance: number;
	} = $props();

	let switching = $state(false);
	let failed = $state(false);

	async function search(from: string, to: string, offset: number) {
		try {
			const response = await fetch(`/api/fastest/${from}/${to}/${offset + allowance}`);

			if (response.ok) {
				const data = await response.json();
				if (data?.rid && existingRid !== data?.rid) {
					service = data;
					failed = false;
				} else {
					console.log('failed');
					service = null;
					failed = true;
				}
			} else {
				console.log('failed');
				service = null;
				failed = true;
			}
		} catch (e) {
			console.log('error caught', e);
			service = null;
			failed = true;
		}
	}

	$effect(() => {
		const offset = (time ? dayjsFromHHmm(time) : dayjs()).diff(dayjs(), 'minutes');
		search(from, to, offset + allowance);
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

			return false;
		}
		switching = false;
		return true;
	}
</script>

{#if service}
	{@render children(service, switchTo, switching, failed)}
{:else}
	{@render children(null, () => {}, false, failed)}
{/if}
