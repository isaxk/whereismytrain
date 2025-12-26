<script lang="ts">
	import '../../app.css';
	import { MediaQuery } from 'svelte/reactivity';
	import Map from '$lib/components/map/map.svelte';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';
	import Pane from '$lib/components/pane/pane.svelte';
	import { onMount } from 'svelte';
	import { initializeNotifications, setupForegroundMessageHandler } from '$lib/notifications';
	import { pwa } from '$lib/state/saved.svelte';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	const lg = new MediaQuery('(min-width: 1024px)');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		if (data.pwa === true) {
			pwa.value = true;
		}
		setupForegroundMessageHandler();
		initializeNotifications();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<ModeWatcher />
<Toaster expand position="top-center" />

<div class="fixed inset-0 flex">
	{#if lg.current}
		<div
			class="relative h-full w-md max-w-md min-w-md transform-gpu overflow-y-scroll bg-background"
		>
			{@render children()}
		</div>
	{:else}
		<Pane>
			{@render children()}
		</Pane>
	{/if}

	{#if mounted && browser}
		<Map />
	{/if}
</div>
