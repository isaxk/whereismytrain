import type { TrainService } from '$lib/types';

async function refresh() {
	refreshing.current = true;
	for (const service of services) {
		const response = await fetch(service.url);
		if (response.ok) {
			const data = await response.json();
			if (data) {
				service.subscriptions.forEach((subscription) => subscription.callback(data));
			}
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
	current: false
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
