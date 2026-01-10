import { browser } from '$app/environment';

import { initializeApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

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

export const firebaseApp = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;
if (browser && 'serviceWorker' in navigator) {
	messaging = getMessaging(firebaseApp);
}

export { messaging };
