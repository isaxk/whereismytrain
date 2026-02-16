import crons from '@convex-dev/crons/convex.config.js';
import { defineApp } from 'convex/server';

const app = defineApp();
app.use(crons);

export default app;
