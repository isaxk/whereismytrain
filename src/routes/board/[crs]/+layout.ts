import type { Board } from '$lib/types/index.js';
import { error as kitError } from '@sveltejs/kit';

export const load = async ({ params, fetch, url }) => {
	const { crs } = params;

	const search = url.searchParams;
	const to = search.get('to') ?? null;
	const offset = search.get('offset') ?? '0';

	async function getBoard(): Promise<Board> {
		try {
			const response = await fetch(`/api/board/${crs}/${to ?? 'null'}/${offset}`);
			const data = await response.json();
			return data;
		}
		catch (e) {
			console.error('Catched', e);
			return kitError(500, "An unknown error occured");
		}


	}

	return { crs: crs.toUpperCase(), to: to?.toUpperCase(), board: getBoard(), offset: parseInt(offset) };
};
