<script lang="ts">
	import { afterNavigate, onNavigate } from '$app/navigation';

	import { CupertinoPane } from 'cupertino-pane';
	import { MediaQuery } from 'svelte/reactivity';

	import { paneHeight } from '$lib/state/map.svelte';

	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let paneElm: HTMLDivElement | undefined = $state();
	let pane: CupertinoPane;
	const lg = new MediaQuery('(min-width: 1024px)');

	$effect(() => {
		if (lg.current) {
			pane?.destroy();
		} else if (paneElm) {
			pane = new CupertinoPane(paneElm, {
				parentElement: 'body', // Parent container
				breaks: {
					middle: { enabled: true, height: 500, bounce: true },
					bottom: { enabled: true, height: 150, bounce: true }
				},
				events: {},
				buttonDestroy: false
			});

			pane.present();

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
			const current = pane.currentBreak();
			if (current !== paneHeight.break) {
				pane.moveToBreak(paneHeight.break);
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
			paneHeight.current = 500;
		}

		scrollTopElm?.scrollIntoView({ inline: 'start', block: 'start' });
	});

	afterNavigate(() => {
		scrollTopElm?.scrollIntoView({ inline: 'start', block: 'start' });
	});
</script>

<div bind:this={paneElm} class={['w-full rounded-t-2xl bg-background ']}>
	<div bind:this={scrollTopElm}></div>
	{@render children()}
</div>
