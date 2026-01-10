<script lang="ts">
	let { value } = $props();
</script>

{#if Array.isArray(value)}
	{#each value as { matches, text }, i (i)}
		{#if matches}
			<span class="bg-border font-semibold text-foreground">{text}</span>
		{:else}
			{text}
		{/if}
	{/each}
{:else}
	{value}
{/if}
