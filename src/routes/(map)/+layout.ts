import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = ({ url }) => {
	const source = url.searchParams.get('source');
	return {
		pwa: source === 'pwa' ? true : false
	};
};
