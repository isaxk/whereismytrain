import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
	'refresh subscriptions',
	{ seconds: 30 }, // every minute
	internal.notifications.refresh
);

crons.interval(
	'delete arrived subscriptions',
	{
		minutes: 30
	},
	internal.notifications.deleteOld
);

export default crons;
