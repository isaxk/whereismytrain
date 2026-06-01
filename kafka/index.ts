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

	// let i = 0;

	// Start the message loop
	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			const payload = message.value.toString();
			// i++;
			// if (i % 100 === 0) console.log(i);
			const parsed = JSON.parse(payload);

			// const trainId = parsed.bytes;
			if (parsed.bytes) {
				const bytesParsed = JSON.parse(parsed.bytes);

				// console.log(bytesParsed);

				if (bytesParsed.uR?.TS || bytesParsed.uR?.schedule) {
					const timeData = bytesParsed.uR?.TS;
					const scheduleData = bytesParsed.uR?.schedule;
					if (
						(timeData?.rid && subscribedTrains.has(timeData.rid)) ||
						(scheduleData?.rid && subscribedTrains.has(scheduleData.rid))
					) {
						const subs = subscribedTrains.get(timeData?.rid ?? scheduleData?.rid);
						subs.forEach((sub) => {
							let rtDep = undefined;
							let rtArr = undefined;
							let departed = undefined;
							let isCancelled = undefined;
							let platform = undefined;
							let isPlatformConfirmed = undefined;
							if (timeData) {
								console.log(timeData);
								const focus = Array.isArray(timeData.Location)
									? timeData.Location?.find((loc) => loc.tpl === sub.focusTiploc)
									: timeData.Location?.tpl === sub.focusTiploc
										? timeData.Location
										: undefined;
								if (focus) {
									rtDep = focus?.dep.delayed ? null : (focus?.dep.at ?? focus?.dep.et ?? undefined);
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
								if (focus?.can) {
									isCancelled = focus?.can;
								}
							}
							if (
								rtDep !== undefined ||
								rtArr !== undefined ||
								departed !== undefined ||
								isCancelled !== undefined ||
								platform !== undefined ||
								isPlatformConfirmed !== undefined
							) {
								client.action(anyApi.notifications.pushPortUpdate, {
									subscriptionId: sub._id,
									rtDep,
									rtArr,
									departed,
									isCancelled,
									platform,
									isPlatformConfirmed
								});
							}
						});
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
