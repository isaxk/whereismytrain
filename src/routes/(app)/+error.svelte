<script lang="ts">
	import { page } from '$app/state';

	import { ArrowLeft } from 'lucide-svelte';

	import Button from '$lib/components/ui/button/button.svelte';
</script>

<div class="border-b border-border p-4">
	<Button variant="outline" href="/"><ArrowLeft /> Back to Home</Button>
</div>
<div class="p-4">
	<div class="text-lg">An error occurred</div>
	<div class="text-2xl font-medium">"{page.error?.message || 'Unknown'}"</div>
</div>
