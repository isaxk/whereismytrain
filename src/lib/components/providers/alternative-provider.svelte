<script lang="ts">
	import dayjs from 'dayjs';
	import { onMount, type Snippet } from 'svelte';

	import type { BoardItem } from '$lib/types';
	import { dayjsFromHHmm } from '$lib/utils';


	let service: BoardItem | null = $state(null);

	let {
		from,
		to,
		time,
		allowance,
		children,
		existingRid
	}: {
		from: string;
		to: string;
		time: string | null;
		allowance: number;
		children: Snippet<
			[{ failed: boolean; loading: boolean; serviceId: string | null; item: BoardItem | null }]
		>;
		existingRid: string;
	} = $props();

	let failed = $state(false);
	let loading = $state(false);

	async function search(from: string, to: string, offset: number) {
		loading = true;
		try {
			const response = await fetch(`/api/fastest/${from}/${to}/${offset}`);

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
		loading = false;
	}

	onMount(() => {
		const offset = (time ? dayjsFromHHmm(time) : dayjs()).diff(dayjs(), 'minutes');
		search(from, to, offset + allowance);
	});
</script>

{#if service}
	{@render children({
		failed,
		loading,
		item: service,
		serviceId: service.rid
	})}
{:else}
	{@render children({ failed, loading, item: null, serviceId: null })}
{/if}
