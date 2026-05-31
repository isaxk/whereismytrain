export const templates = {
	departure: (
		delay: number,
		filterDelay?: number | null,
		rtArr?: string | null,
		filter?: string
	) => {
		let title = '🚀 Departed on time';
		let descriptionAppend = '';
		if (delay >= 1) title = `🚀 Departed ${delay}m late`;
		if (delay <= -1) title = `🚀 Departed ${-delay}m early`;
		console.log(filterDelay, rtArr, filter);
		if (rtArr && filterDelay !== null && filterDelay !== undefined) {
			// if (filter) {
			// 	if (filterDelay >= 1)
			// 		descriptionAppend = `\n🟡 Expected ${rtArr} at ${filter} • ${filterDelay}m late`;
			// 	if (filterDelay <= -1)
			// 		descriptionAppend = `\n🟡 Expected ${rtArr} at ${filter} • ${-filterDelay}m early`;
			// 	else descriptionAppend = `\n🟢 Expected ${rtArr} at ${filter} • On time`;
			// } else {
			if (filterDelay >= 1)
				descriptionAppend = `\n🟡 Expected arrival ${rtArr} • ${filterDelay}m late`;
			if (filterDelay <= -1)
				descriptionAppend = `\n🟡 Expected arrival ${rtArr} • ${-filterDelay}m early`;
			else descriptionAppend = `\n🟢 Expected arrival ${rtArr} • On time`;
			// }
		}
		return { title, descriptionAppend };
	},
	delay: (delay: number | null, rt: string | null) => {
		if (delay === null) return `🟡 Delayed • Expected time unknown`;
		if (delay >= 1) return `🟡 Expected ${rt} • ${delay}m late`;
		if (delay <= -1) return `🟡 Expected ${rt} • ${-delay}m early`;
		return `🟢 Back on time`;
	},
	cancellation: (value: boolean) => {
		if (value) return `🚫 Cancelled`;
		return `🟢 No longer cancelled`;
	},
	platform: (platform: string | null, prediction: boolean, confirmation: boolean) => {
		if (confirmation) return `📢 Platform announced as ${platform}`;
		if (prediction && platform) return `🔮 Platform prediction changed to ${platform}`;
		if (prediction) return `🔮 Platform prediction unknown`;
		return `🔄 Platform changed to ${platform}`;
	}
};
