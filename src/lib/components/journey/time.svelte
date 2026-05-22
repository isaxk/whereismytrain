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
		{#if estimated}
			<div class={['text-xs/3 text-warning']}>
				{estimated ? dayjs(estimated).format('HH:mm') : 'Delayed'}
			</div>
		{/if}

		<div class="text-[10px]/3 line-through">
			{dayjs(scheduled).format('HH:mm')}
		</div>
	{:else}
		<div class="text-xs text-good">
			{dayjs(estimated).format('HH:mm')}
		</div>
	{/if}
{:else if estimated !== scheduled}
	<div class="text-sm/3 text-warning">
		{estimated ? dayjs(estimated).format('HH:mm') : 'Delayed'}
	</div>

	<div class="text-[10px]/3 line-through">
		{dayjs(scheduled).format('HH:mm')}
	</div>
{:else}
	<div class="text-sm text-good">
		{dayjs(estimated).format('HH:mm')}
	</div>
{/if}
