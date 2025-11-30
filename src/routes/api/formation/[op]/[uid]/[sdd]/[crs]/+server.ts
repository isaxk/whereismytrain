import { type RequestHandler, json } from "@sveltejs/kit";
import type { Carriage } from "$lib/types";


export const GET: RequestHandler = async ({ params }) => {
    const { uid, sdd, op, crs } = params;

    let formation: Carriage[] = [];

    if (op === 'GW') {
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
					formation = carriages.toReversed().map((c) => {
						return {
							serviceClass: c.IsFirstClass ? 'first' : 'standard',
							coachNumber: c.CoachLetter,
							toilet: c.Facilities.Toilet,
							toiletIsAccessible: c.Facilities.WheelchairSpace,
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
					});
				}
			}
		}
		return json(formation)
    };
