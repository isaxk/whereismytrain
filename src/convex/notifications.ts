import { v } from 'convex/values';
import dayjs from 'dayjs';

import { fetchService, parseSavedInfo } from '$lib/shared/service';
import type { SavedTrainServiceInfo } from '$lib/types';

import { internal } from './_generated/api';
import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	mutation
} from './_generated/server';

import type { Doc, Id } from './_generated/dataModel';

export const createSubscription = internalMutation({
	args: {
		fcmToken: v.string(),
		data: v.any(),
		serviceId: v.string()
	},
	handler: async (ctx, args): Promise<string> => {
		const result = await ctx.db.insert('subscriptions', {
			fcmToken: args.fcmToken,
			...args.data,
			serviceId: args.serviceId
		});
		return result;
	}
});

export const registerSubscription = action({
	args: {
		serviceId: v.string(),
		fcmToken: v.string(),
		focusCrs: v.string(),
		filterCrs: v.string()
	},
	handler: async (ctx, args): Promise<string> => {
		const data = await fetchService(
			args.serviceId,
			args.focusCrs,
			args.filterCrs,
			process.env.ACCESS_TOKEN!
		);

		const parsed = parseSavedInfo(data);

		const result = await ctx.runMutation(internal.notifications.createSubscription, {
			fcmToken: args.fcmToken,
			data: parsed,
			serviceId: args.serviceId
		});
		return result;
	}
});

export const getAllSubscriptions = internalQuery({
	args: {},
	handler: async (ctx) => {
		const subscriptions: Doc<'subscriptions'>[] = await ctx.db.query('subscriptions').collect();
		return subscriptions;
	}
});

export const updateSubscription = internalMutation({
	args: {
		id: v.id('subscriptions'),
		data: v.any()
	},
	handler: async (ctx, args) => {
		await ctx.db.patch('subscriptions', args.id, args.data);
	}
});

export const refresh = internalAction({
	args: {},
	handler: async (ctx): Promise<void> => {
		const subscriptions = await ctx.runQuery(internal.notifications.getAllSubscriptions);

		const services = new Map<string, SavedTrainServiceInfo>();

		await Promise.all(
			subscriptions.map(async (sub) => {
				const timeUntilDeparture = dayjs(sub.planDep).diff(dayjs(), 'minutes', true);
				const timeUntilArrival = dayjs(sub.planArr).diff(dayjs(), 'minutes', true);
				const timeSinceLastUpdate = dayjs().diff(dayjs(sub.refreshedAt), 'minutes', true);

				let shouldRefresh = true;

				if (sub.arrived) {
					shouldRefresh = false;
				}

				if (sub.departed) {
					if (timeUntilArrival > 15 && timeSinceLastUpdate < 5) {
						shouldRefresh = false;
					} else if (timeUntilArrival > 6 && timeSinceLastUpdate < 2) {
						shouldRefresh = false;
					}
				} else {
					if (timeUntilDeparture > 120 && timeSinceLastUpdate < 20) {
						shouldRefresh = false;
					} else if (timeUntilDeparture > 60 && timeSinceLastUpdate < 12) {
						shouldRefresh = false;
					} else if (timeUntilDeparture > 30 && timeSinceLastUpdate < 6) {
						shouldRefresh = false;
					} else if (timeUntilDeparture > 15 && timeSinceLastUpdate < 3) {
						shouldRefresh = false;
					}
				}

				if (!shouldRefresh) return;

				// console.log(sub);
				let newSub = services.get(sub.serviceId) ?? null;
				if (!newSub) {
					const response = await fetchService(
						sub.serviceId,
						sub.crs,
						sub.filter,
						process.env.ACCESS_TOKEN!
					);
					newSub = parseSavedInfo(response) ?? null;
					if (newSub) {
						services.set(sub.serviceId, newSub);
					} else {
						return;
					}
				}

				let title = null;
				let description = `${dayjs(newSub.planDep).format('HH:mm')} to ${sub.destination}`;

				if (newSub.isCancelledAtFilter && !sub.isCancelledAtFilter && !newSub.isCancelled) {
					title = `❌ Cancelled to ${sub.to}`;
					if (newSub.destination !== sub.destination) {
						description += ` will now terminate at ${newSub.destination}`;
					}
				} else if (newSub.departed) {
					if (!sub.departed) {
						if (newSub.delay === null) {
							title = `✅ Departed`;
						} else if (newSub.delay <= -1) {
							title = `✅ Departed ${-newSub.delay}m early (${dayjs(newSub.rtDep).format('HH:mm')})`;
						} else if (newSub.delay < 1) {
							title = `✅ Departed on time`;
						} else {
							title = `🟡 Departed ${newSub.delay}m late (${dayjs(newSub.rtDep).format('HH:mm')})`;
						}

						if (newSub.filterDelay !== null) {
							if (newSub.to !== newSub.destination) {
								description += `\nExp. ${dayjs(newSub.rtArr).format('HH:mm')} LLL at ${newSub.to}`;
							} else {
								description += `\nExp. arrival ${dayjs(newSub.rtArr).format('HH:mm')} LLL`;
							}
						}
						if (newSub.filterDelay !== null) {
							if (newSub.filterDelay <= -1) {
								description = description.replace('LLL', `(${-newSub.filterDelay}m early)`);
							} else if (newSub.filterDelay < 1) {
								description = description.replace('LLL', `(on time)`);
							} else {
								description = description.replace('LLL', `(${newSub.filterDelay}m late)`);
							}
						} else {
							description = description.replace('LLL', ' ');
						}
					} else if (newSub.filterDelay !== sub.filterDelay) {
						if (newSub.filterDelay === null) {
							title = `🟡 Exp. arrival Delayed`;
						} else if (newSub.filterDelay <= -1) {
							title = `🟡 Exp. arrival ${dayjs(newSub.rtArr).format('HH:mm')} (${-newSub.filterDelay}m early)`;
						} else if (newSub.filterDelay < 1) {
							title = `🟢 Arrival back on time (${dayjs(newSub.rtArr).format('HH:mm')})`;
						} else {
							title = `🟡 Exp. arrival ${dayjs(newSub.rtArr).format('HH:mm')} (${newSub.filterDelay}m late)`;
						}
					}
				} else if (newSub.isCancelled && !sub.isCancelled) {
					title = `❌ Cancelled`;
				} else if (newSub.delay !== sub.delay) {
					if (newSub.delay === null) {
						title = `🟡 Delayed`;
					} else if (newSub.delay <= -1) {
						title = `🟡 Expected  ${dayjs(newSub.rtDep).format('HH:mm')} (${-newSub.delay}m early)`;
					} else if (newSub.delay < 1) {
						title = `🟢 Back on time`;
					} else {
						title = `🟡 Expected ${dayjs(newSub.rtDep).format('HH:mm')} (${newSub.delay}m late)`;
					}
					if (newSub.platform) {
						description += ` • Platform ${newSub.platform}`;
					}
				}

				if (title) {
					console.log(title, description);
					await ctx.runAction(internal.fcm.sendFCM, {
						fcmToken: sub.fcmToken,
						title,
						description,
						data: { ...sub, ...newSub },
						tag: sub.serviceId + '-status'
					});
				}

				if (newSub.platform !== sub.platform) {
					const title = `🔄 Changed to Platform ${newSub.platform}`;
					let description = `${dayjs(newSub.planDep).format('HH:mm')} to ${sub.destination} • `;
					if (newSub.delay === null) {
						description += `Exp. Delayed`;
					} else if (newSub.delay <= -1) {
						description += `Exp. ${dayjs(newSub.rtDep).format('HH:mm')}`;
					} else if (newSub.delay > 1) {
						description += `Exp. ${dayjs(newSub.rtDep).format('HH:mm')}`;
					} else {
						description += `Exp. On time`;
					}
					await ctx.runAction(internal.fcm.sendFCM, {
						fcmToken: sub.fcmToken,
						title,
						description,
						data: { ...sub, ...newSub },
						tag: sub.serviceId + '-platform'
					});
				}

				if (
					newSub.destination !== sub.destination &&
					!newSub.isCancelled &&
					!newSub.isCancelledAtFilter
				) {
					const title = `🔄 Destination changed to ${newSub.destination}`;
					let description = `${dayjs(newSub.planDep).format('HH:mm')} to ${sub.destination} • `;
					if (newSub.delay === null) {
						description += `Exp. Delayed`;
					} else if (newSub.delay <= -1) {
						description += `Exp. ${dayjs(newSub.rtDep).format('HH:mm')}`;
					} else if (newSub.delay > 1) {
						description += `Exp. ${dayjs(newSub.rtDep).format('HH:mm')}`;
					} else {
						description += `Exp. On time`;
					}
					description += `\nStill calling at ${newSub.to}`;
					await ctx.runAction(internal.fcm.sendFCM, {
						fcmToken: sub.fcmToken,
						title,
						description,
						data: { ...sub, ...newSub },
						tag: sub.serviceId + '-destination'
					});
				}

				await ctx.runMutation(internal.notifications.updateSubscription, {
					id: sub._id,
					data: newSub
				});
			})
		);
	}
});

export const deregisterSubscription = mutation({
	args: {
		subscriptionId: v.id('subscriptions')
	},
  handler: async (ctx, args): Promise<void> => {
    try {
      await ctx.db.delete('subscriptions', args.subscriptionId);
    }
    catch (error) {
      console.error('Error deregistering subscription:', error);
    }
		
	}
});

export const deleteOld = internalMutation({
	args: {},
	handler: async (ctx) => {
		const subscriptions = await ctx.db
			.query('subscriptions')
			.withIndex('by_arrived', (q) => q.eq('arrived', true))
			.collect();

		await Promise.all(
			subscriptions.map(async (sub) => {
				await ctx.db.delete('subscriptions', sub._id);
			})
		);
	}
});
