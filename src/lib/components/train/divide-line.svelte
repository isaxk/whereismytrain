<script lang="ts">
	let { type = 'split', color = '#000000' }: { type: 'split' | 'end-split'; color?: string } =
		$props();
</script>

{#if type === 'split'}
	<div class="flex h-8 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div style:color class={['flex h-full w-8 flex-col justify-center pl-[3px]']}>
			<svg
				width="32"
				height="31.999998"
				viewBox="0 0 8.4666667 8.466666"
				version="1.1"
				id="svg1"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs id="defs1" />
				<g id="layer1">
					<path
						style="fill:currentColor;stroke:currentColor;stroke-width:1.5875;stroke-linecap:square;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
						d="M 0.80000001,1 V 7.7000003"
						id="path3"
					/>
					<path
						style="fill:currentColor;stroke:currentColor;stroke-width:1.5875;stroke-linecap:square;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
						d="M 0.80000001,0.80000003 V 1.0000001 A 2.5370203,2.5370203 68.487467 0 0 1.4823183,2.7310554 l 2.8353635,3.0378895 a 2.5370203,2.5370203 68.487467 0 1 0.6823183,1.7310553 v 0.2000001"
						id="path4"
					/>
				</g>
			</svg>
		</div>
	</div>
	<div class="flex h-4 min-h-4 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div class="flex h-full w-12 items-center justify-start pl-[3px]">
			<div
				style:background="linear-gradient(to bottom, {color}, transparent)"
				class="h-4 w-1.5 bg-black"
			></div>
			<div class="w-2.5"></div>
			<div style:background={color} class="h-4 w-1.5 bg-black"></div>
		</div>
	</div>
{:else if type === 'end-split'}
	<div class="flex h-4 min-h-4 gap-2 px-2">
		<div class="flex gap-3">
			<div class="w-12.5"></div>
		</div>
		<div class="flex h-full w-12 items-center justify-start pl-[3px]">
			<div
				style:background="linear-gradient(to top, {color}, transparent)"
				class="h-4 w-1.5 bg-black"
			></div>
			<div class="w-2.5"></div>
			<div class="h-4 w-1.5 bg-transparent"></div>
		</div>
	</div>
{/if}
