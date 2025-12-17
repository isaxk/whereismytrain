import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { parseServiceId } from '$lib/utils';

let token = null;

export async function subscribeToTrain(
	service_id: string,
	focusCrs: string,
	filterCrs: string,
	destination: string
) {
	if (!token) {
		token = await initializeNotifications();
	}
	console.log('Token:', token);

	const { destCrsList, id } = parseServiceId(service_id);

	const body = {
		fcmToken: token,
		serviceId: id,
		focusCrs: focusCrs,
		filterCrs: filterCrs,
		destination: destination,
		destCrs: destCrsList[0]
	};
	const response = await fetch('https://pqwbjxgovvgpxmccjsdw.supabase.co/functions/v1/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`
		},
		body: JSON.stringify(body)
	});

	if (response.ok) {
		const data = await response.json();
		console.log(data);
		return data.id;
	} else {
		return null;
	}
}

export async function unsubscribeToTrain(id: string) {
	const body = {
		subscriptionId: id
	};
	await fetch('https://pqwbjxgovvgpxmccjsdw.supabase.co/functions/v1/deregister', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`
		},
		body: JSON.stringify(body)
	});
}

export async function initializeNotifications() {
	if (!browser || !messaging) {
		console.log('Browser or messaging not available');
		return null;
	}

	try {
		console.log('1. Starting notification initialization...');

		// Request permission first
		const permission = await Notification.requestPermission();
		console.log('2. Notification permission:', permission);

		if (permission !== 'granted') {
			return null;
		}

		// Register service worker and wait
		console.log('3. Registering service worker...');
		// const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
		await navigator.serviceWorker.ready;
		console.log('4. Service worker ready');

		const sws = await navigator.serviceWorker.getRegistrations();

		if (
			sws.some((sw) => {
				sw.active.scriptURL.includes('firebase-messaging-sw.js');
			})
		) {
			return null;
		}
		// Small delay to ensure service worker is fully initialized
		await new Promise((resolve) => setTimeout(resolve, 1000));

		console.log('5. About to get FCM token...');
		console.log('5a. Messaging object exists:', !!messaging);
		console.log('5b. VAPID key:', env.PUBLIC_VAPID_KEY); // Replace with actual key

		// Try getting token without any options first
		try {
			console.log('8. Failed without VAPID, trying with VAPID key...');
			token = await getToken(messaging, {
				vapidKey: env.PUBLIC_VAPID_KEY // Replace with your actual VAPID key
			});

			console.log('9. Token with VAPID:', token);
			setupForegroundMessageHandler();
			return token;
		} catch (error) {
			console.error('Error stack:', error.stack);
		}
	} catch (error) {
		console.error('Error in initializeNotifications:', error);
	}

	return null;
}

export function setupForegroundMessageHandler() {
	if (!messaging) return;

	onMessage(messaging, (payload) => {
		console.log('Message received in foreground:', payload);

		if (Notification.permission === 'granted') {
			new Notification(payload.notification.title, {
				body: payload.notification.body,
				icon: '/favicon.png'
			});
		}
	});
}
