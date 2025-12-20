<script lang="ts">
	let { class: className, style = '' } = $props();
</script>

<div {style} class={['bg-accent animate-pulse rounded-md', className]}></div>
