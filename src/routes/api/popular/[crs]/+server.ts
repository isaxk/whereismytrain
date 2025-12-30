import { REFERENCE_DATA_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { type RequestHandler, json } from '@sveltejs/kit';
import AllStationsJSON from '$lib/data/stations.json';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ params }) => {
	const { crs } = params;

	const { data, error } = await supabase
		.from('station_journey_suggestions')
		.select('destination_crs, journeys')
		.eq('origin_crs', crs)
		.order('journeys', { ascending: false })
		.limit(20);

	if (error) {
		throw error;
	}

	const parsed = data.map((item) => ({
		name:
			AllStationsJSON.find((station) => station.crsCode === item.destination_crs)?.stationName ||
			'Unknown',
		crs: item.destination_crs
	}));

	return json(parsed);
};
