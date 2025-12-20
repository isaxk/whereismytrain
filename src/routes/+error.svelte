<script lang="ts">
	import { page } from "$app/state";
	import Button from "$lib/components/ui/button/button.svelte";
	import { ArrowLeft } from "lucide-svelte";

	let { error } = $props();
</script>

<div class="p-4 border-border border-b">
<Button variant="outline" href="/"><ArrowLeft /> Back to Home</Button>
</div>
<div class="p-4">

    <div class="text-lg">An error occurred</div>
    <div class="text-2xl font-medium">"{page.error?.message || 'Unknown'}"</div>
</div>
