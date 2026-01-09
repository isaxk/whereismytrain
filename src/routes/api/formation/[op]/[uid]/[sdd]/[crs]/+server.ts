import { type RequestHandler, json } from '@sveltejs/kit';
import type { Carriage } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const { uid, sdd, op, crs } = params;

	let formation: Carriage[] = [];

	if (op === 'GW') {
		// console.log(`https://railinfo-api.gwr.com/trainoccupancy?trainUid=${uid}&date=${sdd}`);
		const response = await fetch(
			`https://railinfo-api.gwr.com/trainoccupancy?trainUid=${uid}&date=${sdd}`
		);
		if (response.ok) {
			const gwFormation = await response.json();
			const portion = gwFormation.Portions.find((p) => p.StationsCrsCodes.includes(crs));
			let carriages: any[] = [];
			if (portion) {
				portion.Assemblies.forEach((assembly) => {
					carriages = [...carriages, ...assembly.Vehicles];
				});
				let frontLength = carriages.length;
				if (gwFormation.Portions.length > 1) {
					frontLength = gwFormation.Portions[1].Assemblies.map((a) => a.Vehicles).flat().length;
				}
				formation = carriages
					.map((c, i): Carriage => {
						return {
							serviceClass: c.IsFirstClass ? 'first' : 'standard',
							coachNumber: c.CoachLetter,
							toilet: c.Facilities.Toilet,
							toiletIsAccessible: c.Facilities.WheelchairSpace || c.Facilities.AccessibleToilet,
							bikeSpace: c.Facilities.BikeSpaces,
							quietSpace: c.Facilities.QuietCoach,
							isFrontSection: i < frontLength,
							// toiletStatus: 'Unknown',
							loading:
								c.SeatAvailability === 'Low'
									? 70
									: c.SeatAvailability === 'Medium'
										? 50
										: c.SeatAvailability === 'High'
											? 20
											: null
						};
					})
					.toReversed();
			}
		}
	}
	return json(formation);
};
