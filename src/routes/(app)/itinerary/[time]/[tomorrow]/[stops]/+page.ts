import AllStationsJSON from '$lib/data/stations.json';

export const load = async ({ params }) => {
	const { time, tomorrow, stops } = params;
	const stopsArray = stops.toUpperCase().split(',');

	async function map() {
		return {
			type: 'itinerary',
			stops: stopsArray.map((crs) => ({
				long: AllStationsJSON.find((s) => s.crsCode === crs)?.long,
				lat: AllStationsJSON.find((s) => s.crsCode === crs)?.lat,
				crs
			}))
		};
	}

	return {
		stopsArray,
		time,
		tomorrow: tomorrow == 'true',
		map: map()
	};
};
