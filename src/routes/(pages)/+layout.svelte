<script>
	import { page } from '$app/state';
	import { ArrowLeft, ChevronLeft } from 'lucide-svelte';

	let { children } = $props();
</script>

<div class="">
	<div class="pt-6 rounded-t-xl bg-background sticky top-0 p-4 border-b-border border-b flex items-center gap-2">
		<a href="../"><ArrowLeft /></a>
		<a href="../" class="text-xl font-semibold">{page.data.pageTitle}</a>
	</div>

	<div class="p-4 pb-10">
		{@render children?.()}
	</div>
</div>
