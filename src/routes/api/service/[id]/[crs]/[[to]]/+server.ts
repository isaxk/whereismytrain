import { error as kitError, json } from '@sveltejs/kit';

import { fetchService } from '$lib/shared/service.js';

import { API_COMPATIBLE_VERSION } from '../../../../_shared';
import { ACCESS_TOKEN } from '$env/static/private';

export const GET = async ({ params, request }) => {
	const { id, crs, to } = params;

	if (request.headers.get('api-version') !== API_COMPATIBLE_VERSION) {
		return kitError(400, 'Your app version is not compatible. Please refresh your app.');
	}

	try {
		const data = await fetchService(id, crs, to ?? null, ACCESS_TOKEN);
		return json(data);
	} catch (error: unknown) {
		console.error('error.message', (error as Error).message);
		return kitError(500, (error as Error).message);
	}
};
