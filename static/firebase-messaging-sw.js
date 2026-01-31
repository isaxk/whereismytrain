

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
