import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
	'refresh subscriptions',
	{ seconds: 30 }, // every minute
	internal.notifications.refresh
);

export default crons;
