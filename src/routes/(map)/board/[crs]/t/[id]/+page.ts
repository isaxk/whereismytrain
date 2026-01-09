import type { ServiceLocation, ServiceMapData, TrainService } from '$lib/types/index.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch, url }) => {
	const { id, crs } = params;

	const to = url.searchParams.get('to') ?? undefined;
	const backTo = url.searchParams.get('backTo') ?? null;

	const service = fetch(`/api/service/${id}/${crs}${to ? `/${to}` : ''}`)
		.then(async (response) => {
			const data = await response.json();

			if (!response.ok) {
				// ❌ DO NOT throw SvelteKit errors here
				return { error: data.message ?? 'Failed to load service' };
			}

			return data;
		})
		.catch(() => ({
			error: 'Network error'
		}));

	async function mapData(): Promise<ServiceMapData> {
		const { locations, formedFrom } = await service;

		console.log('service data loaded');

		const mapDataResponse = await fetch(`/api/mapdata`, {
			body: JSON.stringify({ locations: locations, formedFrom: formedFrom }),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const mapData = await mapDataResponse.json();

		if (!mapDataResponse.ok) {
			throw error(500, mapData.message);
		}

		console.log(mapData);

		return mapData;
	}

	return { id, service, backTo, map: mapData() };
};
