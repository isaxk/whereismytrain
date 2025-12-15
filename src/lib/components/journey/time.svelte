<script lang="ts">
	import dayjs from 'dayjs';

	let {
		scheduled,
		estimated,
		small = false
	}: { scheduled: string; estimated: string | null; small?: boolean } = $props();
</script>

{#if small}
	{#if estimated !== scheduled}
		<div class="text-xs/3 text-yellow-600">
			{dayjs(estimated).format('HH:mm')}
		</div>

		<div class="text-[10px]/3 line-through">
			{dayjs(scheduled).format('HH:mm')}
		</div>
	{:else}
		<div class="text-xs text-green-600">
			{dayjs(estimated).format('HH:mm')}
		</div>
	{/if}
{:else if estimated !== scheduled}
	<div class="text-sm/3 text-yellow-600">
		{dayjs(estimated).format('HH:mm')}
	</div>

	<div class="text-[10px]/3 line-through">
		{dayjs(scheduled).format('HH:mm')}
	</div>
{:else}
	<div class="text-sm text-green-600">
		{dayjs(estimated).format('HH:mm')}
	</div>
{/if}
