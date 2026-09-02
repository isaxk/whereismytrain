<script lang="ts">
	let { type = 'split', color = '#000000' }: { type: 'split' | 'end-split'; color?: string } =
		$props();
</script>

{#if type === 'split'}
	<div class="flex h-8 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div class="relative h-8 w-8">
		<div style:background={color} class="absolute left-0 top-0 bottom-0 w-3 bg-black"></div>
		<div style:background={color} class="absolute rounded-tr-md left-4 h-4 bottom-0 w-3 bg-black"></div>
		<div class="absolute left-2.5 bottom-0 -rotate-45">
		<div style:background={color} class="h-8 w-3 bg-black rounded-br-lg rounded-tl-md"></div>
		</div>
		</div>
	</div>
	<div class="flex h-4 min-h-4 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div class="flex h-full w-12 items-center justify-start">
			<div
				style:background="linear-gradient(to bottom, {color}, transparent)"
				class="h-4 w-3 bg-black"
			></div>
			<div class="w-3"></div>
			<!-- <div style:background={color} class="h-4 w-3 bg-black"></div> -->
		</div>
	</div>
{:else if type === 'end-split'}
	<div class="flex h-4 min-h-4 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div class="flex h-full w-12 items-center justify-start">
			<div
				style:background="linear-gradient(to top, {color}, transparent)"
				class="h-4 w-3 bg-black"
			></div>
			<div class="w-3"></div>
			<div class="h-4 w-3 bg-transparent"></div>
		</div>
	</div>
{/if}
