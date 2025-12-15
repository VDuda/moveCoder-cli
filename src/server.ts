import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

const app = new Hono();

// Mount Better-Auth handler
app.all('/api/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
