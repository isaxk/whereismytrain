import { Crons } from '@convex-dev/crons';
import { v } from 'convex/values';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { fetchService, parseSavedInfo } from '$lib/shared/service';
import type { SavedTrainServiceInfo } from '$lib/types';

dayjs.extend(utc);
dayjs.extend(timezone);

import { api, components, internal } from './_generated/api';
import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	query,
	mutation
} from './_generated/server';

import type { Doc, Id } from './_generated/dataModel';
import { templates } from './templates';

const FLUTTER_THRESHOLD = 3;

function dayjsFromHHmm(hhmm: string, colon = true, tz?: string) {
	if (colon) {
		const [hh, mm] = hhmm.split(':').map(Number);
		return tz
			? dayjs.tz(undefined, tz).hour(hh).minute(mm).second(0).millisecond(0)
			: dayjs().hour(hh).minute(mm).second(0).millisecond(0);
	} else {
		const hours = hhmm.substring(0, 2);
		const minutes = hhmm.substring(2, 4);
		// console.log(hours, minutes);
		return tz
			? dayjs
					.tz(undefined, tz)
					.hour(parseInt(hours))
					.minute(parseInt(minutes))
					.second(0)
					.millisecond(0)
			: dayjs().hour(parseInt(hours)).minute(parseInt(minutes)).second(0).millisecond(0);
	}
}

const crons = new Crons(components.crons);

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
			lastNotifiedDelay: args.data.delay,
			lastNotifiedFilterDelay: args.data.filterDelay,
			serviceId: args.serviceId
		});
		return result;
	}
});

const REFRESHER_CRON_NAME = 'refresher-cron';

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
			process.env.SERVICE_DETAILS_TOKEN!
		);

		const parsed = parseSavedInfo(data);

		const result = await ctx.runMutation(internal.notifications.createSubscription, {
			fcmToken: args.fcmToken,
			data: parsed,
			serviceId: args.serviceId
		});

		let existingCron = null;

		try {
			existingCron = await crons.get(ctx, { name: REFRESHER_CRON_NAME });
		} catch (error) {
			console.error('Error getting refresher cron:', error);
		}

		console.log('existing refresher cron:', existingCron);

		if (existingCron === null) {
			await crons.register(
				ctx,
				{
					kind: 'interval',
					ms: 30 * 1000
				},
				internal.notifications.refresh,
				{},
				REFRESHER_CRON_NAME
			);
		}

		return result;
	}
});

export const getAllSubscriptions = query({
	args: {},
	handler: async (ctx) => {
		const subscriptions: Doc<'subscriptions'>[] = await ctx.db.query('subscriptions').collect();
		return subscriptions;
	}
});

export const getSubscription = query({
	args: {
		id: v.id('subscriptions')
	},
	handler: async (ctx, args) => {
		const subscription = await ctx.db.get('subscriptions', args.id);
		return subscription;
	}
});

export const pushPortUpdate = action({
	args: {
		subscriptionId: v.id('subscriptions'),
		rtDep: v.optional(v.union(v.string(), v.null())),
		departed: v.optional(v.boolean()),
		rtArr: v.optional(v.union(v.string(), v.null())),
		arrived: v.optional(v.boolean()),
		platform: v.optional(v.union(v.string(), v.null())),
		isPlatformConfirmed: v.optional(v.boolean()),
		isCancelled: v.optional(v.boolean()),
		isCancelledAtFilter: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		console.log(args);
		const existing = await ctx.runQuery(api.notifications.getSubscription, {
			id: args.subscriptionId
		});
		if (!existing) return;
		let delay = existing.delay;
		let filterDelay = existing.filterDelay;
		let rtDep = existing.rtDep ? dayjs(existing.rtDep).toISOString() : null;
		let rtArr = existing.rtArr ? dayjs(existing.rtArr).toISOString() : null;

		if (args.rtDep !== undefined) {
			delay = args.rtDep ? dayjsFromHHmm(args.rtDep).diff(dayjs(existing?.planDep), 'm') : null;
			rtDep = args.rtDep ? dayjsFromHHmm(args.rtDep).toISOString() : null;
			if (delay && rtDep && delay > 6 * 60) {
				delay = dayjs(rtDep).add(1, 'day').diff(dayjs(existing?.planDep), 'm');
				rtDep = dayjs(rtDep).add(1, 'day').toISOString();
			}
		}
		if (args.rtArr !== undefined) {
			filterDelay = args.rtArr
				? dayjsFromHHmm(args.rtArr).diff(dayjs(existing?.planArr), 'm')
				: null;
			rtArr = args.rtArr ? dayjsFromHHmm(args.rtArr).toISOString() : null;
			if (filterDelay && rtArr && filterDelay > 6 * 60) {
				filterDelay = dayjs(rtArr).add(1, 'day').diff(dayjs(existing?.planArr), 'm');
				rtArr = dayjs(rtArr).add(1, 'day').toISOString();
			}
		}

		const updated = {
			...existing,
			refreshedAt: Date.now(),
			isPlatformConfirmed:
				args.isPlatformConfirmed !== undefined
					? args.isPlatformConfirmed
					: existing.isPlatformConfirmed,
			platform: args.platform !== undefined ? args.platform : existing.platform,
			rtDep,
			rtArr,
			delay: delay === undefined ? existing.delay : delay,
			departed: args.departed !== undefined ? args.departed : existing.departed,
			filterDelay: filterDelay !== undefined ? filterDelay : existing.filterDelay,
			isCancelled: args.isCancelled !== undefined ? args.isCancelled : existing.isCancelled
		};

		await ctx.runMutation(internal.notifications.updateSubscription, {
			id: existing._id,
			data: updated
		});

		let title: string | null = null;
		let description = `${dayjs(existing?.planDep).format('HH:mm')} to ${existing?.destination}`;
		if (existing) {
			if (updated.departed === true) {
				if (!existing.departed) {
					const r = templates.departure(
						delay ?? 0,
						updated.filterDelay,
						updated.rtArr ? dayjs(updated.rtArr).format('HH:mm') : null,
						updated.to !== updated.destination ? updated.to : undefined
					);
					title = r.title;
					description += r.descriptionAppend;
				}
			} else if (updated.delay !== existing.delay) {
				title = templates.delay(
					updated.delay,
					updated.rtDep ? dayjs(updated.rtDep).format('HH:mm') : null
				);
			}
			if (title) {
				console.log(title, description);
				await ctx.runAction(internal.fcm.sendFCM, {
					fcmToken: existing.fcmToken,
					title,
					description,
					data: updated,
					tag: existing.serviceId + '-status'
				});
			}
			if (
				updated.platform !== existing.platform ||
				(updated.isPlatformConfirmed && !existing.isPlatformConfirmed)
			) {
				title = templates.platform(
					updated.platform,
					!updated.isPlatformConfirmed,
					updated.isPlatformConfirmed && !existing.isPlatformConfirmed
				);

				await ctx.runAction(internal.fcm.sendFCM, {
					fcmToken: existing.fcmToken,
					title,
					description,
					data: updated,
					tag: existing.serviceId + '-platform'
				});
			}
		}
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
		const subscriptions = await ctx.runQuery(api.notifications.getAllSubscriptions);

		const services = new Map<
			string,
			| (SavedTrainServiceInfo & {
					lastNotifiedDelay: number | null | undefined;
					lastNotifiedFilterDelay: number | null | undefined;
			  })
			| null
		>();

		await Promise.all(
			subscriptions.map(async (sub) => {
				const timeUntilDeparture = dayjs
					.tz(sub.planDep, 'Europe/London')
					.diff(dayjs(), 'minutes', true);
				const timeUntilArrival = dayjs
					.tz(sub.planArr, 'Europe/London')
					.diff(dayjs(), 'minutes', true);
				const timeSinceLastUpdate = dayjs().diff(dayjs(sub.refreshedAt), 'minutes', true);

				// console.log(
				// 	'timeUntilDeparture',
				// 	timeUntilDeparture,
				// 	'timeUntilArrival',
				// 	timeUntilArrival,
				// 	'timeSinceLastUpdate',
				// 	timeSinceLastUpdate
				// );

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
					} else if (timeUntilDeparture > 15 && timeSinceLastUpdate < 8) {
						shouldRefresh = false;
					} else if (timeSinceLastUpdate < 3) {
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
						process.env.SERVICE_DETAILS_TOKEN!
					);
					const parsed = parseSavedInfo(response) ?? null;
					newSub = parsed
						? { ...parsed, lastNotifiedDelay: undefined, lastNotifiedFilterDelay: undefined }
						: null;
					if (newSub) {
						services.set(sub.serviceId, newSub);
					} else {
						return;
					}
				}

				if (
					newSub.destination !== sub.destination &&
					!newSub.isCancelled &&
					!newSub.isCancelledAtFilter
				) {
					const title = `🔄 New destination: ${newSub.destination}`;
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
					if (newSub.destination !== newSub.to) {
						description += `\nStill calling at ${newSub.to}`;
					}
					await ctx.runAction(internal.fcm.sendFCM, {
						fcmToken: sub.fcmToken,
						title,
						description,
						data: { ...sub, ...newSub },
						tag: sub.serviceId + '-destination'
					});
				}

				if (newSub.platform !== sub.platform) {
					const title = `🔄 Changed to Platform ${newSub.platform}`;
					let description = `${dayjs(newSub.planDep).format('HH:mm')} to ${newSub.destination} • `;
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

				let title = null;
				let description = `${dayjs(newSub.planDep).format('HH:mm')} to ${newSub.destination}`;

				if (newSub.isCancelledAtFilter && !sub.isCancelledAtFilter && !newSub.isCancelled) {
					description = `${dayjs(newSub.planDep).format('HH:mm')} to ${sub.destination}`;
					title = `❌ Cancelled to ${sub.to}`;
					if (newSub.destination !== sub.destination) {
						description += ` will now terminate at ${newSub.destination}`;
					}
				} else if (!newSub.isCancelledAtFilter && sub.isCancelledAtFilter && !newSub.isCancelled) {
					title = `🟢 No longer cancelled to ${sub.to}`;
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
					} else if (
						newSub.filterDelay !== sub.filterDelay &&
						(!sub.lastNotifiedFilterDelay ||
							!newSub.filterDelay ||
							Math.abs(sub.lastNotifiedFilterDelay - newSub.filterDelay) >= FLUTTER_THRESHOLD)
					) {
						newSub.lastNotifiedFilterDelay = newSub.filterDelay;
						if (newSub.to === newSub.destination) {
							if (newSub.filterDelay === null) {
								title = `🟡 Exp. arrival Delayed`;
							} else if (newSub.filterDelay <= -1) {
								title = `🟡 Exp. arrival ${dayjs(newSub.rtArr).format('HH:mm')} (${-newSub.filterDelay}m early)`;
							} else if (newSub.filterDelay < 1) {
								title = `🟢 Arrival back on time (${dayjs(newSub.rtArr).format('HH:mm')})`;
							} else {
								title = `🟡 Exp. arrival ${dayjs(newSub.rtArr).format('HH:mm')} (${newSub.filterDelay}m late)`;
							}
						} else {
							if (newSub.filterDelay === null) {
								title = `🟡 Exp. Delayed at ${newSub.to}`;
							} else if (newSub.filterDelay <= -1) {
								title = `🟡 Exp. ${dayjs(newSub.rtArr).format('HH:mm')} (${-newSub.filterDelay}m early) at ${newSub.to}`;
							} else if (newSub.filterDelay < 1) {
								title = `🟢 Exp. On time (${dayjs(newSub.rtArr).format('HH:mm')}) at ${newSub.to}`;
							} else {
								title = `🟡 Exp. ${dayjs(newSub.rtArr).format('HH:mm')} (${newSub.filterDelay}m late) at ${newSub.to}`;
							}
						}
					}
				} else if (newSub.isCancelled && !sub.isCancelled) {
					title = `❌ Cancelled`;
				} else if (!newSub.isCancelled && sub.isCancelled) {
					title = `🟢 Uncancelled!`;
					if (newSub.delay === null) {
						title = `🟢 No longer cancelled! - Exp. Delayed`;
					} else if (newSub.delay <= -1) {
						title = `🟢 No longer cancelled! - Exp. ${dayjs(newSub.rtDep).format('HH:mm')} (${-newSub.delay}m early)`;
					} else if (newSub.delay < 1) {
						title = `🟢 No longer cancelled! - Exp. On time`;
					} else {
						title = `🟢 No longer cancelled! - Exp. ${dayjs(newSub.rtDep).format('HH:mm')} (${newSub.delay}m late)`;
					}
				} else if (
					newSub.delay !== sub.delay &&
					(!sub.lastNotifiedDelay ||
						!newSub.delay ||
						Math.abs(sub.lastNotifiedDelay - newSub.delay) >= FLUTTER_THRESHOLD)
				) {
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
					newSub.lastNotifiedDelay = newSub.delay;
				}

				if (title) {
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

				console.log(sub.filterDelay, newSub.filterDelay);

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
		} catch (error) {
			console.error('Error deregistering subscription:', error);
		}

		if ((await ctx.db.query('subscriptions').collect()).length === 0) {
			console.log('No subscriptions left, deleting cron');
			await crons.delete(ctx, { name: REFRESHER_CRON_NAME });
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

		if ((await ctx.db.query('subscriptions').collect()).length === 0) {
			console.log('No subscriptions left, deleting cron');
			await crons.delete(ctx, { name: REFRESHER_CRON_NAME });
		}
	}
});
