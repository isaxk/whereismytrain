<script lang="ts">
	import { afterNavigate, onNavigate } from '$app/navigation';

	import { CupertinoPane } from 'cupertino-pane';
	import { MediaQuery } from 'svelte/reactivity';

	import { paneHeight } from '$lib/state/map.svelte';

	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	let paneElm: HTMLDivElement | undefined = $state();
	let pane: CupertinoPane;
	const lg = new MediaQuery('(min-width: 1024px)');

	$effect(() => {
		const offset = getComputedStyle(document.documentElement)
			.getPropertyValue('--pane-offset')

			.trim()
			.replace(/px$/, '');
		console.log('offset', offset);
		if (lg.current) {
			pane?.destroy();
		} else if (paneElm) {
			pane = new CupertinoPane(paneElm, {
				parentElement: 'body', // Parent container
				breaks: {
					top: { enabled: true, height: window.screen.height + parseInt(offset) },
					middle: { enabled: true, height: 500, bounce: true },
					bottom: { enabled: true, height: 150, bounce: true }
				},
				events: {},
				buttonDestroy: false
			});

			pane.present();

			paneHeight.break = 'middle';
			paneHeight.current = 500;

			pane?.on('onDragEnd', () => {
				const currentBreak = pane?.currentBreak();

				if (currentBreak === 'bottom') {
					paneHeight.current = 150;
					paneHeight.break = 'bottom';
				} else if (currentBreak === 'middle') {
					paneHeight.current = 500;
					paneHeight.break = 'middle';
				} else {
					paneHeight.break = 'top';
				}
			});
		}

		return () => {
			pane?.destroy();
		};
	});

	$effect(() => {
		if (pane) {
			let current = pane.currentBreak();
			if (current !== paneHeight.break) {
				pane.moveToBreak(paneHeight.break);
				current = paneHeight.break;
			}
			if (current === 'bottom') {
				paneHeight.current = 150;
			} else if (current === 'middle') {
				paneHeight.current = 500;
			} else {
				paneHeight.break = 'top';
			}
		}
	});

	let scrollTopElm: HTMLDivElement | undefined = $state();

	onNavigate(({ to }) => {
		if (to?.params?.id) {
			pane?.moveToBreak('middle');
			paneHeight.break = 'middle';
			paneHeight.current = 500;
		}

		scrollTopElm?.scrollIntoView({ inline: 'start', block: 'start' });
	});

	afterNavigate(() => {
		scrollTopElm?.scrollIntoView({ inline: 'start', block: 'start' });
	});
</script>


<div class="block sm:hidden fixed top-0 right-0 left-0 z-1000000 h-20 from-transparent via-95% via-zinc-100 bg-linear-to-t to-zinc-100">
</div>

<div
	bind:this={paneElm}
	class={['flex bg-background', paneHeight.break === 'top' || paneHeight.current === 0 ? 'rounded-t-0 sm:rounded-t-2xl' : 'rounded-t-2xl']}
>
   	<div class="fixed z-10000 top-1.5 right-0 left-0 flex h-2 min-w-10 justify-center lg:hidden">
		<div class={["h-[5px] w-10 rounded-sm ", page.data.id ? 'bg-white/40' : 'bg-black/40', paneHeight.break !== 'top' ? 'opacity-50' : 'opacity-100']}></div>
	</div>
	<div bind:this={scrollTopElm}></div>
	<div class="flex min-h-full flex-col">
		{@render children()}
	</div>
</div>
