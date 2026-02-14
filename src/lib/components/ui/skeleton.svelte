<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, style = '' } = $props();
</script>

<div {style} class={cn(['animate-pulse rounded-md bg-accent', className])}></div>
