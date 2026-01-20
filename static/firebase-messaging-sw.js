// // self.addEventListener('notificationclick', function (event) {
// // 	event.notification.close();
// // 	const url = 'https://' + self.location.hostname + (event.notification.data?.path || '/');
// // 	event.waitUntil(
// // 		clients.matchAll({ type: 'window' }).then((clientList) => {
// // 			// Check if a window with the URL is already open
// // 			const matchingClient = clientList.find((client) => client.url === url && 'focus' in client);
// // 			if (matchingClient) {
// // 				return matchingClient.focus(); // Focus the existing window
// // 			} else {
// // 				return clients.openWindow(url); // Open a new window
// // 			}
// // 		})
// // 	);
// // });

// self.addEventListener('notificationclick', function (event) {
// 	event.preventDefault();
// 	event.stopPropagation();
// 	console.log('notification open');
// 	// log send to server
// });
//

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Your Firebase config
const firebaseConfig = {
	apiKey: 'AIzaSyDyFUzz7pCfBXpPvJY2O8NskGRKRjlsKK0',
	authDomain: 'quickflags-isaxk.firebaseapp.com',
	databaseURL: 'https://quickflags-isaxk-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'quickflags-isaxk',
	storageBucket: 'quickflags-isaxk.firebasestorage.app',
	messagingSenderId: '20762477816',
	appId: '1:20762477816:web:b062f1e8d2e46f6bd6670d',
	measurementId: 'G-X54HGYE974'
};

try {
	firebase.initializeApp(firebaseConfig);

	const messaging = firebase.messaging();

	// self.addEventListener('push', (event) => {
	// 	console.log(event);
	// 	if (!(self.Notification && self.Notification.permission === 'granted')) {
	// 		return;
	// 	}

	// 	const data = event.notification.data?.json() ?? {};
	// 	const title = data.title || 'Unknown Train Update';
	// 	const message =
	// 		data.message ||
	// 		'Something went wrong recieving the update. Please open the app to see train status.';
	// 	const icon = '/favicon.png';

	// 	self.registration.showNotification(title, {
	// 		body: message,
	// 		tag: 'train-update',
	// 		icon
	// 	});

	// 	notification.addEventListener('click', () => {
	// 		clients.openWindow(self.location.origin + event.data.path);

	// 		clients.matchAll().then((clientList) => {
	// 			// Check if there are any open clients
	// 			for (const client of clientList) {
	// 				// If the client is already open, send a message to it
	// 				localforage.setItem('notification-nav', event.notification.data.url);
	// 				if (client.url === event.notification.data.url && 'focus' in client) {
	// 					return client.focus().then(() => {
	// 						// Send a message to the client to navigate
	// 						window.setInterval(() => {
	// 							client.postMessage({ action: 'navigate', url: event.data.path });
	// 						}, 100);
	// 					});
	// 				}
	// 			}
	// 			// If no client is open, open a new one
	// 			return clients.openWindow(event.notification.data.url);
	// 		});
	// 	});
	// });

	messaging.onBackgroundMessage((payload) => {
		console.log('[firebase-messaging-sw.js] Received background message ', payload);
		// Customize notification here
		// const notificationTitle = payload.notification.title;
		// const notificationOptions = {
		// 	body: payload.notification.body,
		// 	icon: '/favicon.png' // Replace with your icon
		// };
		//

		// self.registration.showNotification(notificationTitle, notificationOptions);
	});
} catch (error) {
	console.error('Error initializing Firebase in service worker:', error);
}

// console.log('8. Service worker setup complete');
