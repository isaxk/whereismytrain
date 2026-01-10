<script lang="ts">
	import '../../app.css';
	import { browser } from '$app/environment';

	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';

	import Map from '$lib/components/map/map.svelte';
	import Pane from '$lib/components/pane/pane.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { initializeNotifications, setupForegroundMessageHandler } from '$lib/notifications';
	import { pwa } from '$lib/state/saved.svelte';

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
		setupServiceWorkerUpdateCheck();
	});

	function setupServiceWorkerUpdateCheck() {
		navigator.serviceWorker.getRegistration().then((reg) => {
			console.log(reg);
			// d

			if (!reg) return;

			// 1️⃣ Detect if a waiting SW already exists
			if (reg.waiting) {
				promptForUpdate(reg.waiting);
			}

			// 2️⃣ Listen for new SW installations
			reg.addEventListener('updatefound', () => {
				const newWorker = reg.installing;
				if (!newWorker) return;

				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// SW installed, new version waiting
						promptForUpdate(newWorker);
					}
				});
			});
		});

		// 3️⃣ Reload page when the new SW takes control
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			window.location.reload();
		});
	}

	function getVersion(worker: ServiceWorker): Promise<string | null> {
		return new Promise((resolve) => {
			const channel = new MessageChannel();
			channel.port1.onmessage = (e) => resolve(e.data ?? null);
			worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
		});
	}

	async function promptForUpdate(worker: ServiceWorker) {
		// Ask waiting SW for version
		const version = await getVersion(worker);
		if (!version) return;

		const lastPrompted = localStorage.getItem('lastPrompted');
		if (lastPrompted === version) return;
		localStorage.setItem('lastPrompted', version);

		toast('A update is available', {
			description: 'Refresh the page to update',
			duration: 10000,
			action: {
				label: 'Refresh',
				onClick: () => worker.postMessage({ type: 'SKIP_WAITING' })
			}
		});
	}

	// function registerSwUpdateFlow() {
	// 	if (!('serviceWorker' in navigator)) return;

	// 	let promptShown = false;

	// 	const showUpdatePrompt = (sw: ServiceWorker) => {
	// 		const lastPrompted = JSON.parse(localStorage.getItem('lastPromptedSw') ?? 'null');
	// 		console.log(lastPrompted, sw);
	// 		localStorage.setItem('lastPromptedSw', JSON.stringify(sw));
	// 		if (lastPrompted && lastPrompted === sw) return;

	// 		toast('New version of WhereIsMyTrain is available.', {
	// 			action: {
	// 				label: 'Update',
	// 				onClick: () => {
	// 					window.location.reload();
	// 				}
	// 			}
	// 		});
	// 	};

	// 	navigator.serviceWorker.getRegistration().then((registration) => {
	// 		if (!registration) return;

	// 		// 1️⃣ Handle already-waiting SW (page loaded after update)
	// 		if (registration.waiting) {
	// 			showUpdatePrompt(registration.waiting);
	// 		}

	// 		// 2️⃣ Handle future updates while page is open
	// 		registration.addEventListener('updatefound', () => {
	// 			const installing = registration.installing;
	// 			if (!installing) return;

	// 			installing.addEventListener('statechange', () => {
	// 				if (installing.state === 'installed' && navigator.serviceWorker.controller) {
	// 					showUpdatePrompt(installing);
	// 				}
	// 			});
	// 		});
	// 	});

	// 	// 3️⃣ Reload once the new SW takes control
	// 	navigator.serviceWorker.addEventListener('controllerchange', () => {});
	// }
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
