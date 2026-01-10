<script lang="ts">
	import { ShareIcon } from 'lucide-svelte';

	import Button from '../ui/button/button.svelte';

	let { title, text, url } = $props();

	function share() {
		navigator.share({
			title,
			text,
			url
		});
	}
</script>

<Button variant="outline" class="w-full" onclick={share}><ShareIcon /> Share this service</Button>
