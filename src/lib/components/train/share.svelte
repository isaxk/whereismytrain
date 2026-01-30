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

<Button variant="outline" class="bg-white/5 hover:bg-white/10" size="icon" onclick={share}
	><ShareIcon /></Button
>
