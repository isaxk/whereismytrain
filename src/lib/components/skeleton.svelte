<script lang="ts">
	let { class: className, style = '' } = $props();
</script>

<div {style} class={['animate-pulse rounded-md bg-zinc-200', className]}></div>
