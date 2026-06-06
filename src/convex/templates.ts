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
		let text = '🚀 Departed on time';

		if (delay >= 1) text = `🚀 Departed ${delay}m late`;
		if (delay <= -1) text = `🚀 Departed ${-delay}m early`;

		if (rtArr && filterDelay !== null && filterDelay !== undefined) {
			if (filter) {
				if (filterDelay >= 1) text += `\n🟡 Exp. ${filterDelay}m late (${rtArr}) at ${filter}`;
				else if (filterDelay <= -1)
					text += `\n🟡 Exp. ${-filterDelay}m early (${rtArr}) at ${filter}`;
				else text += `\n🟢 Exp. on time (${rtArr}) at ${filter}`;
			} else {
				if (filterDelay >= 1) text += `\n🟡 Exp. arrival ${filterDelay}m late • ${rtArr}`;
				else if (filterDelay <= -1) text += `\n🟡 Exp. arrival ${-filterDelay}m early • ${rtArr}`;
				else text += `\n🟢 Exp. arrival on time • ${rtArr}`;
			}
		}

		return text;
	},
	delay: (delay: number | null, rt: string | null) => {
		if (delay === null) return `🟡 Delayed • Time unknown`;
		if (delay >= 1) return `🟡 Expected ${rt} • ${delay}m late`;
		if (delay <= -1) return `🟡 Expected ${rt} • ${-delay}m early`;
		return `🟢 Back on time`;
	},
	cancellation: (value: boolean) => {
		if (value) return `🚫 Cancelled`;
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
			if (filterDelay === null) return `🟡 Arrival at ${filter} delayed`;
			if (filterDelay >= 1) return `🟡 Arrival ${filterDelay}m late • ${rtArr} at ${filter}`;
			if (filterDelay <= -1) return `🟡 Arrival ${filterDelay}m early • ${rtArr} at ${filter}`;
			return `🟢 Arrival back on time • ${rtArr} at ${filter}`;
		} else {
			if (filterDelay === null) return `🟡 Arrival delayed • Time unknown`;
			if (filterDelay >= 1) return `🟡 Arrival ${filterDelay}m late ${rtArr}`;
			if (filterDelay <= -1) return `🟡 Arrival ${filterDelay}m early ${rtArr}`;
			return `🟢 Arrival back on time • ${rtArr}`;
		}
	}
};
