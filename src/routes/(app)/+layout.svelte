<script lang="ts">
	import '../../app.css';
	import { browser } from '$app/environment';

	import { setupConvex } from 'convex-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';

	import Map from '$lib/components/map/map.svelte';
	import Pane from '$lib/components/pane/pane.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { initializeNotifications, setupForegroundMessageHandler } from '$lib/notifications';
	import { pwa } from '$lib/state/saved.svelte';
	import { servicesSub } from '$lib/state/services-subscriber.svelte.js';

	import {
		PUBLIC_CONVEX_URL,
		PUBLIC_MAP_ENABLED,
		PUBLIC_NOTIFICATIONS_ENABLED
	} from '$env/static/public';

	let { children, data } = $props();

	const lg = new MediaQuery('(min-width: 1024px)');
	let mounted = $state(false);

	if (PUBLIC_NOTIFICATIONS_ENABLED) {
		setupConvex(PUBLIC_CONVEX_URL);
	}

	onMount(() => {
		mounted = true;
		if (data.pwa === true) {
			pwa.value = true;
		}
		setupForegroundMessageHandler();
		initializeNotifications();

		const clear = servicesSub.init();
		setTimeout(() => {
			servicesSub.forceRefresh();
		}, 200);
		return () => {
			clear();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<ModeWatcher />
<Toaster expand position="top-center" />

<!-- <div class="fixed top-0 left-0 z-[100000]">{innerHeight.current}</div> -->

{#if PUBLIC_MAP_ENABLED == 'true' && ((innerHeight.current ?? 0) > 550 || (innerWidth.current ?? 0) > 1050)}
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
{:else}
	<div class="relative mx-auto w-full max-w-screen-sm transform-gpu">
		{@render children()}
	</div>
{/if}
