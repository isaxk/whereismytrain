<script>
	import { page } from '$app/state';

	import { ArrowLeft } from 'lucide-svelte';

	let { children } = $props();
</script>

<div class="">
	<div
		class="sticky top-0 flex items-center gap-2 rounded-t-xl border-b border-b-border bg-background p-4 pt-6"
	>
		<a href="../"><ArrowLeft /></a>
		<a href="../" class="text-xl font-semibold">{page.data.pageTitle}</a>
	</div>

	<div class="p-4 pb-10">
		{@render children?.()}
	</div>
</div>
