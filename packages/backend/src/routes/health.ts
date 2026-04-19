import { Hono } from 'hono';

const healthRoute = new Hono();

healthRoute.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'webagent-backend',
    timestamp: new Date().toISOString(),
  });
});

export { healthRoute };
