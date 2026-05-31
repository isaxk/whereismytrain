

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

const DB_NAME = 'whereismytrain';
const DB_VERSION = 1;

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('trains')) {
				db.createObjectStore('trains');
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}


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


    /* type SavedTrainServiceInfo = {
	crs: string;
	filter: string;
	planDep: string;
	rtDep: string | null;
	delay: number | null;
	departed: boolean;
	planArr: string;
	rtArr: string | null;
	arrived: boolean;
	filterDelay: number | null;
	from: string;
	to: string;
	destination: string;
	platform: string | null;
	isCancelled: boolean;
	isCancelledAtFilter: boolean;
	operator: Operator;
	refreshedAt: number;
    }; */

    const service = JSON.parse(payload.data.service);
    const newData = {
      rtDep: service.rtDep ?? null,
      delay: service.delay ?? null,
      departed: service.departed,
      rtArr: service.rtArr ?? null,
      arrived: service.arrived,
      filterDelay: service.filterDelay ?? null,
      platform: service.platform ?? null,
      isCancelled: service.isCancelled,
      isCancelledAtFilter: service.isCancelledAtFilter,
      refreshedAt: Date.now()
    }


    const db = await openDB();
    const transaction = db.transaction('trains', 'readwrite');
    const store = transaction.objectStore('trains');

    const request = await store.get(service.serviceId);

    request.onsuccess = (e) => {
      const data = {...e.target.result, ...newData};

      store.put(data, service.serviceId);
    }





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
