/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { setupServiceWorker } from 'sveltekit-cache-first';

import { build, files, version } from '$service-worker';

setupServiceWorker(self, {
	version,
	build,
	files,
	options: {
		ignoredPaths: [
			'/api/board',
			'/api/service',
			'/api/formation',
			'/api/popular',
			'/api/reasoncode',
			'/api/mapdata'
		]
	}
});
