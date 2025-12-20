<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { paneHeight } from '$lib/state/map.svelte';
	import { CupertinoPane } from 'cupertino-pane';
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';

	let { children }: { children: Snippet } = $props();

	let paneElm: HTMLDivElement | undefined = $state();
	let mounted = $state(false);
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
				events: { onDrag: (event) => console.log('Drag event', event) },
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

	onNavigate(({ to }) => {
		if (to?.params?.id) {
			pane?.moveToBreak('middle');
			paneHeight.current = 500;
		}
	});
</script>

<div bind:this={paneElm} class={['w-full rounded-t-2xl bg-background ']}>
	{@render children()}
</div>
