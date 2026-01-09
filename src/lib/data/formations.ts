// some operators with limited fleets have known formations

import type { Carriage } from '$lib/types';

export type CondensedFormation = {
	coachNumbers: string[];
	serviceClasses?: ('first' | 'standard')[];
	toilets?: number[];
	accessibleToilets?: number[];
	bikeSpaces?: number[];
	frontLength?: number;
};

export const knownFormations: Record<string, Record<number, CondensedFormation>> = {
	TL: {
		12: {
			coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
			// These will be -1 for simplicity
			toilets: [2, 4, 6, 7, 9, 11],
			accessibleToilets: [6, 7],
			bikeSpaces: [3, 10],
			frontLength: 12
		},
		8: {
			coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
			// These will be -1 for simplicity
			toilets: [2, 4, 5, 7],
			accessibleToilets: [4, 5],
			bikeSpaces: [1, 8],
			frontLength: 12
		}
	},
	'SN-2Dest': {
		12: {
			coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
			frontLength: 4
		},
		8: {
			coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
			frontLength: 4
		},
		10: {
			coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
			frontLength: 5
		}
	}
};

export function getKnownFormation(op: string, length: number, destinations?: string[] | null) {
	if (op === 'SN' && (destinations?.length ?? 0) > 1) {
		if (length === 8 || length === 12 || length === 10) {
			op = 'SN-2Dest';
		}
	}

	const condensedFormation = knownFormations[op]?.[length];
	console.log('condensedFormation:', condensedFormation);

	if (condensedFormation) {
		const formation: Carriage[] = condensedFormation.coachNumbers.map((n, i): Carriage => {
			return {
				coachNumber: n,
				serviceClass: condensedFormation.serviceClasses?.[i] ?? 'standard',
				toilet: condensedFormation.toilets?.includes(i + 1) ?? false,
				toiletIsAccessible: condensedFormation.accessibleToilets?.includes(i + 1) ?? false,
				bikeSpace: condensedFormation.bikeSpaces?.includes(i + 1) ?? false,
				loading: null,
				isFrontSection: i < (condensedFormation.frontLength ?? Number.POSITIVE_INFINITY)
			};
		});
		return formation;
	} else {
		return null;
	}
}
