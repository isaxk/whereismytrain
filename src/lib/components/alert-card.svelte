<script lang="ts">
	import { CircleAlert, Info } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let { status, children }: { status: 'info' | 'minor' | 'major' | 'severe'; children?: Snippet } =
		$props();
</script>

<div
	class={[
		'flex items-center gap-2.5 rounded-lg border px-3 py-2',
		{
			'border-blue-500 bg-blue-100 text-black': status === 'info',
			'border-yellow-500 bg-yellow-100 text-black': status === 'minor',
			'border-red-500 bg-red-100 text-black': status === 'major',
			'border-white bg-black text-black': status === 'severe'
		}
	]}
>
	<div>
		<CircleAlert size={14} />
	</div>
	<div class="grow text-xs">
		{@render children?.()}
	</div>
</div>
