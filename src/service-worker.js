/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	console.log('installing service worker for version', version);
	console.log('caching assets', ASSETS);
	console.log('caching build', build);

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				console.log(`Returning from Cache`, event.request.url);
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});

// Listen for messages from the client
// self.addEventListener('message', (event: ExtendableMessageEvent) => {
//     if (event.data === 'skipWaiting') {
//         self.skipWaiting();
//     }
// });

// // Define interfaces for notification data
// interface NotificationData {
//     title?: string;
//     body?: string;
//     tag?: string;
//     renotify?: boolean;
//     data?: {
//         url?: string;
//         serviceId?: string;
//         [key: string]: any;
//     };
// }

// // Handle push notifications
// self.addEventListener('push', (event: PushEvent) => {
//     if (!event.data) return;

//     try {
//         const data: NotificationData = event.data.json();

//         const title = data.title || 'Train Update';
//         const options: NotificationOptions = {
//             body: data.body || 'There has been an update to your train service.',
//             icon: '/favicon.png',
//             badge: '/notification-badge.png',
//             data: data.data || {},
//             tag: data.tag || 'train-notification',
//             actions: [
//                 {
//                     action: ACTIONS.VIEW_DETAILS,
//                     title: 'View Details'
//                 },
//                 {
//                     action: ACTIONS.DISMISS,
//                     title: 'Dismiss'
//                 }
//             ],
//             vibrate: [100, 50, 100],
//             renotify: data.renotify === true
//         };

//         event.waitUntil(self.registration.showNotification(title, options));
//     } catch (error) {
//         console.error('Error showing notification:', error);
//     }
// });

// // Handle notification clicks
// self.addEventListener('notificationclick', (event: NotificationEvent) => {
//     event.notification.close();

//     const action = event.action;
//     const notification = event.notification;
//     const data = notification.data || {};
//     let url = '/';

//     if (data.url) {
//         url = data.url;
//     } else if (data.serviceId) {
//         url = `/service/${data.serviceId}`;
//     }

//     if (action === ACTIONS.VIEW_DETAILS) {
//         // User clicked the "View Details" action
//         event.waitUntil(clients.openWindow(url));
//     } else if (!action) {
//         // User clicked the notification itself (not a specific action)
//         event.waitUntil(
//             clients.matchAll({ type: 'window', includeUncontrolled: true })
//                 .then((clientList) => {
//                     // If a window client is already open, focus it
//                     for (const client of clientList) {
//                         if (client.url.includes(self.location.origin) && 'focus' in client) {
//                             client.navigate(url);
//                             return client.focus();
//                         }
//                     }

//                     // Otherwise open a new window
//                     return clients.openWindow(url);
//                 })
//         );
//     }
//     // For ACTIONS.DISMISS, we just close the notification (already done above)
// });
