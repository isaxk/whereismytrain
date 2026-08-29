/* eslint-disable @typescript-eslint/no-explicit-any */

import { type RequestHandler, json } from '@sveltejs/kit';

import type { Carriage, Formation } from '$lib/types';

function parseCarriage(c: any): Carriage {
	return {
		serviceClass: c.IsFirstClass ? 'first' : 'standard',
		coachNumber: c.CoachLetter,
		toilet: c.Facilities.Toilet,
		toiletIsAccessible: c.Facilities.WheelchairSpace || c.Facilities.AccessibleToilet,
		bikeSpace: c.Facilities.BikeSpaces,
		quietSpace: c.Facilities.QuietCoach,
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
}

export const GET: RequestHandler = async ({ params }) => {
	const { uid, sdd, op, crs } = params;

	let formation: Formation[] = [];

	if (op === 'GW') {
		// console.log(`https://railinfo-api.gwr.com/trainoccupancy?trainUid=${uid}&date=${sdd}`);
		const response = await fetch(
			`https://railinfo-api.gwr.com/trainoccupancy?trainUid=${uid}&date=${sdd}`
		);
		if (response.ok) {
			const gwFormation = await response.json();
			console.log(JSON.stringify(gwFormation, null, 2));

      if (gwFormation.Portions.length === 2 && gwFormation.Portions[1].StartCrs === gwFormation.Portions[0].EndCrs) {
        const carriagesA = gwFormation.Portions[0].Assemblies.map((a: any) => a.Vehicles).flat()
        const carriagesB = gwFormation.Portions[1].Assemblies.map((a: any) => a.Vehicles).flat();
				formation = [
					{
						carriages: carriagesB.map((c: any) => parseCarriage(c)).toReversed() ,
						destination: [gwFormation.Portions[0].EndCrs]
					},
					{
						carriages: carriagesA.slice(0, -carriagesB.length).map((c: any) => parseCarriage(c)).toReversed(),
						destination: [gwFormation.Portions[0].EndCrs, gwFormation.Portions[1].EndCrs]
					}
				];
			}
			else {
				formation = [
					{
						carriages: gwFormation.Portions[0].Assemblies.map((a: any) => a.Vehicles).flat().map((c: any) => parseCarriage(c)).toReversed(),
						destination: [gwFormation.Portions[0].EndCrs]
					}
				];
			}
		}
	}
	return json(formation);
};
