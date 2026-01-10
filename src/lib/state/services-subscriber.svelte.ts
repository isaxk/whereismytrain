import type { TrainService } from '$lib/types';

import { API_COMPATIBLE_VERSION } from '../../routes/api/_shared';

async function refresh() {
	refreshing.current = true;
	console.log(services);
	for (const service of services) {
		const response = await fetch(service.url, {
			headers: {
				'api-version': API_COMPATIBLE_VERSION
			}
		});
		if (response.ok) {
			const data = await response.json();
			console.log(data);
			if (data) {
				service.subscriptions.forEach((subscription) => subscription.callback(data));
			}
		} else {
			const data = await response.json();
			console.error(`Failed to fetch service ${service.url} ${data.error}`);
		}
	}
	setTimeout(
		() => {
			refreshing.current = false;
		},
		services.length > 0 ? 500 : 0
	);
}

export const refreshing = $state({
	current: false,
	map: false
});

let services: {
	url: string;
	subscriptions: {
		id: string;
		callback: (data: TrainService) => void;
	}[];
}[] = [];

export const servicesSub = {
	init: () => {
		const interval = setInterval(refresh, 15000);
		return () => clearInterval(interval);
	},
	forceRefresh: () => {
		refresh();
	},
	subscribe: (
		id: string,
		focus: string,
		filter: string | null,
		callback: (data: TrainService) => void
	) => {
		const url = `/api/service/${id}/${focus}/${filter}`;
		console.log(url);
		const service = services.find((s) => s.url === url);
		if (!service) {
			services.push({
				url,
				subscriptions: [{ id, callback }]
			});
		} else {
			service.subscriptions.push({ id, callback });
		}
		return () => {
			const service = services.find((s) => s.url === url);
			if (service) {
				service.subscriptions = service.subscriptions.filter((s) => s.id !== id);
				if (service.subscriptions.length === 0) {
					services = services.filter((s) => s.url !== url);
				}
			}
		};
	}
};
