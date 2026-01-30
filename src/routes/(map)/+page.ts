import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = ({ url }) => {
	const open = url.searchParams.get('open');
	const withFrom = url.searchParams.get('withFrom');
	const withTo = url.searchParams.get('withTo');
	const withTime = url.searchParams.get('withTime');
	const withTomorrow = url.searchParams.get('withTomorrow');
	return {
		open,
		withFrom,
		withTo,
		withTime,
		withTomorrow: withTomorrow == 'true'
	};
};
