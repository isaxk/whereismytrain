<script lang="ts">
	import './layout.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { MapLibre } from 'svelte-maplibre';
	import { onDestroy, onMount } from 'svelte';
	import { CupertinoPane } from 'cupertino-pane';
	import { MediaQuery } from 'svelte/reactivity';
	import Map from '$lib/components/map.svelte';
	import { page } from '$app/state';
	import { paneHeight } from '$lib/state/map.svelte';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();
	let paneElm: HTMLDivElement;
	let pane: CupertinoPane;
	const lg = new MediaQuery('(min-width: 1024px)');
	let mounted = $state(false);

	$effect(() => {
		mounted = true;

		if (lg.current) {
			pane?.destroy();
		} else {
			pane = new CupertinoPane(paneElm, {
				parentElement: 'body', // Parent container
				breaks: {
					middle: { enabled: true, height: 500, bounce: true },
					bottom: { enabled: true, height: 150, bounce: true }
				},
				events: { onDrag: (event) => console.log('Drag event', event) },
				buttonDestroy: false
			});

			pane.present({ animate: true });

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

	let paneHeaderColour = $state(null);

	onNavigate(({ to }) => {
		if (to?.params?.id) {
			pane?.moveToBreak('middle');
			paneHeight.current = 500;
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="fixed inset-0 flex">
	{#if lg.current}
		<div
			class={[
				lg.current
					? 'bg-background relative h-full w-md max-w-md min-w-md transform-gpu overflow-y-scroll'
					: ''
			]}
		>
			{@render children()}
		</div>
	{:else}
		<div
			style:background={paneHeaderColour ?? ''}
			bind:this={paneElm}
			class="bg-background w-full rounded-t-xl"
		>
			{@render children()}
		</div>
	{/if}
	{#if mounted}
		<Map />
	{/if}
</div>
