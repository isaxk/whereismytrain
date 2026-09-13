<script lang="ts">
	import { Bus, ClockAlert, X } from '@lucide/svelte/icons';
	import Check from '@lucide/svelte/icons/check';
	import dayjs from 'dayjs';

	import { saved } from '$lib/state/saved.svelte';
	import type { SavedTrainServiceInfo } from '$lib/types';

	import TrainDiagram from '../itinerary/train-diagram.svelte';

	let {
		title,
		data
	}: {
		title: string;
		data: SavedTrainServiceInfo & { serviceId: string };
	} = $props();
</script>

<div
	class="block w-full rounded-md border border-border bg-background py-2 pr-4 pl-0 drop-shadow-xs sm:w-md sm:pl-2"
>
	<a href="/board/{data.crs}/t/{data.serviceId}?to={data.filter}">
		<TrainDiagram {...data} showDate={false} />
	</a>
</div>
