import { ConvexClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import dotenv from 'dotenv';
import { Kafka } from 'kafkajs';

dotenv.config();

if (
	!process.env.CONVEX_URL ||
	!process.env.DARWIN_BROKER_URL ||
	!process.env.DARWIN_USERNAME ||
	!process.env.DARWIN_PASSWORD
) {
	throw new Error('Darwin-Kafka environment variables not set');
}

const client = new ConvexClient(process.env.CONVEX_URL);

// 1. Configure the connection
const kafka = new Kafka({
	clientId: 'darwin-consumer-node',
	brokers: [process.env.DARWIN_BROKER_URL], // Get this from your RDM dashboard
	ssl: true,
	sasl: {
		mechanism: 'plain',
		username: process.env.DARWIN_USERNAME, // Your RDM Consumer Key
		password: process.env.DARWIN_PASSWORD // Your RDM Consumer Secret
	}
});

const subscribedTrains = new Map();

// client.query("notifications:getAllSubscriptions", {}).then((subs) => {
//   subscribedTrains.clear();
//   subs.forEach((sub) => {
//     if (subscribedTrains.has(sub.serviceId)) {
//       subscribedTrains.get(sub.serviceId).push(sub);
//     } else {
//       console.log(`Subscribing to ${sub.serviceId}`);
//       subscribedTrains.set(sub.serviceId, [sub]);
//     }
//   });
// });

let activeRidRegex: RegExp | null = null;

// Call this whenever your Convex subscription list changes
function updateRegex(subscriptions: string[]) {
	console.log(subscriptions);
	if (subscriptions.length === 0) {
		activeRidRegex = null;
		return;
	}
	// Creates a regex like /RID1|RID2|RID3/
	activeRidRegex = new RegExp(subscriptions.join('|'));
}

client.onUpdate(anyApi.notifications.getAllSubscriptions, {}, (subs) => {
	subscribedTrains.clear();
	subs.forEach((sub) => {
		if (subscribedTrains.has(sub.serviceId)) {
			subscribedTrains.get(sub.serviceId).push(sub);
		} else {
			console.log(`Subscribing to ${sub.serviceId}`);
			subscribedTrains.set(sub.serviceId, [sub]);
		}
	});
	updateRegex(subs.map((s) => s.serviceId));
});

const consumer = kafka.consumer({
	groupId: 'SC-bca060ce-eae3-4b63-a29c-6fb76c2ece11'
});

const run = async () => {
	// Connect to the broker
	await consumer.connect();
	console.log('Connected to Darwin Rail Data Marketplace');

	// Subscribe to the topic (json, xml, avro, or base)
	await consumer.subscribe({
		topic: 'prod-1010-Darwin-Train-Information-Push-Port-IIII2_0-JSON',
		fromBeginning: false
	});

	await consumer.run({
		eachMessage: async ({ message }) => {
			const payload = message.value?.toString();

			if (payload && activeRidRegex && activeRidRegex.test(payload)) {
				const outer = JSON.parse(payload);

				if (outer.bytes) {
					const inner = JSON.parse(outer.bytes);

					// console.log(bytesParsed);
					if (inner.uR?.TS || inner.uR?.schedule) {
						const timeData = inner.uR?.TS;
						const scheduleData = inner.uR?.schedule;
						if (
							(timeData?.rid && subscribedTrains.has(timeData.rid)) ||
							(scheduleData?.rid && subscribedTrains.has(scheduleData.rid))
						) {
							const subs = subscribedTrains.get(timeData?.rid ?? scheduleData?.rid);
							subs.forEach((sub) => {
								let rtDep = undefined;
								let rtArr = undefined;
								let departed = undefined;
								let arrived = undefined;
								let isCancelled = undefined;
								let isCancelledAtFilter = undefined;
								let platform = undefined;
								let isPlatformConfirmed = undefined;
								if (timeData) {
									console.log(timeData);
									const focus = Array.isArray(timeData.Location)
										? timeData.Location?.find((loc) => loc.tpl === sub.focusTiploc)
										: timeData.Location?.tpl === sub.focusTiploc
											? timeData.Location
											: undefined;
									const filter = Array.isArray(timeData.Location)
										? timeData.Location?.find((loc) => loc.tpl === sub.filterTiploc)
										: timeData.Location?.tpl === sub.filterTiploc
											? timeData.Location
											: undefined;
									if (focus) {
										rtDep = focus?.dep.delayed
											? null
											: (focus?.dep.at ?? focus?.dep.et ?? undefined);
										departed = focus?.dep?.at !== undefined;
										if (focus?.plat) {
											if (focus?.plat['']) {
												platform = focus?.plat[''];
											} else {
												platform = typeof focus?.plat === 'string' ? focus?.plat : undefined;
											}
											if (focus?.platsup == 'true') {
												isPlatformConfirmed = false;
											} else if (platform) {
												isPlatformConfirmed = true;
											}
										}
									}
									if (filter) {
										rtArr = filter?.arr?.delayed
											? null
											: (filter?.arr?.at ?? filter?.arr?.et ?? undefined);
										arrived = filter?.arr?.at !== undefined;
									}
								}
								if (scheduleData) {
									console.log(scheduleData);
									let locations = Array.isArray(scheduleData.OR)
										? scheduleData.OR
										: [scheduleData.OR];
									locations = Array.isArray(scheduleData.PP)
										? locations.concat(scheduleData.PP)
										: [scheduleData.PP];
									locations = Array.isArray(scheduleData.DT)
										? locations.concat(scheduleData.DT)
										: [scheduleData.DT];
									const focus = locations.find((loc) => loc.tpl === sub.focusTiploc);
									const filter = locations.find((loc) => loc.tpl === sub.filterTiploc);
									if (focus?.can) {
										isCancelled = focus?.can;
									}
									if (filter?.can) {
										isCancelledAtFilter = filter?.can;
									}
								}
								if (
									rtDep !== undefined ||
									rtArr !== undefined ||
									arrived !== undefined ||
									departed !== undefined ||
									isCancelled !== undefined ||
									platform !== undefined ||
									isPlatformConfirmed !== undefined
								) {
									client.action(anyApi.data.pushPortUpdate, {
										subscriptionId: sub._id,
										rtDep,
										rtArr,
										arrived,
										departed,
										isCancelled,
										isCancelledAtFilter,
										platform,
										isPlatformConfirmed
									});
								}
							});
						}
					}
				}
			}

			// if (trainId === listenedTrain) {
			//   console.log("--- New Message Received ---");
			//   console.log(i);
			//   // console.log(parsed.bytes.ur?.TS);
			// }
		}
	});
};

run().catch((error) => {
	console.error('Connection Error:', error);
});
