import type { TrainService } from '$lib/types';

async function refresh() {
	for (const service of services) {
		const response = await fetch(service.url);
		if (response.ok) {
			const data = await response.json();
			if (data) {
				service.subscriptions.forEach((subscription) => subscription.callback(data));
			}
		}
	}
}

let services: {
	url: string;
	subscriptions: {
		id: string;
		callback: (data: TrainService) => void;
	}[];
}[] = [];

export const servicesSub = {
	init: () => {
		const interval = setInterval(refresh, 10000);
		return () => clearInterval(interval);
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
