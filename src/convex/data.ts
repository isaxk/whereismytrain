import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { api, internal } from './_generated/api';
import dayjs from 'dayjs';
import { templates } from './templates';
import type { SavedTrainServiceInfo } from '$lib/types';
import { fetchService, parseSavedInfo } from '$lib/shared/service';
import type { GenericActionCtx } from 'convex/server';
import type { DataModel } from './_generated/dataModel';

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

type NotificationData = {
	type: 'status' | 'destination' | 'platform';
	title: string;
	description: string;
};

const replacements: [string, string][] = [
	['Central', 'Ctl'],
	['North', 'N'],
	['South', 'S'],
	['East', 'E'],
	['West', 'W'],
	['Junction', 'Jn'],
	['Road', 'Rd'],
	['Square', 'Sq'],
	['Saint', 'St'],
	['Street', 'St'],
	['Parkway', 'Pkwy'],
	['Temple Meads', 'T M'],
	['Picadilly', 'Pic']
];

function shortenStationName(name: string): string {
	replacements.forEach((r) => {
		name = name.replaceAll(r[0], r[1]);
	});
	if (name !== 'London Bridge') {
		return name.replaceAll('London ', '');
	}
	if (name.includes('Heathrow')) {
		if (name.includes('5')) {
			return 'Terminal 5';
		} else if (name.includes('4')) {
			return 'Terminal 4';
		} else {
			return 'Terminals 12&3';
		}
	}

	return name;
}

function generateNotificationText(
	existing: SavedTrainServiceInfo,
	updated: SavedTrainServiceInfo
): NotificationData[] {
	const notifications: NotificationData[] = [];

	let title = `${dayjs(existing?.planDep).format('HH:mm')} to ${existing?.destination}`;

	if (updated.destination !== existing.destination) {
		const description = templates.destinationChange(updated.destination);
		if (description) {
			notifications.push({ title, description, type: 'destination' });
		}
		title = `${dayjs(existing?.planDep).format('HH:mm')} to ${updated?.destination}`;
	}

	if (
		updated.platform !== existing.platform ||
		(updated.isPlatformConfirmed && !existing.isPlatformConfirmed)
	) {
		const description = templates.platform(
			updated.platform,
			!updated.isPlatformConfirmed,
			updated.isPlatformConfirmed && !existing.isPlatformConfirmed
		);

		if (description) {
			notifications.push({ title, description, type: 'platform' });
		}
	}

	let description: string | undefined;
	if (
		updated.isCancelled !== existing.isCancelled &&
		!(!updated.isCancelled && updated.isCancelledAtFilter)
	) {
		description = templates.cancellation(
			updated.isCancelled,
			updated.filterDelay,
			updated.rtDep ? dayjs(updated.rtDep).format('HH:mm') : null
		);
	} else if (updated.isCancelledAtFilter !== existing.isCancelledAtFilter) {
		description = templates.filterCancellation(updated.isCancelledAtFilter, updated.filter);
	} else if (updated.departed === true) {
		if (!existing.departed) {
			description = templates.departure(
				updated.delay ?? 0,
				updated.filterDelay,
				updated.rtArr ? dayjs(updated.rtArr).format('HH:mm') : null,
				updated.to !== updated.destination ? shortenStationName(updated.to) : undefined
			);
		} else if (updated.filterDelay !== existing.filterDelay) {
			description = templates.filterDelay(
				updated.filterDelay,
				updated.rtArr ? dayjs(updated.rtArr).format('HH:mm') : null,
				updated.to !== updated.destination ? shortenStationName(updated.to) : undefined
			);
		}
	} else if (updated.delay !== existing.delay) {
		description = templates.delay(
			updated.delay,
			updated.rtDep ? dayjs(updated.rtDep).format('HH:mm') : null
		);
	}
	if (description) {
		notifications.push({ title, description, type: 'status' });
	}

	return notifications;
}

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

		if (existing) {
			const notifications = generateNotificationText(existing, updated).map((notification) => ({
				fcmToken: updated.fcmToken,
				title: notification.title,
				description: notification.description,
				data: updated,
				tag: `${updated._id}-${notification.type}`
			}));
			await ctx.runAction(internal.fcm.sendMultipleFCM, { notifications });
		}
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

				if (newSub && sub) {
					const notifications = generateNotificationText(sub, newSub).map((n) => ({
						fcmToken: sub.fcmToken,
						title: n.title,
						description: n.description,
						data: newSub,
						tag: `${sub._id}-${n.type}`
					}));
					await ctx.runAction(internal.fcm.sendMultipleFCM, { notifications });
				}

				await ctx.runMutation(internal.notifications.updateSubscription, {
					id: sub._id,
					data: newSub
				});
			})
		);
	}
});
