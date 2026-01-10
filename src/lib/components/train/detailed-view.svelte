<script lang="ts">
	import dayjs from 'dayjs';

	import type { ServiceLocation } from '$lib/types';

	let { locations }: { locations: ServiceLocation[] } = $props();
</script>

<div class="w-full overflow-x-auto">
	<div class="w-max">
		<div class="flex min-w-full items-end gap-2 border-b border-border px-4 py-1 text-xs">
			<div class="">
				<div class="font-medium">Planned</div>
				<div class="flex gap-2 text-left text-[10px]">
					<div class="min-w-12">Arr.</div>
					<div class="min-w-12">Dep.</div>
				</div>
			</div>
			<div class="">
				<div class="font-medium">Realtime</div>

				<div class="flex gap-2 text-left text-[10px]">
					<div class="min-w-12">Arr.</div>
					<div class="min-w-12">Dep.</div>
				</div>
			</div>
			<div class="w-full font-medium">Name</div>
			<div class="font-medium">Platform</div>
		</div>
		{#each locations as location, i (location.tiploc + location.std + i)}
			<div
				class={[
					'flex min-w-full items-center gap-2 border-b border-border px-4 even:bg-muted/60',
					location.isCallingPoint ? 'py-1' : 'py-0 opacity-60',
					location.isCancelled ? 'text-danger line-through' : ''
				]}
			>
				<div class="w-12 min-w-12 font-mono text-xs">
					{location.sta ? dayjs(location.sta).format('HHmmss') : '------'}
				</div>
				<div class="w-12 min-w-12 font-mono text-xs">
					{location.std ? dayjs(location.std).format('HHmmss') : '------'}
				</div>
				<div class={['w-12 min-w-12 font-mono text-xs', location.ata && 'font-semibold']}>
					{location.ata || location.eta
						? dayjs(location.ata ?? location.eta).format('HHmmss')
						: '------'}
				</div>
				<div class={['w-12 min-w-12 font-mono text-xs', location.atd && 'font-semibold']}>
					{location.atd || location.etd
						? dayjs(location.atd ?? location.etd).format('HHmmss')
						: '------'}
				</div>
				<div
					class={[
						'w-full pr-4 text-nowrap',
						location.isCallingPoint ? 'text-base font-semibold' : 'text-xs'
					]}
				>
					{location.name}
				</div>
				<div class="">{location.platform}</div>
			</div>
		{/each}
	</div>
</div>
