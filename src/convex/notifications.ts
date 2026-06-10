import { Crons } from '@convex-dev/crons';
import { v } from 'convex/values';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { fetchService, parseSavedInfo } from '$lib/shared/service';

dayjs.extend(utc);
dayjs.extend(timezone);

import { components, internal } from './_generated/api';
import { action, internalMutation, query, mutation } from './_generated/server';

import type { Doc } from './_generated/dataModel';

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

		console.log('platformIsConfirmed', parsed?.isPlatformConfirmed);

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
				internal.data.refresh,
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

export const updateSubscription = internalMutation({
	args: {
		id: v.id('subscriptions'),
		data: v.any()
	},
	handler: async (ctx, args) => {
		await ctx.db.patch('subscriptions', args.id, args.data);
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
