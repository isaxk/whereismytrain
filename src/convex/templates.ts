export const templates = {
	reminder: () => {
		return '🔔 10m until departure';
	},
	departure: (
		delay: number,
		filterDelay?: number | null,
		rtArr?: string | null,
		filter?: string
	) => {
		let text = '🚀 Departed';

		if (rtArr && filterDelay !== null && filterDelay !== undefined) {
			if (filter) {
				if (filterDelay >= 1) text += ` • ETA: ${rtArr} (${filterDelay}m late)`;
				else if (filterDelay <= -1)
					text += ` • ETA: ${rtArr} (${-filterDelay}m early) at ${filter}`;
				else text += ` • ETA: ${rtArr} (on time) at ${filter}`;
			} else {
				if (filterDelay >= 1) text += ` • ETA: ${rtArr} (${filterDelay}m late)`;
				else if (filterDelay <= -1) text += ` • ETA: ${rtArr} (${-filterDelay}m early)`;
				else text += ` • ETA: ${rtArr} (on time)`;
			}
		} else {
			if (delay >= 1) text = `🚀 Departed ${delay}m late`;
			if (delay <= -1) text = `🚀 Departed ${-delay}m early`;
			if (delay === 0) text = `🚀 Departed on time`;
		}

		return text;
	},
	delay: (delay: number | null, rt: string | null) => {
		if (delay === null) return `🟡 Delayed • Time unknown`;
		if (delay >= 1) return `🟡 Expected ${rt} • ${delay}m late`;
		if (delay <= -1) return `🟡 Expected ${rt} • ${-delay}m early`;
		return `🟢 Back on time`;
	},
	cancellation: (value: boolean, delay?: number | null, rtDep?: string | null) => {
		if (value) return `🚫 Cancelled`;
		if (delay !== undefined) {
			if (delay === null) {
				return `🟡 No longer cancelled • Delayed`;
			}
			if (delay >= 1) {
				return `🟡 No longer cancelled • Exp. ${rtDep} (${delay}m late)`;
			} else if (delay <= 1) {
				return `🟡 No longer cancelled • Exp. ${rtDep} (${-delay}m early)`;
			} else {
				return `🟢 No longer cancelled • Back on time`;
			}
		}
		return `🟢 No longer cancelled`;
	},
	filterCancellation: (value: boolean, filter: string | undefined) => {
		let title = `🚫 Cancelled to ${filter}`;
		if (!value) title = `🟢 No longer cancelled to ${filter}`;
		return title;
	},
	destinationChange: (destination: string | undefined) => {
		return `🔄 Destination changed to: ${destination}`;
	},
	platform: (platform: string | null, prediction: boolean, confirmation: boolean) => {
		if (confirmation) return `📢 Platform announced as: ${platform}`;
		if (prediction && platform) return `🔮 Platform prediction changed to: ${platform}`;
		if (prediction) return `🔮 Platform prediction unknown`;
		return `🔄 Platform changed to: ${platform}`;
	},
	arrivalReminder: (time: number, filter: string | undefined) => {
		if (filter) {
			return `🔔 Next stop ${filter}, in ${time}m`;
		} else {
			return `🔔 Arriving in ${time}m`;
		}
	},
	filterDelay: (filterDelay: number | null, rtArr?: string | null, filter?: string) => {
		if (filter) {
			if (filterDelay === null) return `🟡 ETA at ${filter} delayed`;
			if (filterDelay >= 1) return `🟡 ETA ${filterDelay}m late • ${rtArr} at ${filter}`;
			if (filterDelay <= -1) return `🟡 ETA ${filterDelay}m early • ${rtArr} at ${filter}`;
			return `🟢 ETA back on time • ${rtArr} at ${filter}`;
		} else {
			if (filterDelay === null) return `🟡 ETA delayed • Time unknown`;
			if (filterDelay >= 1) return `🟡 ETA ${filterDelay}m late ${rtArr}`;
			if (filterDelay <= -1) return `🟡 ETA ${filterDelay}m early ${rtArr}`;
			return `🟢 ETA back on time • ${rtArr}`;
		}
	}
};
