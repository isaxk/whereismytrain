import { defineTable, defineSchema } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	subscriptions: defineTable({
		fcmToken: v.string(),
		serviceId: v.string(),
		crs: v.string(),
		filter: v.string(),
		focusTiploc: v.string(),
		filterTiploc: v.string(),
		planDep: v.string(),
		rtDep: v.union(v.null(), v.string()),
		delay: v.union(v.null(), v.number()),
		lastNotifiedDelay: v.union(v.null(), v.number()),
		departed: v.boolean(),
		planArr: v.string(),
		rtArr: v.union(v.null(), v.string()),
		filterDelay: v.union(v.null(), v.number()),
		lastNotifiedFilterDelay: v.union(v.null(), v.number()),
		arrived: v.boolean(),
		from: v.string(),
		to: v.string(),
		destination: v.string(),
		platform: v.union(v.null(), v.string()),
		isPlatformConfirmed: v.boolean(),
		isCancelled: v.boolean(),
		isCancelledAtFilter: v.boolean(),
		operator: v.object({
			id: v.string(),
			color: v.string(),
			name: v.string()
		}),
		refreshedAt: v.number()
	}).index('by_arrived', ['arrived']),
	tiplocs: defineTable({
		tiploc: v.string(),
		crs: v.string(),
		name: v.string(),
		longitude: v.number(),
		latitude: v.number()
	}).index('by_tiploc', ['tiploc'])
});
