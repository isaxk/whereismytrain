import type { Board } from '$lib/types/index.js';
import { error as kitError, type HttpError } from '@sveltejs/kit';

export const load = async ({ params, fetch, url }) => {
	const { crs } = params;

	const search = url.searchParams;
	const to = search.get('to') ?? null;
	const offset = search.get('offset') ?? '0';

	async function getBoard(): Promise<Board> {
		try {
			const response = await fetch(`/api/board/${crs}/${to ?? 'null'}/${offset}`);
			if (response.ok) {
				const data = await response.json();
				return data;
			} else {
				// console.log(await response.json())
				throw new Error((await response.json())?.message);
			}
		} catch (e: any) {
			console.log(e);
			kitError(500, e ?? 'An unknown error occured');
		}
	}

	return {
		crs: crs.toUpperCase(),
		to: to?.toUpperCase(),
		board: getBoard(),
		offset: parseInt(offset)
	};
};
