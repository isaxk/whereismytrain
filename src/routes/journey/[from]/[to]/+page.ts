export const load = async ({ params, fetch, url }) => {
	const { from, to } = params;

	const tube = url.searchParams.get('tube') === 'true';

	async function getJourney(): Promise<any> {
		const response = await fetch(`/api/journey-plan/${from}/${to}/${tube}`);
		const data = await response.json();
		return data;
	}

	return { from, to, journey: getJourney() };
};
