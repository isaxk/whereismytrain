export const ssr = true;

export const load = async ({ params, fetch, url }) => {
	const { id, focus, filter } = params;

	const response = await fetch(`/api/service/${id}/${focus}${filter ? `/${filter}` : ''}`);
	const data = await response.json();

	return { id, service: data, focus, filter };
};
