<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import dayjs from 'dayjs';

	import { getFCMToken } from '$lib/notifications';
	import { parseSavedInfo } from '$lib/shared/service';
	import { saved, setSavedTrainData } from '$lib/state/saved.svelte';
	import type { TrainService } from '$lib/types';

	import { api } from '../../../convex/_generated/api';
	import { API_COMPATIBLE_VERSION } from '../../../routes/api/_shared';

	import type { Id } from '../../../convex/_generated/dataModel';
	import type { Snippet } from 'svelte';

	let {
		serviceId,
		crs,
		filter,
		children,
		serviceData = null
	}: {
		serviceId: string;
		crs: string;
		filter: string | null;
		children: Snippet<
			[
				{
					subscribed: boolean;
					loading: boolean;
					notificationsFailed: boolean;
					onSubscribe: (filter: string | null) => Promise<void>;
					onSwitchFrom: (id: string) => Promise<void>;
					onUnsubscribe: () => Promise<void>;
				}
			]
		>;
		serviceData?: TrainService | null;
	} = $props();

	const convex = useConvexClient();

	let loading = $state(false);
	const savedItem = $derived(saved.value.find((item) => item.service_id === serviceId));
	const notificationsFailed = $derived(
		savedItem !== undefined && savedItem.subscriptionId === null
	);

	async function fetchServiceData(id: string, from: string, to: string) {
		const response = await fetch(`/api/service/${id}/${from}/${to}`, {
			headers: {
				'api-version': API_COMPATIBLE_VERSION
			}
		});
		const data = await response.json();
		if (response.ok) {
			return data;
		}
		return null;
	}

	async function handleSubscribe(filterOverride: string | null) {
		const filterCrs = filterOverride || filter;
		if (!filterCrs) return;
		const fcmToken = await getFCMToken();
		let subscriptionId: string | null = null;
		if (fcmToken) {
			const result = await convex.action(api.notifications.registerSubscription, {
				fcmToken,
				serviceId,
				focusCrs: crs,
				filterCrs
			});
			subscriptionId = result;
		}

		if (!serviceData) {
			serviceData = await fetchServiceData(serviceId, crs, filterCrs);
		}

		if (!serviceData) return;

		const parsedServiceInfo = parseSavedInfo(serviceData);

		if (!parsedServiceInfo) return;

		const newItem = {
			id: crypto.randomUUID(),
			service_id: serviceId,
			service: parsedServiceInfo,
			focusCrs: crs,
			filterCrs,
			date: serviceData.date,
			originalArrival: parsedServiceInfo?.planArr,
			subscriptionId
		};

		setSavedTrainData(serviceId, parsedServiceInfo);

		saved.value = [...saved.value, { ...newItem, subscriptionId }].toSorted((a, b) => {
			const diff = dayjs(a.date).diff(dayjs(b.date));
			return diff === 0 ? 0 : diff > 0 ? 1 : -1;
		});
	}

	function handleUnsubscribe() {
		if (!savedItem) return;

		if (savedItem.subscriptionId) {
			convex.mutation(api.notifications.deregisterSubscription, {
				subscriptionId: savedItem.subscriptionId as Id<'subscriptions'>
			});
		}

		saved.value = saved.value.filter((item) => item.id !== savedItem.id);
	}

	async function handleSwitch(fromId: string) {
		const existing = saved.value.findIndex((item) => item.id === fromId);

		if (!filter) {
			console.error('Filter is not set');
			return;
		}

		if (saved.value[existing]?.subscriptionId) {
			convex
				.mutation(api.notifications.deregisterSubscription, {
					subscriptionId: saved.value[existing].subscriptionId as Id<'subscriptions'>
				})
				.catch((error) => {
					console.error('Failed to deregister subscription:', error);
				});
		}

		if (!serviceData) {
			serviceData = await fetchServiceData(serviceId, crs, filter);
		}

		if (!serviceData) {
			console.error('Service data failed to fetch');
			return;
		}

		const parsedServiceInfo = parseSavedInfo(serviceData);

		if (!parsedServiceInfo) {
			console.error('Could not parse service info');
			return;
		}

		const fcmToken = await getFCMToken();

		let subscriptionId: string | null = null;

		if (fcmToken) {
			const result = await convex.action(api.notifications.registerSubscription, {
				serviceId,
				focusCrs: crs,
				filterCrs: filter,
				fcmToken
			});
			subscriptionId = result;
		}

		if (existing !== -1) {
			setTimeout(() => {
				if (subscriptionId && serviceData) {
					saved.value[existing] = {
						...saved.value[existing],
						service_id: serviceId,
						service: parsedServiceInfo,
						date: serviceData.date,
						subscriptionId
					};
				} else {
					console.error('Failed to register subscription');
				}
			}, 300);
		} else {
			console.error('Could not find existing saved item');
		}
	}
</script>

{@render children({
	subscribed: savedItem !== undefined,
	loading,
	notificationsFailed,
	onSubscribe: async (filterOverride) => {
		loading = true;
		await handleSubscribe(filterOverride);
		loading = false;
	},
	onUnsubscribe: handleUnsubscribe,
	onSwitchFrom: async (fromId: string) => {
		loading = true;
		await handleSwitch(fromId);
		loading = false;
	}
})}
