

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

	messaging.onBackgroundMessage(async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

   	const notificationOptions = {
        body: payload.data.body,

        icon: '/favicon.png',
        data: {
          tag: payload.data.tag,
          url: payload.data.path,
		}
      };

    const allNotifications = await self.registration.getNotifications();
    console.log('allNotifications', allNotifications);

    allNotifications.forEach(notification => {
		// Close if it's with the same tag
		if (notification.data?.tag === payload.data.tag) {
			notification.close();
		}
	});

	return self.registration.showNotification(payload.data.title, notificationOptions);

	});
} catch (error) {
	console.error('Error initializing Firebase in service worker:', error);
}

self.addEventListener('notificationclick', (event) => {
	console.log('Notification clicked:', event);

	// event.notification.close(); // Close the notification

	// Get the URL from the notification data
  const urlToOpen = event.notification.data?.url || '/';

	console.log('urlToOpen', urlToOpen);

	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				// Check if app is already open
				for (const client of clientList) {
					if (client.url.includes(self.location.origin) && 'focus' in client) {
						// App is open - navigate to the train page and focus
						client.postMessage({
													type: 'NOTIFICATION_CLICK',
													url: urlToOpen
												});
            setTimeout(() => {
              client.postMessage({
													type: 'NOTIFICATION_CLICK',
													url: urlToOpen
												});
            }, 500)
            setTimeout(() => {
              client.postMessage({
													type: 'NOTIFICATION_CLICK',
													url: urlToOpen
												});
						}, 2000)
            return client.focus();
					}
				}
				// App is not open - open new window/tab
				if (clients.openWindow) {
					return clients.openWindow(urlToOpen);
				}
			})
	);
});
