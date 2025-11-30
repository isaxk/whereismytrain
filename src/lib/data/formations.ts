// some operators with limited fleets have known formations

import type { Carriage } from "$lib/types";

export type CondensedFormation = {
    coachNumbers: string[],
    serviceClasses: ("first"|"standard")[],
    toilets: number[],
    accessibleToilets: number[],
    bikeSpaces: number[],
}

export const knownFormations: Record<string, Record<number, CondensedFormation>> = {
    'TL': {
        12: {
            coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            serviceClasses: ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            // These will be -1 for simplicity
            toilets: [2, 4, 6, 7, 9, 11], 
            accessibleToilets: [6, 7],
            bikeSpaces: [3, 10],
        },
        8: {
            coachNumbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
            serviceClasses: ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            // These will be -1 for simplicity
            toilets: [2, 4, 5, 7], 
            accessibleToilets: [4, 5],
            bikeSpaces: [1, 8],
        }
    }
}

export function getKnownFormation(op: string, length: number) {
    const condensedFormation = knownFormations[op]?.[length] ?? null;
    if (condensedFormation) {
        const formation: Carriage[] = condensedFormation.coachNumbers.map((n, i): Carriage =>{
            return {
                coachNumber: n,
                serviceClass: condensedFormation.serviceClasses[i],
                toilet: condensedFormation.toilets.includes(i + 1),
                toiletIsAccessible: condensedFormation.accessibleToilets.includes(i + 1),
                bikeSpace: condensedFormation.bikeSpaces.includes(i + 1),
                loading: null,
            }
        })
        return formation
    }
    else {
        return null
    }
}