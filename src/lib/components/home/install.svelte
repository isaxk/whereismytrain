<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { buttonVariants } from '../ui/button';
	import { Download } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		trigger,
		description = 'Enables notifications and a more convenient experience.'
	}: { trigger: Snippet; description?: string } = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{@render trigger()}
	</Dialog.Trigger>
	<Dialog.Content class="w-full">
		<Dialog.Header>
			<Dialog.Title>Install instructions</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		<div class="mx-auto flex max-w-[75%] justify-center">
			<Carousel.Root class="">
				<Carousel.Content>
					<Carousel.Item class="">
						<img
							src="/step1.jpeg"
							class="h-[400px] w-full rounded-2xl border border-border object-cover object-bottom-right drop-shadow-xs"
							alt=""
						/>
					</Carousel.Item>
					<Carousel.Item class="">
						<img
							src="/step2.jpeg"
							class="h-[400px] w-full rounded-2xl border border-border object-cover object-bottom-right drop-shadow-xs"
							alt=""
						/>
					</Carousel.Item>
					<Carousel.Item class="">
						<img
							src="/step3.jpeg"
							class="h-[400px] w-full rounded-2xl border border-border object-cover object-bottom drop-shadow-xs"
							alt=""
						/>
					</Carousel.Item>
					<Carousel.Item class="">
						<img
							src="/step4.jpeg"
							class="h-[400px] w-full rounded-2xl border border-border object-cover object-bottom drop-shadow-xs"
							alt=""
						/>
					</Carousel.Item>
					<Carousel.Item class="">
						<img
							src="/step5.jpeg"
							class="max-h-[400px] w-full rounded-2xl border border-border object-cover object-top drop-shadow-xs"
							alt=""
						/>
					</Carousel.Item>
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		</div>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'default' })}>Got it</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
