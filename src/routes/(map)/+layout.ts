import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = ({ url }) => {
	const source = url.searchParams.get('source');

	const stations = fetch('/api/stations')
		.then((res) => res.json())
		.catch((err) => {
			console.error(err);
			return [];
		});
	return {
		pwa: source === 'pwa' ? true : false,
		stations
	};
};
